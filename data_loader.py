import requests
import json
import os
import argparse
from sqlalchemy import create_engine, Column, Integer, String, text
from geoalchemy2 import Geometry
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()

class RHDRoad(Base):
    __tablename__ = 'rhd_roads'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    rhd_ref = Column(String, index=True)
    geom = Column(Geometry(geometry_type='LINESTRING', srid=4326))

def fetch_osm_roads():
    print("Fetching RHD roads from OpenStreetMap...")
    # Overpass API query for roads with a 'ref' in Bangladesh
    # N = National, R = Regional, Z = Zilla
    overpass_url = "http://overpass-api.de/api/interpreter"
    overpass_query = """
    [out:json][timeout:180];
    area["ISO3166-1"="BD"][admin_level="2"]->.searchArea;
    (
        way["highway"]["ref"](area.searchArea);
        way["highway"]["network"="Asian Highway"](area.searchArea);
    );
    out geom;
    """
    response = requests.get(
        overpass_url, 
        params={'data': overpass_query},
        headers={'User-Agent': 'BangladeshWebmapApp/1.0', 'Accept': '*/*'}
    )
    response.raise_for_status()
    data = response.json()
    return data['elements']

def load_data(db_url):
    print(f"Connecting to database: {db_url}")
    engine = create_engine(db_url)
    
    print("Creating tables and enabling PostGIS if needed...")
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        conn.commit()
        
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    elements = fetch_osm_roads()
    print(f"Fetched {len(elements)} road segments.")

    roads_added = 0
    for el in elements:
        if el['type'] == 'way' and 'geometry' in el:
            tags = el.get('tags', {})
            ref = tags.get('ref', '')
            name = tags.get('name', '')
            
            # Filter for RHD references (N-*, R-*, Z-*)
            if not (ref.startswith('N') or ref.startswith('R') or ref.startswith('Z') or tags.get('network') == 'Asian Highway'):
                continue
                
            # Create WKT linestring
            coords = [f"{pt['lon']} {pt['lat']}" for pt in el['geometry']]
            if len(coords) < 2:
                continue
            
            wkt_geom = f"SRID=4326;LINESTRING({','.join(coords)})"
            
            road = RHDRoad(
                name=name,
                rhd_ref=ref,
                geom=wkt_geom
            )
            session.add(road)
            roads_added += 1

    print("Committing to database...")
    session.commit()
    print(f"Successfully loaded {roads_added} road segments into the database.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Load OSM roads into PostGIS')
    parser.add_argument('--db', type=str, default=os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/webmap'), help='Database URL')
    args = parser.parse_args()
    
    load_data(args.db)
