import os
import argparse
import geopandas as gpd
from sqlalchemy import create_engine
import re
from rich.console import Console

console = Console()

def slugify(text):
    text = text.strip().lower()
    text = re.sub(r'[^a-z0-9]+', '_', text)
    return text.strip('_')

def parse_markdown_table(filepath):
    """Parses the markdown table to extract filenames and layer names."""
    maps = []
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    # Skip header and separator
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
            
        parts = [p.strip() for p in line.split('|')[1:-1]]
        if len(parts) >= 2:
            maps.append({
                'filename': parts[0],
                'layer_name': parts[1]
            })
    return maps

def load_data(db_url, maps_dir, md_filepath):
    print(f"Connecting to database: {db_url}")
    engine = create_engine(db_url)
    
    maps = parse_markdown_table(md_filepath)
    print(f"Found {len(maps)} maps to process in {md_filepath}\n")
    
    for map_info in maps:
        filename = map_info['filename']
        layer_name = map_info['layer_name']
        table_name = slugify(layer_name)
        
        filepath = os.path.join(maps_dir, filename)
        if not os.path.exists(filepath):
            console.print(f"[bold yellow]Warning:[/bold yellow] File not found: [cyan]{filepath}[/cyan]. Skipping.")
            continue
            
        msg = f"Loading [cyan]{filename}[/cyan] (Layer: [bold]{layer_name}[/bold]) into table '[green]{table_name}[/green]'..."
        with console.status(msg, spinner="dots"):
            try:
                # Read GeoJSON using Geopandas
                gdf = gpd.read_file(filepath)
                
                # Ensure the geometry column is named 'geom' to stay consistent with other tables
                if 'geometry' in gdf.columns and gdf.geometry.name != 'geom':
                    gdf = gdf.rename_geometry('geom')
                    
                # If the GeoJSON already has an 'id' property, rename it to avoid conflicting
                # with the 'id' index column we want to generate for PostGIS
                if 'id' in gdf.columns:
                    gdf = gdf.rename(columns={'id': 'original_id'})
                    
                # Write to PostGIS
                gdf.to_postgis(
                    name=table_name,
                    con=engine,
                    if_exists='replace',
                    index=True,
                    index_label='id'
                )
                console.print(f"[bold green]✓[/bold green] Successfully loaded [bold]{len(gdf)}[/bold] features into '[cyan]{table_name}[/cyan]'.")
                
            except Exception as e:
                console.print(f"[bold red]✗ Error loading {filename}:[/bold red] {e}")

if __name__ == "__main__":
    db_user = os.getenv("POSTGRES_USER", "postgres")
    db_pass = os.getenv("POSTGRES_PASSWORD", "postgres")
    db_host = os.getenv("POSTGRES_HOST", "localhost")
    db_port = os.getenv("POSTGRES_PORT", "5432")
    db_name = os.getenv("POSTGRES_DB", "webmap")
    default_db_url = f"postgresql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"
    
    parser = argparse.ArgumentParser(description='Load GeoJSON maps into PostGIS')
    parser.add_argument('--db', type=str, default=default_db_url, help='Database URL')
    parser.add_argument('--maps-dir', type=str, default='Maps', help='Directory containing the map files')
    parser.add_argument('--list-file', type=str, default='Maps/list_of_maps_for_the_webmap_and_their_names.md', help='Markdown file listing the maps')
    
    args = parser.parse_args()
    
    load_data(args.db, args.maps_dir, args.list_file)
