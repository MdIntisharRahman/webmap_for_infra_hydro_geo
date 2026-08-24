# Infrastructure and Geo Webmap Application

A high-performance geospatial visualization platform for rendering dynamic geographic data layers, calculating real-time water level estimations, and performing coordinate lookups. This project is built using a modern, scalable architecture featuring a Python/FastAPI backend, a PostGIS geospatial database, and a highly responsive, glassmorphism-styled Vanilla JavaScript frontend.

---

## System Architecture

The application is composed of three tightly integrated components:

1. **Frontend (Client)**: A purely static Single Page Application (HTML, CSS, JS) powered by Leaflet.js, engineered for complete offline autonomy and mobile-responsive perfection.
2. **Backend (API)**: A Python FastAPI server that handles routing, calculates water level estimations using Inverse Distance Weighting (IDW), and constructs GeoJSON payloads.
3. **Database (Geospatial Store)**: A PostgreSQL database extended with PostGIS to natively process, index, and serialize geospatial vectors.

---

## Key Components & Workflow

### 1. Data Ingestion Pipeline
The application uses a unique configuration-as-documentation approach.
* **The Source of Truth**: The file `Maps/list_of_maps_for_the_webmap_and_their_names.md` acts as the manifest for the entire application. It contains a markdown table mapping raw GeoJSON/Raster filenames to human-readable layer names, alongside extended configurations like `Show First`, `Transparency`, and `Credit Page`.
* **`import_local_maps.py`**: This script reads the markdown manifest, iterates through the `Maps/` folder, and uses `geopandas` and `geoalchemy2` to parse the GeoJSON files. It dynamically creates tables in PostGIS (slugifying the layer names), validates the geometry, and sets up geospatial indices. Large Raster files (`.tif`) are intelligently skipped by this script, as they are served directly to the frontend bypassing the database.

### 2. The Backend API (`backend/main.py`)
Built with **FastAPI** and **SQLAlchemy (Async)**, the backend acts as a highly optimized bridge between PostGIS and the Frontend.
* **Dynamic Layer Discovery (`/api/layers`)**: Reads the markdown manifest and tells the frontend exactly which map layers are available to render and which should be toggled on automatically.
* **Native GeoJSON Serialization (`/api/layers/{table_name}`)**: Instead of fetching rows and converting them to JSON in Python, the backend offloads the heavy lifting to PostGIS. It uses `ST_AsGeoJSON` and `jsonb_build_object` to construct massive `FeatureCollection` payloads entirely within the database engine, resulting in extremely fast response times.
* **Point Data Estimator (`/api/estimate_water_levels`)**: Given a latitude and longitude, the API queries the `shwl` and `slwl` tables. It performs a **true geodesic K-Nearest Neighbor (KNN) search** (`geom::geography <-> ...`) to find the 5 closest contour lines and calculates an estimated water level using robust **Inverse Distance Weighting (IDW)**. Concurrently, it queries all available polygon and line feature layers using `ST_DWithin` to instantly identify what infrastructure or geological layers sit directly beneath or within 100m of the target point.

### 3. The Frontend (`frontend/app.js` & `styles.css`)
* **Leaflet.js & GeoRaster**: Handles the heavy rendering of vector layers over a CARTO Voyager basemap, as well as massive raster grids (`.tif`) streamed directly over HTTP without burdening the database.
* **Fully Responsive Glassmorphism UI**: Designed as a sleek "Glass Command Center", the UI relies heavily on hardware-accelerated CSS transforms (`translate3d`) for buttery smooth 60FPS panning. It is 100% mobile-responsive, automatically collapsing the side panels into intuitive, touch-accessible **Bottom Sheets** on smaller screens, keeping the map canvas clear.
* **Coordinate Parsing & Target Acquisition**: A robust regex-based parser that allows users to input coordinates manually (Decimal, DMS, Symbols), or visually acquire them by activating a dynamic **Target crosshair tool** to click directly on the map, generating a highly detailed Point Data Estimator popup.
* **Data-Driven Theming & Tooltips**: The frontend is completely decoupled from hardcoded logic. Styling, legends, and interactive tooltips are driven entirely by specific properties embedded within the GeoJSON features themselves:
    * **`keys`**: A string containing bracketed pairs that maps a database property field to a human-readable label: `[field_name, Display Label]`. If a field value is a URL (e.g., a Google Drive link for borelog data), it is automatically formatted as an interactive, clickable hyperlink (`See More ↗` or `Open Link ↗`) that opens in a new tab.
    * **`f_class_name`**: Defines the classification grouping for the feature (e.g., `National Highway`). The UI auto-generates a multi-color pie chart legend icon and a secondary sliding legend panel.
    * **`f_class_color`**: The hex color used to render the feature. If this property is absent, the layer is assigned a default color from a predefined palette (`engineeringColors` array in `app.js`) based on its load order.
    * **`f_class_weight`**: A percentage multiplier for line thickness. If set to `0`, the feature is completely hidden from the map visually.
    * **Point Sizes**: Point features are automatically rendered as Circle Markers to reduce map clutter and remove shadows. By default, they have a radius of 2.5px (expanding to 3.5px on hover). To alter this size, you can edit the `radius` values returned by the `getFeatureStyle` and `getHighlightStyle` functions inside `frontend/app.js`.
    * **`f_class_transparency`**: Sets the transparency level of the feature as a percentage.
* **Advanced Global Transparency & "Ghost Layers"**: The markdown manifest dictates an overarching `Transparency` value. Positive values aggressively override any feature-level `f_class_transparency` and dictate raster opacity. Negative values create **"Ghost Layers"** — layers that are physically hidden from the map canvas and omitted from the side panel UI, yet remain silently active in the background to feed rich data directly into the Point Data Estimator without cluttering the screen.
* **Iframe Credit Modals**: Layers can trigger elegantly animated, glassmorphic iframe modals to dynamically load external HTML attribution/credit pages (defined via the `Credit Page` column in the manifest).

---

## Configuration (.env)

The project utilizes a unified environment variable system to manage database credentials seamlessly across local and production environments.

* **Local Development**: `uv` automatically loads the `.env` file. The backend connects to the database via `POSTGRES_HOST=localhost`.
* **Production (Docker & PaaS)**: `docker-compose.yml` consumes the exact same `.env` file to configure the PostGIS container, while intelligently overriding `POSTGRES_HOST` to `db` for internal container networking. Alternatively, if hosted on a PaaS like Render, the app prioritizes a single injected `DATABASE_URL` string over individual credential fields.

---

## Dependencies

### Backend (Python)
Managed via `uv` (see `pyproject.toml`):
* **FastAPI / Uvicorn**: High-performance asynchronous web framework and server.
* **SQLAlchemy & Asyncpg**: Asynchronous ORM and database driver for PostgreSQL.
* **GeoPandas & GeoAlchemy2**: For parsing spatial data files and translating them into PostGIS geometries.
* **psycopg2-binary**: Synchronous fallback/adapter utilized by pandas/geopandas for data insertion.

### Frontend
* **Leaflet.js** (Self-Hosted): Core mapping library.
* **Offline Autonomy**: All frontend assets (Leaflet CSS/JS, Google Fonts, SVGs) are fully localized inside `frontend/resources/`, strictly decoupling the map from external CDNs that could fail or change policies.
* **Vanilla JavaScript & CSS**: No heavy frontend frameworks (React/Vue/Angular) are required, ensuring lightning-fast load times.

### Infrastructure (Docker)
* **postgis/postgis:15-3.4**: Official PostGIS image.
* **nginx:alpine**: Replaces Python's `http.server` in production to serve the frontend and reverse-proxy the API requests, sidestepping CORS issues.

---

## Porting & First-Time Setup (New Devices)

If you copy this project to a completely new computer, you **do not** need to manually install dozens of Python packages one by one. The project uses `uv` (a blazingly fast Python package manager) and a `pyproject.toml` file to automatically manage dependencies.

**To set up the project on a new local machine:**
Run `./first_run.sh` to setup the environment variables, update the maps—basically it runs everything you need to prepare the environment, including creating a database for the job. When the shell script is executed, a featured interactive setup wizard (`setup_db.py`) will manage PostgreSQL database creation and environment variable initialization effortlessly. 

## Deployment & Development

* **Local Development**: Run `./start.sh` to spin up a local Uvicorn backend on port `8484` and a Python HTTP server on `8383`. To add a new layer, insert a row in the `Maps/list_of_maps_for_the_webmap_and_their_names.md` file so that the script knows which GeoJSON files are to be loaded and relates names to their corresponding GeoJSON files. Run `./update_Maps.sh` whenever you add new GeoJSON files. 
* **Production Deployment**: For execution in the web servers, a complete `docker-compose.yml` is provided. Read **`web-deployment-instructions.md`** for secure production setup instructions.

## Data-Driven Tooltip Logic

The web map handles GeoJSON feature properties dynamically, using a `keys` array (e.g. `[[field_id, Label], ...]`) defined in the layer data.

**Header Priority Logic:**
When rendering the interactive popup/tooltip for a feature, the application uses the following hierarchy to determine what appears as the bold **Header Title**:

1. **Explicit First-Key Naming**: If the very first pair in your `keys` field explicitly references a naming property (like `name`, `title`, `road_name`, or `river_name`), the application immediately uses its value as the header and removes it from the bulleted list below.
2. **Implicit Name Fallback (The Override)**: If the first pair in the `keys` field is something else (e.g., `[xcoord, Easting]`), the application checks if the feature properties inherently contain a naming field (`Name`, `name`, `road_name`, `river_name`, or `locality`). If found, it intelligently assigns this as the header title, while keeping your explicit `keys` array fully intact in the bulleted list below. 
3. **Strict First-Key Fallback**: If neither of the above applies (no explicit name first, and no implicit name fields exist), it defaults to aggressively ripping the first pair out of your `keys` array and using its value as the header.
