import os
import json
import shutil
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from rich.console import Console
from rich.table import Table

console = Console()

# Database config
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DB_USER = os.getenv("POSTGRES_USER", "postgres")
    DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")
    DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
    DB_PORT = os.getenv("POSTGRES_PORT", "5432")
    DB_NAME = os.getenv("POSTGRES_DB", "webmap")
    DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def approve_borelogs():
    staged_dir = os.path.join(os.path.dirname(__file__), "Maps", "borelogs", "staged")
    published_dir = os.path.join(os.path.dirname(__file__), "Maps", "borelogs", "published")
    os.makedirs(staged_dir, exist_ok=True)
    os.makedirs(published_dir, exist_ok=True)

    files = [f for f in os.listdir(staged_dir) if f.endswith(".JSON")]
    if not files:
        console.print("[yellow]No borelogs awaiting approval.[/yellow]")
        return

    async with AsyncSessionLocal() as session:
        for f_name in files:
            file_path = os.path.join(staged_dir, f_name)
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            props = data.get("properties", {})
            borelog_id = props.get("borelog_id", "Unknown")
            project = props.get("project", "Unknown")
            coords = data.get("geometry", {}).get("coordinates", [0, 0])
            lat, lon = coords[0], coords[1]
            
            console.print(f"\n[cyan]Borelog ID:[/cyan] {borelog_id}")
            console.print(f"[cyan]Project:[/cyan] {project}")
            console.print(f"[cyan]File:[/cyan] {f_name}")
            console.print(f"[cyan]Coordinates:[/cyan] {lon}, {lat}")
            
            # Compute Defaults
            uid = f_name.replace(".JSON", "")
            
            # The keys format
            keys_default = "[Name, Place], [xcoord, Easting], [ycoord, Northing], [f_file, See Details]"
            color_default = "#3b82f6"
            
            ans = input("Approve and publish? (y/n/skip): ").strip().lower()
            
            if ans == 'y':
                console.print("\n[yellow]--- Finalization Prompts ---[/yellow]")
                final_x = input(f"Confirm xcoord (Longitude) [{lon}]: ").strip()
                if not final_x: final_x = str(lon)
                
                final_y = input(f"Confirm ycoord (Latitude) [{lat}]: ").strip()
                if not final_y: final_y = str(lat)
                
                final_keys = input(f"Confirm keys attribute [{keys_default}]: ").strip()
                if not final_keys: final_keys = keys_default
                
                final_color = input(f"Confirm f_class_color [{color_default}]: ").strip()
                if not final_color: final_color = color_default
                
                try:
                    final_x = float(final_x)
                    final_y = float(final_y)
                except ValueError:
                    console.print("[red]Invalid coordinates provided. Aborting approval for this log.[/red]")
                    continue

                # 1. Move file to published
                shutil.move(file_path, os.path.join(published_dir, f_name))
                
                # 2. Delete from awaiting_borelogs
                await session.execute(text("DELETE FROM awaiting_borelogs WHERE f_file = :f_file"), {"f_file": f_name})
                
                # 3. Insert into appended_borelogs
                query = text("""
                    INSERT INTO appended_borelogs (geom, borelog_id, project, client, f_file, "Name", "keys", "f_class_color", "xcoord", "ycoord")
                    VALUES (
                        ST_SetSRID(ST_MakePoint(:lon, :lat), 4326),
                        :borelog_id, :project, :client, :f_file, :name, :keys, :f_class_color, :lon, :lat
                    )
                """)
                await session.execute(query, {
                    "lon": final_x,
                    "lat": final_y,
                    "borelog_id": borelog_id,
                    "project": project,
                    "client": props.get("client", ""),
                    "f_file": f_name,
                    "name": uid,
                    "keys": final_keys,
                    "f_class_color": final_color
                })
                await session.commit()
                console.print(f"[green]✔ Published {f_name} successfully.[/green]")
                
            elif ans == 'n':
                os.remove(file_path)
                await session.execute(text("DELETE FROM awaiting_borelogs WHERE f_file = :f_file"), {"f_file": f_name})
                await session.commit()
                console.print(f"[red]✖ Rejected and deleted {f_name}.[/red]")
            else:
                console.print("[yellow]Skipping...[/yellow]")

if __name__ == "__main__":
    asyncio.run(approve_borelogs())
