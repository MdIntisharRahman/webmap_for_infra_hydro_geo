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
            borehole_id = props.get("borehole_id", "Unknown")
            project = props.get("project", "Unknown")
            coords = data.get("geometry", {}).get("coordinates", [0, 0])
            lon, lat = coords[0], coords[1]
            
            console.print(f"\n[cyan]Borelog ID:[/cyan] {borehole_id}")
            console.print(f"[cyan]Project:[/cyan] {project}")
            console.print(f"[cyan]File:[/cyan] {f_name}")
            console.print(f"[cyan]Coordinates:[/cyan] {lon}, {lat}")
            
            ans = input("Approve and publish? (y/n/skip): ").strip().lower()
            
            if ans == 'y':
                # 1. Move file to published
                shutil.move(file_path, os.path.join(published_dir, f_name))
                
                # 2. Delete from awaiting_borelogs
                await session.execute(text("DELETE FROM awaiting_borelogs WHERE f_file = :f_file"), {"f_file": f_name})
                
                # 3. Insert into appended_borelogs
                query = text(\"\"\"
                    INSERT INTO appended_borelogs (geom, borehole_id, project, client, f_file)
                    VALUES (
                        ST_SetSRID(ST_MakePoint(:lon, :lat), 4326),
                        :borehole_id, :project, :client, :f_file
                    )
                \"\"\")
                await session.execute(query, {
                    "lon": lon,
                    "lat": lat,
                    "borehole_id": borehole_id,
                    "project": project,
                    "client": props.get("client", ""),
                    "f_file": f_name
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
