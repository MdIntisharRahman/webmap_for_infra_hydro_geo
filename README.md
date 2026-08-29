# Infrastructure and Geo Webmap Application

A geospatial visualization platform for rendering infrastructure, hydrograhic, geographic and seismographic data layers. The platform features a **POINT DATA ESTIMATOR** tool to calculating elevation, water level, point location geographic, seismic and hydrographic estimations based on the available map data. This project is built using a modern, scalable architecture featuring a Python/FastAPI backend, a PostGIS geospatial database, and a highly responsive, glassmorphism-styled Vanilla JavaScript frontend.

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

## Adding New Maps (The Manifest File)

The entire webmap is driven by a central configuration file located at `Maps/list_of_maps_for_the_webmap_and_their_names.md`. To add a new map layer, you simply add a new row to the Markdown table in this file, and the application will dynamically parse it, ingest it, and render it.

### Column Definitions

| Column | Description |
| :--- | :--- |
| **File Name** | The exact name of the file located in the `Maps/` directory (e.g., `data.geojson`, `elevation.tif`). Must include the extension. For `Basemap` types, this is the XYZ tile URL (e.g., `https://{s}.tile.osm.org/{z}/{x}/{y}.png`). |
| **Name of the Layer** | The human-readable name that will appear in the webmap's side panel and legends. |
| **Tab** | The category/tab under which this layer will be grouped in the side panel (e.g., `Hydro`, `Infrastructure`, `Geo`). Must be `Basemap` for basemap layers. |
| **Show First** | (`Yes` or `No`). If `Yes`, the layer is automatically toggled ON and visible when the webmap first loads. |
| **Type** | (`Vector`, `Raster`, or `Basemap`). Use `Vector` for GeoJSON points/polygons. Use `Raster` for `.tif` grids. Use `Basemap` for background tile servers. |
| **Transparency** | (Optional). A percentage value (e.g., `50`). If set to a negative value (e.g., `-100`), it creates a **"Ghost Layer"** (hidden from the map UI but queried by the data estimator). |
| **Derive** | (Optional). Used by the Point Data Estimator. Formatted as `[field_name, Display Label]`. You can specify multiple separated by commas. |
| **Units** | (Optional). The physical unit corresponding to the derived value (e.g., `m`, `g`). |
| **Estimate** | (`Yes` or `No`). If `Yes`, queried whenever a user clicks the map to estimate values. |
| **Credit Page** | (Optional). The HTML file in `frontend/credits/` (e.g., `Prosoil.html`). **For Basemaps ONLY**, you can write a direct HTML hyperlink string like `<a href="https://openstreetmap.org">OSM</a>`. |
| **Zoom Level** | (Optional). **For Basemaps ONLY**. Defines the maximum zoom limit for the tile server (e.g., `19`). |

### Examples

**Example 1: The Basics**
*You want to add a simple GeoJSON containing regional boundaries. You want it grouped under "Geo", disabled by default, with no special data estimations.*
`| regional_bounds.geojson | Regional Boundaries | Geo | No | Vector | | | | No | | |`
-  You only provide the essential file details, name, category, and type. The rest is left blank or `No`.

**Example 2: Adding a Raster Map with Estimations**
*You want to add a GeoTIFF temperature map. You want it semi-transparent (40%), and you want the Point Data Estimator to derive the temperature in Celsius.*
`| temperature_grid.tif | Annual Temp | Geo | No | Raster | 40 | [ , Temperature] | C | Yes | Temp-Credit.html | |`
- You specify `Raster` type, set a `Transparency` of 40, and configure the `Derive` column to map the raster pixel value to the label "Temperature" with a unit of "C". You also link a credit page.

**Example 3: Complex Vector with Multiple Derivations**
*You have a highly detailed GeoJSON of underground water aquifers. You want the map to automatically show it on load, but you want to extract TWO distinct values (Depth and Salinity) when the user clicks the map, applying different units.*
`| aquifers_deep.geojson | Deep Aquifers | Hydro | Yes | Vector | | [depth, Depth], [salinity, Salinity Level] | m, ppt | Yes | Hydro-Credit.html | |`
- You utilize advanced `Derive` syntax. The backend will perform IDW estimation on both fields concurrently.

**Example 4: Adding an Online Basemap**
*You want to add the CyclOSM background map, ensure its radio button is grouped in the Basemap tab, and provide proper attribution link.*
`| https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png | CycleOSM | Basemap | Yes | Basemap | | | | | https://www.openstreetmap.org/copyright [OSM] | 19 |`
- The `File Name` acts as a direct internet URL (passing `{x}, {y}, {z}` variables directly to Leaflet). The `Credit Page` dynamically parses `url [Text]` into a clickable hyperlink anchored natively to the map canvas, and `Zoom Level` safely caps zooming at 19.

---

### Architecture & Type Exclusivity (How Data Scopes Work)

To ensure high performance and predictable UI behavior, the platform enforces strict **Type Exclusivity** across the full stack (Frontend Map Engine, Backend Python API, and Database Loader). Properties belonging to one `Type` logically cannot bleed into another.

#### 1. Basemap Architecture (`Type = Basemap`)
Basemaps represent the fundamental bottom-layer visualization of the earth. Because they are fetched continuously from external XYZ tile servers (like OpenStreetMap or ESRI) as the user pans and zooms, their pipeline skips the database entirely.
- **Mutually Exclusive UI**: Basemaps are rendered as radio buttons. The frontend engine strictly ensures only **one** basemap can be loaded and visually active at any time.
- **File Name Routing**: The `File Name` column is treated as a raw HTTP URL template, bypassing local file checks.
- **Attribution Scope (`Credit Page`)**: Basemaps do **not** generate "Cr" buttons or modal popups. Instead, their `Credit Page` column expects a raw HTML string (e.g., `<a href="...">OSM</a>`), which the engine natively injects into the bottom-left Leaflet copyright banner when the map is active.
- **Isolated Config (`Zoom Level`)**: The `Zoom Level` column is an exclusive property of Basemaps, configuring the external tile server cap to prevent requesting broken images.
- **Data Exclusion**: Because Basemaps are pre-rendered images, the Backend Point Data Estimator securely skips them. They are ignored by SQL distance queries and IDW calculations.

#### 2. Vector & Raster Architecture (`Type = Vector` or `Raster`)
Vectors (GeoJSONs) and Rasters (GeoTIFFs) represent your analytical overlays. They are ingested deeply into the system, queryable by the database, and stackable in the UI.
- **Stackable UI**: Rendered as independent checkboxes. Users can overlay infinite combinations of vectors and rasters simultaneously on top of the active Basemap.
- **File Name Routing**: The `File Name` expects a physical file residing in the `Maps/` folder, which triggers ingestion by `update_maps.sh` / `import_local_maps.py`.
- **Raster Display Engine (The PNG Bypass)**: Because rendering massive raw floating-point `.tif` rasters directly in the browser is notoriously slow and causes visual seams, the webmap bypasses the raw `.tif` for visualization. Instead, it looks for a counterpart `.png` image with the exact same base name in the `Maps/` directory. The system automatically reads the true geographic bounds of the dataset using `rasterio` and stretches this lightweight 4-band RGBA PNG seamlessly over the map canvas via Leaflet's `L.imageOverlay`.
- **Attribution Scope (`Credit Page`)**: Vectors and Rasters look for an `.html` file path in the `frontend/credits/` directory (e.g., `Prosoil.html`). They generate a clickable "Cr" button in the layer list that pops open a modal iframe window to display complex formatting, logos, and licenses. 
- **Estimator Integration**: Vectors and Rasters exclusively utilize the `Derive`, `Units`, and `Estimate` columns. When a user clicks the map, the backend runs `ST_DWithin` queries against PostGIS for Vectors. For Rasters, the backend bypasses the PNG and directly samples the raw floating-point `.tif` grid using `rasterio.sample` to extract perfectly accurate analytical data, independent of how the map looks.

### Legends & Symbology (Dynamic UI Generation)

The platform features a highly advanced, zero-configuration dynamic legend engine. You do not need to manually write HTML/CSS to build legends for your map layers. The frontend automatically parses the underlying data and generates a highly-polished, responsive `sub-legend-ui` with interactive gradient pie-charts, swatches, and overflow menus (`+X` button).

#### 1. Vector Legends (Automatic Extraction)
For Vector layers, the backend automatically scans the database for the `f_class_name` and `color` (or `f_class_color`) attributes within the GeoJSON features. The frontend dynamically groups these distinct classes and assigns them their respective colors in the UI.

#### 2. Raster Legends (QGIS Color Map Integration)
Because raw `.tif` rasters do not contain vector properties, you can explicitly define a raster's legend by dropping a simple text file into the `Maps/` directory.
- The file must be named identically to the raster file, but suffixed with `-color_map.txt` (e.g., `elevation-color_map.txt`).
- The syntax exactly matches **QGIS's standard Color Map Export format**.
- The backend parses this text file on the fly and pipes the RGBA swatches directly into the frontend legend renderer.

#### Examples of Legend Generation

**Example 1: A Standard Vector Classification**
*You have a vector layer of Roads. In the database, the features contain an `f_class_name` attribute and a `color` attribute.*
- **Data:** `{"f_class_name": "Highway", "color": "#FF0000"}`
- **Engine Response:** Automatically builds a red `#FF0000` swatch labeled "Highway" beneath the layer name. If there are 5 classes, the circle icon transforms into a 5-color conic gradient pie chart.

**Example 2: A Raster QGIS Color Map (`-color_map.txt`)**
*You have an elevation `.tif` raster. You export a QGIS color map and save it as `elevation-color_map.txt` in the `Maps/` directory.*
```text
# QGIS Generated Color Map Export File
INTERPOLATION:DISCRETE
0,4,14,216,255,-5 - 0 m
5,32,80,255,255,0 - 5 m
10,65,150,255,255,5 - 10 m
```
- **Engine Response:** The backend ignores the `#` and `INTERPOLATION` lines. It extracts the RGBA values (`4,14,216,255`) and the label (`-5 - 0 m`) for each row, constructing a perfect replica of your QGIS legend directly in the web UI.

**Example 3: Handling Legend Overflow (`+X` Button)**
*Your landcover raster has 25 different classifications defined in its `-color_map.txt`. It's impossible to fit 25 swatches in the narrow side panel.*
- **Engine Response:** The frontend actively calculates the physical pixel width of the user's screen. It renders as many swatches as can comfortably fit (e.g., 3 swatches). It then truncates the rest and generates a highly visible `+22` button. Clicking this button dynamically opens the Right-Side Panel, populating a scrollable, full-length list of all 25 legend items.


### UI & Responsive Design (Impeccable Standards)

The webmap was completely refactored to align with enterprise-grade responsive design standards, ensuring pixel-perfect scaling from 4K Widescreen monitors down to minimal mobile phones.

#### 1. Fluid Typography & `em`-Based Scaling
Hardcoded pixel values cause layouts to break across devices. The entire layer control UI (including the custom iOS-style animated checkboxes and legend pie-circles) was rewritten using relative `em` units. 
The master `.layer-item` container dynamically injects the `font-size` based on the user's device:
- **Mobile (`pointer: coarse`)**: Bumps font size to `15px` for legibility.
- **Widescreen (`min-width: 1600px`)**: Uses a fluid `clamp(14px, 0.8vw, 16px)` calculation.
Because the checkboxes are bound to `1em`, they perfectly and automatically scale in absolute harmony with the text across all devices.

#### 2. Accessible Touch Targets
Standard 12px checkboxes are an accessibility violation on touch devices. The iOS checkboxes were heavily modified using negative margins and oversized padding (`margin: -10px; padding: 10px;`). This creates a massive, invisible `32px` touch area that easily captures thumb-taps on phones, without disturbing or pushing the visible CSS layout.

#### 3. Fully Offline Local Fonts
To guarantee the UI never breaks, blocks, or flashes unstyled text in offline environments (or slow field-networks), all typography (Inter and Outfit) was converted to ultra-compressed `.woff2` files via Transfonter and stored directly in `frontend/resources/fonts/`. The `font-display: swap` directive guarantees the browser will render instantly.
