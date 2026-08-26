import asyncio
import json
import os
import re
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import rasterio

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Import your GIS loading function here
# Example: from load_gis_data import load_all_gis_layers


async def run_data_ingestion():
    """Background task to load spatial data into PostGIS without delaying port startup."""
    print("Starting background GIS data ingestion...")
    try:
        # If your loading function is asynchronous:
        # await load_all_gis_layers()

        # If your loading function is synchronous (blocking):
        # await asyncio.to_thread(load_all_gis_layers)
        pass
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


@app.get("/api/layers")
async def get_layers():
    md_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "Maps",
        "list_of_maps_for_the_webmap_and_their_names.md",
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
                transparency_str = parts[5].strip() if len(parts) >= 6 else ""
                transparency = None
                if transparency_str:
                    try:
                        transparency = float(transparency_str)
                    except ValueError:
                        pass
                
                derive = parts[6].strip() if len(parts) >= 7 else ""
                units = parts[7].strip() if len(parts) >= 8 else ""
                estimate = (parts[8].strip().lower() in ["yes", "y"]) if len(parts) >= 9 else False
                credit_page = parts[9].strip() if len(parts) >= 10 else ""
                
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
                
                layers.append({
                    "name": layer_name, 
                    "table": table_name, 
                    "tab": tab_name, 
                    "show_first": show_first,
                    "type": layer_type,
                    "transparency": transparency,
                    "derive": derive,
                    "units": units,
                    "estimate": estimate,
                    "filename": filename,
                    "rendered_filename": rendered_filename,
                    "credit_page": credit_page
                })
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
            
            if is_estimate:
                if layer_type == "raster":
                    # Query raster directly via rasterio
                    tif_path = os.path.join(os.path.dirname(__file__), "..", "Maps", filename)
                    val = None
                    if os.path.exists(tif_path):
                        with rasterio.open(tif_path) as src:
                            try:
                                for v in src.sample([(lng, lat)]):
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
                        for r in rows:
                            props = r[0]
                            if not props: continue
                            if field:
                                val = props.get(field)
                            else:
                                val = props.get("f_class_name") or props.get("name") or props.get("Type") or props.get("type") or props.get("feature_name") or props.get("road_name") or props.get("river_name")
                            if val:
                                feature_names.add(str(val))
                        if feature_names:
                            nearby_features[display] = ", <br>".join(feature_names)
                        
        return {"estimates": estimates, "nearby": nearby_features}
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("Error estimating levels:", e)
        raise HTTPException(status_code=500, detail="Error calculating estimations")


# Mount static assets at root (placed last so dynamic routes take precedence)
app.mount("/maps", StaticFiles(directory="Maps"), name="maps")
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")