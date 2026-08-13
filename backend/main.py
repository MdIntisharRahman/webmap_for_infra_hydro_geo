from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
from typing import AsyncGenerator
import json
import os
import re

app = FastAPI(title="Bangladesh Webmap API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "postgres")
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "webmap")

DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_async_engine(
    DATABASE_URL, 
    pool_pre_ping=True,  # Verify connection health before checkout
    pool_recycle=300,    # Recycles connections every 5 minutes
    pool_size=10,
    max_overflow=20,
    connect_args={
        "command_timeout": 60,  # Adjust timeout for heavy spatial queries
        "server_settings": {
            "keepalives": "1",
            "keepalives_idle": "30",
            "keepalives_interval": "10",  # Fixed duplicate key issue
            "keepalives_count": "5",
        }
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
    # Read the markdown file to get the list of layers
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
                or line.startswith("|-")
                or not line.startswith("|")
            ):
                continue
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(parts) >= 2:
                layer_name = parts[1]
                table_name = slugify(layer_name)
                layers.append({"name": layer_name, "table": table_name})
    return layers


@app.get("/api/layers/{table_name}")
async def get_layer_data(table_name: str, db: AsyncSession = Depends(get_db)):
    if not re.match(r"^[a-z0-9_]+$", table_name):
        raise HTTPException(status_code=400, detail="Invalid table name")

    # Corrected SQL comments from '#' to '--'
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


async def estimate_level(db: AsyncSession, table_name: str, lat: float, lng: float):
    query = text(f"""
        SELECT contour, 
               ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) as dist
        FROM "{table_name}"
        WHERE contour IS NOT NULL
        ORDER BY geom <-> ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
        LIMIT 3
    """)
    result = await db.execute(query, {"lat": lat, "lng": lng})
    rows = result.fetchall()

    if not rows:
        return None

    num = 0.0
    den = 0.0
    for row in rows:
        contour, dist = row
        # Convert meters to km
        d = dist / 1000.0

        # Division-by-Zero Protection
        if d == 0.0:
            return contour

        weight = 1.0 / (d**2)
        num += weight * contour
        den += weight

    if den == 0:
        return None
    return num / den


@app.get("/api/estimate_water_levels")
async def get_estimate(lat: float, lng: float, db: AsyncSession = Depends(get_db)):
    try:
        shwl_val = await estimate_level(db, "shwl", lat, lng)
        slwl_val = await estimate_level(db, "slwl", lat, lng)
        return {"shwl": shwl_val, "slwl": slwl_val}
    except Exception as e:
        print("Error estimating levels:", e)
        raise HTTPException(status_code=500, detail="Error calculating estimations")


# Mount static assets at root (placed last so dynamic routes take precedence)
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")