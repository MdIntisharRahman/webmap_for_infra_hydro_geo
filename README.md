# Infrastructure and Geo Webmap Application

A high-performance geospatial visualization platform for rendering dynamic geographic data layers, calculating real-time water level estimations, and performing coordinate lookups. This project is built using a modern, scalable architecture featuring a Python/FastAPI backend, a PostGIS geospatial database, and a lightweight Vanilla JavaScript frontend.

---

## System Architecture

The application is composed of three tightly integrated components:

1. **Frontend (Client)**: A purely static Single Page Application (HTML, CSS, JS) powered by Leaflet.js.
2. **Backend (API)**: A Python FastAPI server that handles routing, calculates water level estimations using Inverse Distance Weighting (IDW), and constructs GeoJSON payloads.
3. **Database (Geospatial Store)**: A PostgreSQL database extended with PostGIS to natively process, index, and serialize geospatial vectors.

---

## Key Components & Workflow

### 1. Data Ingestion Pipeline
The application uses a unique configuration-as-documentation approach.
* **The Source of Truth**: The file `Maps/list_of_maps_for_the_webmap_and_their_names.md` acts as the manifest for the entire application. It contains a markdown table mapping raw GeoJSON filenames to human-readable layer names.
* **`import_local_maps.py`**: This script reads the markdown manifest, iterates through the `Maps/` folder, and uses `geopandas` and `geoalchemy2` to parse the GeoJSON files. It dynamically creates tables in PostGIS (slugifying the layer names), validates the geometry, and sets up geospatial indices.

### 2. The Backend API (`backend/main.py`)
Built with **FastAPI** and **SQLAlchemy (Async)**, the backend acts as a highly optimized bridge between PostGIS and the Frontend.
* **Dynamic Layer Discovery (`/api/layers`)**: Reads the markdown manifest and tells the frontend exactly which map layers are available to render.
* **Native GeoJSON Serialization (`/api/layers/{table_name}`)**: Instead of fetching rows and converting them to JSON in Python, the backend offloads the heavy lifting to PostGIS. It uses `ST_AsGeoJSON` and `jsonb_build_object` to construct massive `FeatureCollection` payloads entirely within the database engine, resulting in extremely fast response times.
* **Water Level Estimator (`/api/estimate_water_levels`)**: Given a latitude and longitude, the API queries the `shwl` (Stormwater High Water Level) and `slwl` (Stormwater Low Water Level) tables. It finds the 3 closest contour lines using the PostGIS `<->` operator and calculates an estimated water level using **Inverse Distance Weighting (IDW)**.

### 3. The Frontend (`frontend/app.js`)
* **Leaflet.js**: Handles the heavy rendering of vector layers over a CARTO Voyager basemap.
* **Coordinate Parsing**: A robust regex-based parser that allows users to input coordinates in almost any format (Decimal, DMS, Symbols) and instantly drops a marker on the map to fetch water level estimations.
* **Data-Driven Theming & Tooltips**: The frontend is completely decoupled from hardcoded logic. Styling, legends, and interactive tooltips are driven entirely by specific properties embedded within the GeoJSON features themselves. To customize how a layer behaves on the webmap, you simply add these specific fields to your GIS attribute table:
    * **`keys`**: A string containing bracketed pairs that maps a database property field to a human-readable label: `[field_name, Display Label]`. The UI's custom parsing engine reads this to dynamically construct the tooltip. 
      * **Example Format**: `[road_name, Road Name], [width, Road Width], [surface, Surface Type]`
      * **How it works**: The **first pair** in the list is always extracted and its data value is used as the large **Header text** for the tooltip (the label part is ignored for the header). The subsequent pairs are rendered in the body of the tooltip, using the exact labels provided. If there are more than 3 body items, the rest are neatly tucked into an expandable "See More" toggle.
    * **`f_class_name`**: Defines the classification grouping for the feature. 
      * **Example**: `National Highway` or `Zila Road`.
      * **How it works**: Adding this field automatically groups the data in the legend. If multiple classes exist within a single map layer, the frontend automatically generates a multi-color pie chart legend icon and activates the secondary sliding legend panel on the right side of the screen.
    * **`f_class_color`**: The hex color used to render the feature on the map and in the legend.
      * **Example**: `#ff0000` (for Red)
      * **How it works**: Dictates the exact stroke/fill color. If missing, the app cycles through a default generic engineering palette.
    * **`f_class_weight`**: A percentage multiplier for line thickness.
      * **Example**: `100` (standard weight), `200` (double thickness), or `0` (hidden).
      * **How it works**: Controls the visual stroke width on the map. **Crucially**, if `f_class_weight` is set to `0`, the feature is completely hidden from the map visually, and a subtle `(hidden)` tag is appended to its entry in the expanded right-side legend panel.
    * **`f_class_transparency`**: Sets the transparency level of the feature as a percentage.
      * **Example**: `20` (20% transparent, which is 80% opaque).
      * **How it works**: Mathematically converts the provided percentage into an opacity value for Leaflet (e.g., 20 becomes `opacity: 0.8`). If the field is missing or empty, the feature retains its default solid opacity.

---

## Configuration (.env)[cite: 1]

The project utilizes a unified environment variable system to manage database credentials seamlessly across local and production environments[cite: 1].

* **Local Development**: `uv` automatically loads the `.env` file[cite: 1]. The backend connects to the database via `POSTGRES_HOST=localhost`[cite: 1].
* **Production (Docker)**: `docker-compose.yml` consumes the exact same `.env` file to configure the PostGIS container, while intelligently overriding `POSTGRES_HOST` to `db` for internal container networking[cite: 1].

Both the async API backend and the synchronous map ingestion scripts dynamically parse these granular credentials to build their respective connection strings[cite: 1].

---

## Dependencies

### Backend (Python)
Managed via `uv` (see `pyproject.toml`):
* **FastAPI / Uvicorn**: High-performance asynchronous web framework and server.
* **SQLAlchemy & Asyncpg**: Asynchronous ORM and database driver for PostgreSQL.
* **GeoPandas & GeoAlchemy2**: For parsing spatial data files and translating them into PostGIS geometries.
* **psycopg2-binary**: Synchronous fallback/adapter utilized by pandas/geopandas for data insertion.

### Frontend
* **Leaflet.js** (loaded via CDN): Core mapping library.
* **Vanilla JavaScript & CSS**: No heavy frontend frameworks (React/Vue/Angular) are required, ensuring lightning-fast load times.

### Infrastructure (Docker)
* **postgis/postgis:15-3.4**: Official PostGIS image.
* **nginx:alpine**: Replaces Python's `http.server` in production to serve the frontend and reverse-proxy the API requests, sidestepping CORS issues.

---

## Porting & First-Time Setup (New Devices)

If you copy this project to a completely new computer, you **do not** need to manually install dozens of Python packages one by one. The project uses `uv` (a blazingly fast Python package manager) and a `pyproject.toml` file to automatically manage dependencies.

**To set up the project on a new local machine:**
Run `./first_run.sh` to setup the environmen variables, update the maps—basically it runs everything you need to prepare the environment, including creating a database for the job. When the shell script is executed a featured interactive setup wizard (`setup_db.py`) will manage PostgreSQL database creation and environment variable initialization effortlessly. 

## Deployment & Development

* **Local Development**: Run `./start.sh` to spin up a local Uvicorn backend on port `8484` and a Python HTTP server on `8383`. To add a new layer insert a row in the `Maps/list_of_maps_for_the_webmap_and_their_names.md` file so that the script knows which GeoJSON files are to be loaded and relate names to their corresponding GeoJSON files. Run `./Update_Maps.sh` whenever you add new GeoJSON files. 
* **Production Deployment**: For execution in the web servers a complete `docker-compose.yml` is provided. Read **`web-deployment-instructions.md`** for secure production setup instructions.
