echo "Starting Webmap Setup ..."

pip install uv psycopg2-binary
uv sync

uv run --with psycopg2-binary python setup_db.py

read -p "Press Enter to continue..."

echo "Starting Webmap Environment..."
echo " "
echo "Are we there yet?" 
echo "Almost"
echo "--> Syncing maps to PostGIS database..."
uv run --env-file .env python import_local_maps.py