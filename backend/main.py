import asyncio
import json
import os
import string
import random
from datetime import datetime
import json

import re
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import rasterio

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Import your GIS loading function here
# Example: from load_gis_data import load_all_gis_layers


import sys
import subprocess

async def run_data_ingestion():
    """Background task to load spatial data into PostGIS without delaying port startup."""
    print("Starting background GIS data ingestion...")
    try:
        process = await asyncio.create_subprocess_exec(
            sys.executable, "import_local_maps.py",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT
        )
        # Log the output so we can see progress in the deployment logs
        while True:
            line = await process.stdout.readline()
            if not line:
                break
            print(line.decode("utf-8").strip())
            
        await process.wait()
        print(f"Background data ingestion completed with code {process.returncode}")
    except Exception as e:
            print(f"Error during background data ingestion: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: spawn data ingestion as a background task
    asyncio.create_task(run_data_ingestion())
    yield
    # Shutdown logic (if any)


app = FastAPI(title="Bangladesh Webmap API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Handle DATABASE_URL natively injected by Render or setup_db.py
env_db_url = os.getenv("DATABASE_URL")
if env_db_url:
    # SQLAlchemy asyncpg requires 'postgresql+asyncpg://' instead of 'postgres://' or 'postgresql://'
    if env_db_url.startswith("postgres://"):
        DATABASE_URL = env_db_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif env_db_url.startswith("postgresql://"):
        DATABASE_URL = env_db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    else:
        DATABASE_URL = env_db_url
else:
    # Fallback to manual construction
    DB_USER = os.getenv("POSTGRES_USER", "postgres")
    DB_PASS = os.getenv("POSTGRES_PASSWORD", "postgres")
    DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
    DB_PORT = os.getenv("POSTGRES_PORT", "5432")
    DB_NAME = os.getenv("POSTGRES_DB", "webmap")
    DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_async_engine(
    DATABASE_URL, 
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=10,
    max_overflow=20,
    connect_args={
        "command_timeout": 60
    },
    echo=False
)

# Standardized SQLAlchemy 2.0 Async Session Factory
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session


def slugify(text_val: str) -> str:
    text_val = text_val.strip().lower()
    text_val = re.sub(r"[^a-z0-9]+", "_", text_val)
    return text_val.strip("_")


CACHED_LAYERS = None

@app.get("/api/layers")
async def get_layers():
    global CACHED_LAYERS
    # if CACHED_LAYERS is not None:
    #     return CACHED_LAYERS

    md_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "Maps",
        "map_list.md",
    )
    layers = []
    if os.path.exists(md_path):
        with open(md_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        for line in lines:
            line = line.strip()
            if (
                not line
                or line.lower().startswith("| file name")
                or line.lower().startswith("|file name")
                or line.startswith("|-") or "---" in line
                or not line.startswith("|")
            ):
                continue
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(parts) >= 2:
                layer_name = parts[1]
                table_name = slugify(layer_name)
                tab_name = parts[2] if len(parts) >= 3 and parts[2] else "Uncategorized"
                show_first = (parts[3].strip().lower() in ["yes", "y"]) if len(parts) >= 4 else False
                layer_type = parts[4].strip() if len(parts) >= 5 else "Vector"
                data_type = parts[5].strip() if len(parts) >= 6 else ""
                transparency_str = parts[6].strip() if len(parts) >= 7 else ""
                transparency = None
                if transparency_str:
                    try:
                        transparency = float(transparency_str)
                    except ValueError:
                        pass
                
                derive = parts[7].strip() if len(parts) >= 8 else ""
                units = parts[8].strip() if len(parts) >= 9 else ""
                estimate = (parts[9].strip().lower() in ["yes", "y"]) if len(parts) >= 10 else False
                credit_page = parts[10].strip() if len(parts) >= 11 else ""
                zoom_level = parts[11].strip() if len(parts) >= 12 else ""
                classify_with = parts[12].strip() if len(parts) >= 13 else ""
                search_on = parts[13].strip() if len(parts) >= 14 else ""
                
                filename = parts[0]
                rendered_filename = None
                
                if layer_type.lower() == "raster":
                    maps_dir = os.path.join(os.path.dirname(__file__), "..", "Maps")
                    base_name, _ = os.path.splitext(filename)
                    base_norm = base_name.replace("_", " ")
                    if os.path.exists(maps_dir):
                        for f in os.listdir(maps_dir):
                            f_norm = f.replace("_", " ")
                            if f_norm.startswith(base_norm + "-Rendered"):
                                rendered_filename = f
                                break
                    if not rendered_filename:
                        rendered_filename = base_name + "-Rendered.tif"
                        
                    # Parse color map if exists
                    color_map_path = os.path.join(maps_dir, base_name + "-color_map.txt")
                    color_map = []
                    if os.path.exists(color_map_path):
                        with open(color_map_path, "r", encoding="utf-8") as cmf:
                            lines_cm = cmf.readlines()
                            passed_interp = False
                            for cm_line in lines_cm:
                                cm_line = cm_line.strip()
                                if not cm_line or cm_line.startswith("#"):
                                    continue
                                if cm_line.startswith("INTERPOLATION:"):
                                    passed_interp = True
                                    continue
                                if passed_interp:
                                    cm_parts = cm_line.split(",")
                                    if len(cm_parts) >= 6:
                                        r, g, b, a = cm_parts[1].strip(), cm_parts[2].strip(), cm_parts[3].strip(), cm_parts[4].strip()
                                        legend_name = ",".join(cm_parts[5:]).strip()
                                        color_map.append({
                                            "color": f"rgba({r}, {g}, {b}, {float(a)/255:.2f})",
                                            "label": legend_name
                                        })
                
                layers.append({
                    "name": layer_name, 
                    "table": table_name, 
                    "tab": tab_name, 
                    "show_first": show_first,
                    "type": layer_type,
                    "datatype": data_type,
                    "transparency": transparency,
                    "derive": derive,
                    "units": units,
                    "estimate": estimate,
                    "filename": filename,
                    "rendered_filename": rendered_filename,
                    "color_map": color_map if layer_type.lower() == "raster" else None,
                    "credit_page": credit_page,
                    "zoom_level": zoom_level,
                    "classify_with": classify_with,
                    "search_on": search_on
                })
    CACHED_LAYERS = layers
    return layers

@app.get("/api/about_us")
async def get_about_us():
    file_path = os.path.join(os.path.dirname(__file__), "..", "about_us.md")
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            return {"content": f.read()}
    return {"content": "About us content not found."}

@app.get("/api/layers/{table_name}")
async def get_layer_data(table_name: str, db: AsyncSession = Depends(get_db)):
    if not re.match(r"^[a-z0-9_]+$", table_name):
        raise HTTPException(status_code=400, detail="Invalid table name")

    layers = await get_layers()
    layer = next((l for l in layers if l["table"] == table_name), None)
    if layer and layer["type"].lower() == "raster":
        return {"type": "FeatureCollection", "features": []}

    query = text(f"""
        SELECT jsonb_build_object(
            'type',     'FeatureCollection',
            'features', coalesce(jsonb_agg(features.feature), '[]'::jsonb)
        )
        FROM (
            SELECT jsonb_build_object(
                'type',       'Feature',
                'id',         id,
                -- 'geometry',   ST_AsGeoJSON(geom)::jsonb,
                -- 'properties', to_jsonb(inputs) - 'geom' - 'id'
                'geometry',   ST_AsGeoJSON(ST_SimplifyPreserveTopology(geom, 0.001))::jsonb,
                'properties', to_jsonb(inputs) - 'geom' - 'id'
            ) AS feature
            FROM (SELECT * FROM "{table_name}") inputs
        ) features;
    """)

    try:
        result = await db.execute(query)
        geojson = result.scalar()
        if not geojson or not geojson.get("features"):
            return {"type": "FeatureCollection", "features": []}
        return geojson
    except Exception as e:
        print(f"Error fetching layer {table_name}: {e}")
        raise HTTPException(status_code=500, detail="Error fetching data")


async def estimate_level(db: AsyncSession, table_name: str, lat: float, lng: float, field: str):
    query = text(f"""
        SELECT "{field}", 
        ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) as dist
        FROM "{table_name}"
        WHERE "{field}" IS NOT NULL
        ORDER BY geom::geography <-> ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
        LIMIT 5
    """)
    result = await db.execute(query, {"lat": lat, "lng": lng})
    rows = result.fetchall()

    if not rows:
        return None

    num = 0.0
    den = 0.0
    for row in rows:
        val, dist = row
        # Convert meters to km
        d = dist / 1000.0

        # Division-by-Zero Protection
        if d == 0.0:
            return val

        weight = 1.0 / (d**2)
        num += weight * float(val)
        den += weight

    if den == 0:
        return None
    return num / den


import asyncio

@app.get("/api/estimate_water_levels")
async def get_estimate(lat: float, lng: float, active_tables: str = "", db: AsyncSession = Depends(get_db)):
    active_tables_list = active_tables.split(",") if active_tables else []
    try:
        layers = await get_layers()
        
        # Check bounds first
        bounds_table = None
        for lyr in layers:
            if lyr.get("datatype", "").strip().lower() == "bounds":
                bounds_table = lyr["table"]
                break
                
        if bounds_table:
            bounds_query = text(f"""
                SELECT EXISTS(
                    SELECT 1 FROM "{bounds_table}"
                    WHERE ST_Intersects(geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))
                )
            """)
            try:
                # We use begin_nested in case of transaction issues if table is missing
                async with db.begin_nested():
                    is_inside = await db.scalar(bounds_query, {"lat": lat, "lng": lng})
                if not is_inside:
                    return {"error": "This point is outside national bounds."}
            except Exception as e:
                print("Error checking bounds:", e)

        estimates = {}
        nearby_features = {}
        
        for lyr in layers:
            if active_tables_list and lyr["table"] not in active_tables_list:
                continue
            derive_str = lyr.get("derive", "")
            is_estimate = lyr.get("estimate", False)
            layer_type = lyr.get("type", "Vector").lower()
            table = lyr["table"]
            filename = lyr.get("filename", "")
            
            # Parse Derive string e.g. [contour, SHWL] or [contour, SHWL], [depth, SLWL]
            derive_list = []
            if derive_str:
                matches = re.findall(r'\[(.*?), *(.*?)\]', derive_str)
                if matches:
                    derive_list = [(m[0].strip(), m[1].strip()) for m in matches]
            if not derive_list:
                derive_list = [(None, lyr["name"])]
                
            units_list = [u.strip() for u in lyr.get("units", "").split(",")] if lyr.get("units") else []
            if "WindSpeed" in lyr.get("filename", ""):
                print("DEBUG UNITS for", lyr.get("filename"), "is:", repr(lyr.get("units")), "list:", units_list)
            
            if is_estimate:
                if layer_type == "raster":
                    # Query raster directly via rasterio
                    tif_path = os.path.join(os.path.dirname(__file__), "..", "Maps", filename)
                    val = None
                    if os.path.exists(tif_path):
                        with rasterio.open(tif_path) as src:
                            try:
                                sample_lon, sample_lat = lng, lat
                                # If bounds are in meters (e.g. EPSG:3857), convert lat/lng to Web Mercator
                                if abs(src.bounds.left) > 180 or abs(src.bounds.right) > 180:
                                    import math
                                    sample_lon = lng * (math.pi / 180.0) * 6378137.0
                                    sample_lat = math.log(math.tan((90.0 + lat) * (math.pi / 360.0))) * 6378137.0

                                for v in src.sample([(sample_lon, sample_lat)]):
                                    val = float(v[0])
                                    # For elevation missing values, handle nodata if needed
                                    if val < -9000:
                                        val = None
                                    break
                            except Exception:
                                pass
                    if val is not None:
                        for i, (field, display) in enumerate(derive_list):
                            unit_str = units_list[i] if i < len(units_list) else (units_list[-1] if units_list else "")
                            estimates[display] = {"value": val, "unit": unit_str}
                elif layer_type == "vector":
                    for i, (field, display) in enumerate(derive_list):
                        if field:
                            val = await estimate_level(db, table, lat, lng, field)
                            if val is not None:
                                unit_str = units_list[i] if i < len(units_list) else (units_list[-1] if units_list else "")
                                estimates[display] = {"value": val, "unit": unit_str}
            elif layer_type == "vector":
                # Find nearest overlapping/nearby feature
                try:
                    query = text(f"""
                        SELECT to_jsonb(inputs) - 'geom' - 'id' as props
                        FROM "{table}" inputs
                        WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, 100)
                        LIMIT 10
                    """)
                    async with db.begin_nested():
                        res = await db.execute(query, {"lat": lat, "lng": lng})
                        rows = res.fetchall()
                except Exception:
                    rows = []
                
                if rows:
                    for i, (field, display) in enumerate(derive_list):
                        feature_names = set()
                        unit_str = units_list[i] if i < len(units_list) else (units_list[-1] if units_list else "")
                        for r in rows:
                            props = r[0]
                            if not props: continue
                            if field:
                                val = props.get(field)
                            else:
                                val = props.get("f_class_name") or props.get("name") or props.get("Type") or props.get("type") or props.get("feature_name") or props.get("road_name") or props.get("river_name")
                            if val:
                                val_str = str(val)
                                print("DEBUG NEARBY val:", repr(val_str), "unit:", repr(unit_str))
                                if unit_str:
                                    val_str = f"{val_str} {unit_str}"
                                feature_names.add(val_str)
                        if feature_names:
                            nearby_features[display] = ", <br>".join(feature_names)
                        
        return {"estimates": estimates, "nearby": nearby_features}
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("Error estimating levels:", e)
        raise HTTPException(status_code=500, detail="Error calculating estimations")


# Mount static assets at root (placed last so dynamic routes take precedence)
tiles_dir = os.path.join(os.path.dirname(__file__), "..", "Maps", "tiles")
os.makedirs(tiles_dir, exist_ok=True)
app.mount("/tiles", StaticFiles(directory=tiles_dir), name="tiles")


app.mount("/maps", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "..", "Maps")), name="maps")
app.mount("/borelogs", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "..", "Maps", "borelogs", "published")), name="borelogs")
app.mount("/staged-borelogs", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "..", "Maps", "borelogs", "staged")), name="staged-borelogs")


import base64
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import shutil

security = HTTPBasic()

def check_admin(credentials: HTTPBasicCredentials = Depends(security)):
    env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
    expected_user = os.getenv("WEBMASTER_USERNAME")
    expected_pass = os.getenv("WEBMASTER_PASSWORD")
    
    try:
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as ef:
                for line in ef:
                    line = line.strip()
                    if not line or line.startswith("#"): continue
                    if "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip().upper()
                        v = v.strip().strip("'").strip('"')
                        if k == "WEBMASTER_USERNAME": expected_user = v
                        elif k == "WEBMASTER_PASSWORD": expected_pass = v
    except Exception:
        pass
        
    if not expected_user or not expected_pass:
        raise HTTPException(status_code=401, detail="Invalid credentials (not configured)")
        
    if credentials.username != expected_user or credentials.password != expected_pass:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return credentials.username

def generate_borelog_id():
    return "".join(random.choices(string.ascii_letters + string.digits, k=8))

def validate_borelog_payload(payload: dict) -> list[str]:
    errors = []
    props = payload.get("properties") or {}
    geom = payload.get("geometry") or {}
    coords = geom.get("coordinates") or [0, 0]

    try:
        lat = float(coords[0])
        lng = float(coords[1])
    except (ValueError, TypeError, IndexError):
        lat, lng = None, None

    # 1. Mandatory Metadata Checks
    borelog_name = str(props.get("borelog_name") or props.get("name") or "").strip()
    if not borelog_name:
        errors.append("Borelog Name is required.")

    eng_team = str(props.get("engineering_team") or props.get("drilling_team") or "").strip()
    if not eng_team:
        errors.append("Engineering Team (or Drilling Team) is required.")

    location = str(props.get("location") or "").strip()
    if not location:
        errors.append("Location is required.")

    date_start = str(props.get("date_of_starting_boring") or "").strip()
    if not date_start:
        errors.append("Date of Starting Boring is required.")

    date_end = str(props.get("date_of_ending_boring") or "").strip()
    if date_start and date_end:
        try:
            d_start = datetime.strptime(date_start[:10], "%Y-%m-%d")
            d_end = datetime.strptime(date_end[:10], "%Y-%m-%d")
            if d_end < d_start:
                errors.append(f"Date of Completion ({date_end}) cannot be earlier than Date of Starting ({date_start}).")
        except Exception:
            pass

    if lat is None or lng is None or (lat == 0 and lng == 0):
        errors.append("Valid borehole Coordinates (Latitude, Longitude) must be specified.")
    else:
        if not (-90 <= lat <= 90):
            errors.append(f"Latitude ({lat}) must be between -90 and 90 degrees.")
        if not (-180 <= lng <= 180):
            errors.append(f"Longitude ({lng}) must be between -180 and 180 degrees.")

    # Reduced Level (RL)
    rl = props.get("rl_m")
    if rl is None or rl == "":
        errors.append("Reduced Level (RL in m) must be specified.")
    else:
        try:
            float(rl)
        except (ValueError, TypeError):
            errors.append("Reduced Level (RL in m) must be a valid number.")

    # Total Depth
    total_depth = None
    depth_val = props.get("depth_m")
    if depth_val is None or depth_val == "":
        errors.append("Total Borehole Depth (m) must be specified and strictly greater than 0.")
    else:
        try:
            total_depth = float(depth_val)
            if total_depth <= 0:
                errors.append("Total Borehole Depth (m) must be strictly greater than 0.")
        except (ValueError, TypeError):
            errors.append("Total Borehole Depth (m) must be a valid number.")

    # Water Table
    wt = props.get("water_table_m")
    if wt is not None and wt != "":
        try:
            if float(wt) < 0:
                errors.append(f"Water Table Depth ({wt} m) cannot be negative.")
        except (ValueError, TypeError):
            pass

    # 2. Sounding / Geotechnical Minimum Existence Rule
    strata = props.get("strata") or []
    spt = props.get("spt_data") or []
    cpt = props.get("cpt_data") or []

    if not strata:
        errors.append("At least one Stratigraphy layer must be provided.")
    if not spt and not cpt:
        errors.append("Sounding data missing: At least one in-situ sounding test (SPT or CPT data) must be provided alongside Stratigraphy.")

    def check_non_neg(val, name, ctx):
        if val is not None and val != "":
            try:
                f = float(val)
                if f < 0:
                    errors.append(f"{ctx}: {name} ({val}) cannot be negative.")
            except (ValueError, TypeError):
                pass

    def check_depth(d, ctx):
        if d is not None and d != "":
            try:
                f = float(d)
                if f < 0:
                    errors.append(f"{ctx}: Depth ({f} m) cannot be negative.")
                elif total_depth is not None and total_depth > 0 and f > (total_depth + 0.05):
                    errors.append(f"{ctx}: Depth ({f} m) exceeds total borehole depth ({total_depth} m).")
            except (ValueError, TypeError):
                pass

    # 3. Stratigraphy Integrity
    if strata:
        try:
            first_top = float(strata[0].get("top_m", 0))
            if abs(first_top) > 0.001:
                errors.append(f"Stratigraphy must begin at ground surface (0.0 m). First layer starts at {first_top} m.")
        except (ValueError, TypeError):
            pass

        for i, layer in enumerate(strata):
            l_num = i + 1
            try:
                top = float(layer.get("top_m", 0))
                bottom = float(layer.get("bottom_m", 0))
                if bottom <= top:
                    errors.append(f"Stratigraphy Layer {l_num}: Bottom depth ({bottom} m) must be strictly greater than top depth ({top} m).")
                if total_depth is not None and total_depth > 0 and bottom > (total_depth + 0.05):
                    errors.append(f"Stratigraphy Layer {l_num}: Bottom depth ({bottom} m) exceeds total borehole depth ({total_depth} m).")
                if i > 0:
                    prev_bottom = float(strata[i-1].get("bottom_m", 0))
                    if abs(top - prev_bottom) > 0.01:
                        errors.append(f"Stratigraphy discontinuity: Layer {l_num} starts at {top} m, but Layer {l_num-1} ends at {prev_bottom} m.")
            except (ValueError, TypeError):
                errors.append(f"Stratigraphy Layer {l_num}: Top and Bottom depths must be numeric.")

    # 4. SPT Data Validation
    for idx, row in enumerate(spt):
        ctx = f"SPT Row {idx + 1}"
        check_depth(row.get("depth_m"), ctx)
        check_non_neg(row.get("blows_0_150"), "Blows (0-150mm)", ctx)
        check_non_neg(row.get("blows_150_300"), "Blows (150-300mm)", ctx)
        check_non_neg(row.get("blows_300_450"), "Blows (300-450mm)", ctx)
        n_val = row.get("n_value")
        if n_val is not None and str(n_val).strip() != "":
            try:
                if float(n_val) < 0:
                    errors.append(f"{ctx}: N-value ({n_val}) cannot be negative.")
            except (ValueError, TypeError):
                pass

    # 5. Atterberg Limits Validation
    for idx, row in enumerate(props.get("atterberg_test_data") or []):
        ctx = f"Atterberg Limits Row {idx + 1}"
        check_depth(row.get("depth_m"), ctx)
        check_non_neg(row.get("wc"), "Water Content", ctx)
        check_non_neg(row.get("ll"), "Liquid Limit", ctx)
        check_non_neg(row.get("pl"), "Plastic Limit", ctx)

        ll = row.get("ll")
        pl = row.get("pl")
        if ll is not None and pl is not None and ll != "" and pl != "":
            try:
                f_ll = float(ll)
                f_pl = float(pl)
                if (f_ll > 0 or f_pl > 0) and f_ll <= f_pl:
                    errors.append(f"{ctx}: Liquid Limit ({f_ll}%) must be strictly greater than Plastic Limit ({f_pl}%).")
            except (ValueError, TypeError):
                pass

    # 6. Grain Size Analysis Validation
    for idx, row in enumerate(props.get("grain_size_analysis_data") or []):
        ctx = f"Grain Size Row {idx + 1}"
        check_depth(row.get("depth_m"), ctx)
        check_non_neg(row.get("sand"), "Sand %", ctx)
        check_non_neg(row.get("silt"), "Silt %", ctx)
        check_non_neg(row.get("clay"), "Clay %", ctx)
        try:
            sand = float(row.get("sand") or 0)
            silt = float(row.get("silt") or 0)
            clay = float(row.get("clay") or 0)
            if sand > 100 or silt > 100 or clay > 100:
                errors.append(f"{ctx}: Individual particle fractions cannot exceed 100%.")
            if (sand + silt + clay) > 105:
                errors.append(f"{ctx}: Sum of fractions ({sand + silt + clay:.1f}%) exceeds 100%.")
        except (ValueError, TypeError):
            pass

    # 7. CPT Data Validation
    for idx, row in enumerate(cpt):
        ctx = f"CPT Row {idx + 1}"
        check_depth(row.get("depth_m"), ctx)
        check_non_neg(row.get("qc_mpa"), "Tip Resistance qc", ctx)
        check_non_neg(row.get("fs_kpa"), "Sleeve Friction fs", ctx)
        check_non_neg(row.get("rf_percent"), "Friction Ratio Rf", ctx)

    # 8. Direct Shear Test Validation
    for idx, row in enumerate(props.get("direct_shear_test_data") or []):
        ctx = f"Direct Shear Row {idx + 1}"
        check_depth(row.get("depth_m"), ctx)
        check_non_neg(row.get("normal_stress_kpa"), "Normal Stress", ctx)
        check_non_neg(row.get("shear_stress_kpa"), "Shear Stress", ctx)
        check_non_neg(row.get("cohesion_kpa"), "Cohesion c", ctx)
        check_non_neg(row.get("friction_angle_deg"), "Friction Angle φ", ctx)
        fa = row.get("friction_angle_deg")
        if fa is not None and fa != "":
            try:
                if float(fa) > 90:
                    errors.append(f"{ctx}: Friction angle ({fa}°) cannot exceed 90°.")
            except (ValueError, TypeError):
                pass

    # 9. 1-D Consolidation Test Validation
    for idx, row in enumerate(props.get("consolidation_test_data") or []):
        ctx = f"Consolidation Row {idx + 1}"
        check_depth(row.get("depth_m"), ctx)
        check_non_neg(row.get("vertical_effective_stress_kpa"), "Vertical Effective Stress", ctx)
        check_non_neg(row.get("constrained_modulus_eoed_mpa"), "Constrained Modulus", ctx)
        check_non_neg(row.get("compression_index"), "Compression Index Cc", ctx)
        check_non_neg(row.get("recompression_index"), "Recompression Index Cr", ctx)
        check_non_neg(row.get("preconsolidation_pressure_kpa"), "Preconsolidation Pressure", ctx)

        cc = row.get("compression_index")
        cr = row.get("recompression_index")
        if cc is not None and cr is not None and cc != "" and cr != "":
            try:
                f_cc = float(cc)
                f_cr = float(cr)
                if f_cc > 0 and f_cr > 0 and f_cr >= f_cc:
                    errors.append(f"{ctx}: Recompression Index Cr ({f_cr}) must be strictly less than Compression Index Cc ({f_cc}).")
            except (ValueError, TypeError):
                pass

    # 10. Triaxial Test Validation
    for idx, row in enumerate(props.get("triaxial_test_data") or []):
        ctx = f"Triaxial Row {idx + 1}"
        check_depth(row.get("depth_m"), ctx)
        check_non_neg(row.get("effective_confining_stress_kpa"), "Confining Stress", ctx)
        check_non_neg(row.get("peak_deviator_stress_kpa"), "Deviator Stress", ctx)
        check_non_neg(row.get("secant_modulus_e50_mpa"), "Secant Modulus E50", ctx)

    return errors

@app.post("/api/borelog/stage")
async def stage_borelog(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.json()
    
    # Enforce Geotechnical Validation Rules
    validation_errors = validate_borelog_payload(payload)
    if validation_errors:
        raise HTTPException(status_code=422, detail=validation_errors)
    
    props = payload.get("properties", {})
    original_borelog_name = str(props.get("borelog_name", props.get("name", "UNKNOWN")))
    
    # 1. Parse Name
    b_name = re.sub(r'[\\/*?:"<>|]', '_', original_borelog_name)
    if len(b_name) > 38:
        b_name = b_name[:38]
    elif len(b_name) < 38:
        needed = 38 - len(b_name)
        if needed == 1:
            b_name = b_name + "-"
        else:
            b_name = b_name + "-" + "".join(random.choices(string.ascii_letters + string.digits, k=needed - 1))
            
    # 2. Date in ddMMyyyy
    date_str = datetime.now().strftime("%d%m%Y")
    
    staged_dir = os.path.join(os.path.dirname(__file__), "..", "Maps", "borelogs", "staged")
    pub_dir = os.path.join(os.path.dirname(__file__), "..", "Maps", "borelogs", "published")
    os.makedirs(staged_dir, exist_ok=True)
    os.makedirs(pub_dir, exist_ok=True)
    
    # 3. Random 8 chars + Duplication Check
    while True:
        rand_str = generate_borelog_id()
        new_borelog_id = date_str + rand_str
        uid = f"{b_name}-{date_str}-{rand_str}"
        f_file = f"{uid}.JSON"
        file_path = os.path.join(staged_dir, f_file)
        pub_path = os.path.join(pub_dir, f_file)
        
        if not os.path.exists(file_path) and not os.path.exists(pub_path):
            break
            
    # Update payload
    payload["properties"]["borelog_name"] = b_name
    payload["properties"]["borelog_id"] = new_borelog_id
    payload["properties"]["uid"] = uid
    borelog_id = new_borelog_id
    
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
        
    coords = payload.get("geometry", {}).get("coordinates", [0, 0])
    lat, lon = coords[0], coords[1]
    
    project = props.get("project", "")
    client = props.get("client", "")
    
    # Static Keys Convention
    keys_str = "'[borelog_name, Borelog Name], [borelog_id, ID], [xcoord, Easting], [ycoord, Northing], [f_file(=>{type:file, format:JSON, location: `./Maps/borelogs/staged/`}, See Borelog, imodal, borelog-modal=>),Details]'"

    f_class_color = "#ff4053"
    
    query = text("""
        INSERT INTO awaiting_borelogs (geom, borelog_id, project, client, f_file, borelog_name, "keys", f_class_color, xcoord, ycoord, uid)
        VALUES (
            ST_SetSRID(ST_MakePoint(:lon, :lat), 4326),
            :borelog_id, :project, :client, :f_file, :borelog_name, :keys, :f_class_color, :lon, :lat, :uid
        )
    """)
    await db.execute(query, {
        "lon": lon,
        "lat": lat,
        "borelog_id": borelog_id,
        "project": project,
        "client": client,
        "f_file": f_file,
        "borelog_name": b_name,
        "uid": uid,
        "keys": keys_str,
        "f_class_color": f_class_color
    })
    await db.commit()

    # Sync with awaiting_borelogs.geojson
    awaiting_path = os.path.join(os.path.dirname(__file__), "..", "Maps", "awaiting_borelogs.geojson")
    if os.path.exists(awaiting_path):
        try:
            with open(awaiting_path, "r", encoding="utf-8") as f:
                awaiting_data = json.load(f)
                
            awaiting_data.setdefault("features", []).append({
                "type": "Feature",
                "properties": {
                    "borelog_id": borelog_id,
                    "project": project,
                    "client": client,
                    "borelog_name": b_name,
                    "xcoord": lon,
                    "ycoord": lat,
                    "keys": keys_str,
                    "f_class_color": f_class_color,
                    "uid": uid,
                    "f_file": f_file
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [lon, lat]
                }
            })
            
            with open(awaiting_path, "w", encoding="utf-8") as f:
                json.dump(awaiting_data, f, indent=2)
        except Exception as e:
            print(f"Warning: Failed to sync awaiting_borelogs.geojson: {e}")

    return {"status": "ok", "f_file": f_file, "uid": uid}

@app.get("/api/borelog/auth")
async def verify_auth(username: str = Depends(check_admin)):
    return {"status": "success"}

@app.get("/api/borelog/staged_list")
async def get_staged_borelogs(username: str = Depends(check_admin)):
    staged_dir = os.path.join(os.path.dirname(__file__), "..", "Maps", "borelogs", "staged")
    files = []
    if os.path.exists(staged_dir):
        for f in os.listdir(staged_dir):
            if f.endswith(".JSON"):
                try:
                    with open(os.path.join(staged_dir, f), "r", encoding="utf-8") as jf:
                        data = json.load(jf)
                        files.append({"f_file": f, "properties": data.get("properties", {})})
                except: pass
    return {"files": files}

@app.post("/api/borelog/approve/{f_file}")
async def approve_staged_borelog(f_file: str, db: AsyncSession = Depends(get_db), username: str = Depends(check_admin)):
    staged_dir = os.path.join(os.path.dirname(__file__), "..", "Maps", "borelogs", "staged")
    published_dir = os.path.join(os.path.dirname(__file__), "..", "Maps", "borelogs", "published")
    file_path = os.path.join(staged_dir, f_file)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    props = data.get("properties", {})
    borelog_id = props.get("borelog_id", "Unknown")
    project = props.get("project", "")
    client = props.get("client", "")
    coords = data.get("geometry", {}).get("coordinates", [0, 0])
    lat, lon = coords[0], coords[1]
    
    uid = re.sub(r'\.json$', '', f_file, flags=re.IGNORECASE)
    b_name = props.get("borelog_name", uid[:38])
    
    # check collision and move
    if os.path.exists(os.path.join(published_dir, f_file)):
        # base_name_and_date should have 38 + 1 + 8 chars
        parts = uid.split("-")
        base_name_and_date = "-".join(parts[:-1])
        date_str = parts[-2] if len(parts) >= 2 else datetime.now().strftime("%d%m%Y")
        
        while True:
            new_rand = generate_borelog_id()
            new_uid = f"{base_name_and_date}-{new_rand}"
            new_f_file = f"{new_uid}.JSON"
            if not os.path.exists(os.path.join(published_dir, new_f_file)):
                break
                
        f_file = new_f_file
        uid = new_uid
        borelog_id = date_str + new_rand
        data["properties"]["borelog_id"] = borelog_id
        data["properties"]["uid"] = uid
        data["properties"]["borelog_name"] = b_name
        
        with open(os.path.join(published_dir, f_file), "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        os.remove(file_path)
    else:
        shutil.move(file_path, os.path.join(published_dir, f_file))
    
    keys_str = "'[borelog_name, Borelog Name], [borelog_id, ID], [xcoord, Easting], [ycoord, Northing], [f_file(=>{type:file, format:JSON, location: `./Maps/borelogs/published/`}, See Borelog, imodal, borelog-modal=>),Details]'"
    f_class_color = "#3b82f6"

    # update db
    await db.execute(text("DELETE FROM awaiting_borelogs WHERE f_file = :f_file"), {"f_file": f_file})
    query = text("""
        INSERT INTO appended_borelogs (geom, borelog_id, project, client, f_file, borelog_name, "keys", f_class_color, xcoord, ycoord, uid)
        VALUES (
            ST_SetSRID(ST_MakePoint(:lon, :lat), 4326),
            :borelog_id, :project, :client, :f_file, :borelog_name, :keys, :f_class_color, :lon, :lat, :uid
        )
    """)
    await db.execute(query, {
        "lon": lon,
        "lat": lat,
        "borelog_id": borelog_id,
        "project": project,
        "client": client,
        "f_file": f_file,
        "borelog_name": b_name,
        "uid": uid,
        "keys": keys_str,
        "f_class_color": f_class_color
    })
    await db.commit()

    # 1. Remove from awaiting_borelogs.geojson
    awaiting_path = os.path.join(os.path.dirname(__file__), "..", "Maps", "awaiting_borelogs.geojson")
    if os.path.exists(awaiting_path):
        try:
            with open(awaiting_path, "r", encoding="utf-8") as f:
                awaiting_data = json.load(f)
            awaiting_data["features"] = [feat for feat in awaiting_data.get("features", []) 
                                         if feat.get("properties", {}).get("f_file") != f_file]
            with open(awaiting_path, "w", encoding="utf-8") as f:
                json.dump(awaiting_data, f, indent=2)
        except Exception as e:
            print(f"Warning: Failed to sync awaiting_borelogs.geojson: {e}")

    # 2. Add to appended_borelogs.geojson
    appended_path = os.path.join(os.path.dirname(__file__), "..", "Maps", "appended_borelogs.geojson")
    if os.path.exists(appended_path):
        try:
            with open(appended_path, "r", encoding="utf-8") as f:
                appended_data = json.load(f)
                
            appended_data.setdefault("features", []).append({
                "type": "Feature",
                "properties": {
                    "borelog_id": borelog_id,
                    "project": project,
                    "client": client,
                    "borelog_name": b_name,
                    "xcoord": lon,
                    "ycoord": lat,
                    "keys": keys_str,
                    "f_class_color": f_class_color,
                    "uid": uid,
                    "f_file": f_file
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [lon, lat]
                }
            })
            with open(appended_path, "w", encoding="utf-8") as f:
                json.dump(appended_data, f, indent=2)
        except Exception as e:
            print(f"Warning: Failed to sync appended_borelogs.geojson: {e}")

    return {"status": "success"}

@app.post("/api/borelog/reject/{f_file}")
async def reject_staged_borelog(f_file: str, db: AsyncSession = Depends(get_db), username: str = Depends(check_admin)):
    staged_dir = os.path.join(os.path.dirname(__file__), "..", "Maps", "borelogs", "staged")
    file_path = os.path.join(staged_dir, f_file)
    if os.path.exists(file_path):
        os.remove(file_path)
    
    await db.execute(text("DELETE FROM awaiting_borelogs WHERE f_file = :f_file"), {"f_file": f_file})
    await db.commit()

    # Sync: Remove from awaiting_borelogs.geojson
    awaiting_path = os.path.join(os.path.dirname(__file__), "..", "Maps", "awaiting_borelogs.geojson")
    if os.path.exists(awaiting_path):
        try:
            with open(awaiting_path, "r", encoding="utf-8") as f:
                awaiting_data = json.load(f)
            awaiting_data["features"] = [feat for feat in awaiting_data.get("features", []) 
                                         if feat.get("properties", {}).get("f_file") != f_file]
            with open(awaiting_path, "w", encoding="utf-8") as f:
                json.dump(awaiting_data, f, indent=2)
        except Exception as e:
            print(f"Warning: Failed to sync awaiting_borelogs.geojson on reject: {e}")

    return {"status": "success"}

import sys
import subprocess
import asyncio
from fastapi.responses import StreamingResponse

@app.post("/api/maps/update")
async def update_maps(username: str = Depends(check_admin)):
    async def log_generator():
        process = await asyncio.create_subprocess_exec(
            sys.executable, "import_local_maps.py",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT
        )
        while True:
            line = await process.stdout.readline()
            if not line:
                break
            yield line.decode("utf-8")
        await process.wait()
        yield f"\n[Process exited with code {process.returncode}]\n"
        
    return StreamingResponse(log_generator(), media_type="text/plain")

app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")





