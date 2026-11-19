# Infrastructure, Hydrographic & Geotechnical Webmap Portal

[![Roads and Highways Department](https://img.shields.io/badge/RHD-Government%20of%20Bangladesh-112047?style=flat-square)](https://rhd.gov.bd)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Leaflet.js](https://img.shields.io/badge/Leaflet.js-1.9.4-199900?style=flat-square&logo=leaflet)](https://leafletjs.com)
[![PostGIS](https://img.shields.io/badge/PostGIS-15--3.4-336791?style=flat-square&logo=postgresql)](https://postgis.net)
[![Nginx](https://img.shields.io/badge/Nginx-Alpine-009639?style=flat-square&logo=nginx)](https://nginx.org)
[![RHD DESC](https://img.shields.io/badge/RHD%20DESC-Interoperability%20Enabled-1c508c?style=flat-square)](https://acqform.rhdbridge.com)

A high-performance geospatial visualization and engineering coordination platform designed for the **Roads and Highways Department (RHD)**, Ministry of Road Transport and Bridges, Government of the People's Republic of Bangladesh.

The platform visualizes national road networks, hydrographic contours, geological formations, seismographic hazard zones, and geotechnical boreholes. It features an analytical **Point Data Estimator** (calculating elevation, water level, and geotechnical metrics using Inverse Distance Weighting), dynamic **RHD DESC Demands Coordination**, **'Map from Legends' Search Integration**, and a multi-mode **Basemap Compositing Suite**.

---

## 🏗️ System Architecture

The application comprises three tightly integrated containers deployed via Docker Compose:

1. **Frontend (Client)**: A purely static Single Page Application (HTML, CSS, Vanilla JS) powered by Leaflet.js, engineered for offline autonomy, zero external CDN dependencies, and hardware-accelerated 60 FPS glassmorphic rendering.
2. **Backend (API)**: A Python FastAPI asynchronous server (`backend/main.py`) that handles dynamic layer discovery, Inverse Distance Weighting (IDW) water-level estimations, PostGIS SQL queries, and secure proxying to the **RHD DESC** structural exchange server.
3. **Database (Geospatial Store)**: PostgreSQL with PostGIS extension (`postgis/postgis:15-3.4`) natively storing vector features, spatial indices, and running server-side `ST_AsGeoJSON` serialization.

---

## 🌟 Key Features & Functional Modules

### 1. RHD DESC Demands Coordination Subsystem
Integrated directly with the [RHD DESC Platform](https://acqform.rhdbridge.com) (`/api/exchange/webmap/...`), providing visual geospatial tracking for bridge and culvert acquisition demands:
- **Demands Tab**: Dynamically activated upon verified authentication.
- **9 Specialized Spatial Layers**: Three discrete stages across all three central Bridge Design Divisions:
  - `Demand (Design Division-1 / 2 / 3)`: Deep Navy (`#112047`) — Unaccepted field acquisition dossiers awaiting structural intake.
  - `Processing (Design Division-1 / 2 / 3)`: Denim Blue (`#1c508c`) — Accepted demands actively undergoing hydraulic computation, drafting, and vetting.
  - `Delivered (Design Division-1 / 2 / 3)`: Steel Blue (`#3699c2`) — Fully endorsed and approved design packages dispatched back to the field.
- **Embedded Dossier Preview (`demand-preview-modal`)**: Clicking any demand feature opens an interactive glassmorphic modal embedding a live dossier with real-time status badges, attachments summary, and a direct button to open the official record in RHD DESC.

### 2. Sneaky Webmaster & Bridge Design Division Authentication
- **Sneaky Trigger**: The Webmaster login button is hidden from public view. Double-clicking the official RHD logo in the header opens a credential prompt.
- **Role-Based Access Control (RBAC)**:
  - `Webmaster`: Super-admin privilege; unconstrained visibility across all 9 demand layers for all 3 Bridge Design Divisions simultaneously.
  - `BDD_1`: Bridge Design Division 1 officer; scoped exclusively to Division 1 Demand, Processing, and Delivered layers.
  - `BDD_2`: Bridge Design Division 2 officer; scoped exclusively to Division 2 Demand, Processing, and Delivered layers.
  - `BDD_3`: Bridge Design Division 3 officer; scoped exclusively to Division 3 Demand, Processing, and Delivered layers.
- **Header Status Pill**: Displays active role credentials (`Webmaster`, `BDD-1`, `BDD-2`, `BDD-3`) with a one-click session logout button.

### 3. 'Map from Legends' & Field Division Categorization
- **Intelligent Division Classification**: Vector classification engine groups features by discrete category values (`classify_with` or inferred from `search_on`) rather than color alone. For instance, demand layers display distinct legend entries for *Barishal*, *Dhaka*, *Gazipur*, *Cumilla*, etc.
- **Interactive Legend Side Panel**: When a layer has `map_from_legends: true` in the manifest:
  - Side panel legend items display an interactive "Filter" badge and hover animation.
  - **Click-to-Search**: Clicking any category (e.g. *Barishal* or *Box Culvert*) executes `executeLegendSearch`:
    1. Synchronizes the search drawer (selects the layer radio and populates search input).
    2. Filters map features to only display matching records.
    3. Triggers crimson POI halo pulse highlight animation.
    4. Automatically animates `map.flyToBounds(...)` to zoom to the filtered features.
    5. Displays toast notification (`Found X features matching "..."`).
    6. Highlights the clicked legend item with `.active-legend-filter`.
  - **Toggle Off**: Clicking the active legend item a second time clears the filter and restores all features on the layer.

### 4. Basemap Transparency & Opacity Slider Synchronization
- **Automatic Calculated Opacity**: In the single basemap scheme, selecting any basemap automatically inspects its configured `transparency` value from `Maps/map_list.md`:
  $$\text{Opacity \%} = 100 - \text{Transparency}$$
  - **OSM Standard** (transparency 37) $\longrightarrow$ slider automatically slides to **`63%`** and applies `0.63` tile opacity.
  - **Satellite Imagery** (transparency 53) $\longrightarrow$ slider automatically slides to **`47%`** and applies `0.47` tile opacity.
  - **Google Roads** (transparency 53) $\longrightarrow$ slider automatically slides to **`47%`** and applies `0.47` tile opacity.
  - Basemaps without transparency specified default to **`100%`**.
- Manual dragging of the slider remains fully reactive.

### 5. Basemap Compositing Engine (Dual Layer & Swipe)
- **Composite Mode**: Seamlessly blend a Base tile layer (e.g. Satellite Imagery) with an Overlay tile layer (e.g. ESRI Transportation or CycleOSM).
- **CSS Blend Modes**: Supports `normal`, `multiply`, `overlay`, and `screen`.
- **One-Click Presets**:
  - `Sat + Roads` (Satellite Imagery + ESRI Transportation at 100% opacity)
  - `Topo + Roads` (ESRI Topographic + ESRI Transportation at 90% opacity)
  - `Sat + Topo` (Satellite Imagery + ESRI Topographic with Multiply blend at 65% opacity)
  - `Cycle + Roads` (Satellite Imagery + CycleOSM with Overlay blend at 75% opacity)
- **Interactive Draggable Swipe Divider**: Activates an on-canvas divider (`#basemap-swipe-divider`) that splits the map vertically, enabling side-by-side comparison between imagery and road cartography.

### 6. Advanced Numeric Range & Operator Search Engine
Client-side fuzzy and structured search capable of parsing thousands of GeoJSON features instantly:
- **Targeted Field Prefixes**: e.g., `spans: >= 5`, `Construction Year: 2000..2010`.
- **Comparison Operators**: `>=`, `<=`, `>`, `<`, `=`, `!=`.
- **Range Queries**: Supports `..`, `-`, or `to` (e.g. `10..20`, `2000 - 2010`, `5 to 15`).
- **POI Halo Pulse**: Matched points or line geometries receive crimson halo highlights synchronized across zoom levels.

### 7. Point Data Estimator Tool
- **Geodesic K-Nearest Neighbor (KNN)**: Given any clicked GPS coordinate or manual input, samples contour lines and runs Inverse Distance Weighting (IDW) to calculate Static High Water Level (SHWL) and Static Low Water Level (SLWL).
- **Subsurface & Seismic Profiling**: Concurrently samples Peak Ground Acceleration (PGA) grids, spectral acceleration, and geological bedrock formations.
- **Crosshair Target Acquisition Tool**: One-click visual crosshair (`#target-btn`) for interactive point estimation anywhere in Bangladesh.

### 8. Geotechnical Borelog Subsystem
- **Strata Visualization**: Custom Vanilla JS DOM engine rendering in-situ soil strata, groundwater table, and SPT $N$-value profiles.
- **Physical GeoJSON Synchronization**: Automatic real-time persistence to `Maps/awaiting_borelogs.geojson` and `Maps/appended_borelogs.geojson`.

---

## 🗺️ Adding Layers (`Maps/map_list.md` Manifest)

The entire portal is dynamically driven by `Maps/map_list.md`. The table defines 15 distinct columns:

| Column # | Header | Description |
|:---:|:---|:---|
| 1 | **File Name** | Physical file in `Maps/` (`.geojson`, `.tif`) or tile URL for `Basemap`. |
| 2 | **Name of the Layer** | Human-readable title displayed in side panels, legends, and search. |
| 3 | **Tab** | Grouping category (`Hydro`, `Infrastructure`, `Geologic`, `Seismic`, `Geotechnical`, `Basemaps`). |
| 4 | **Show First** | `Yes` or `No`. Auto-toggled on when map loads. |
| 5 | **Type** | `Vector`, `Raster`, or `Basemap`. |
| 6 | **Datatype** | Optional specialized handler tag (e.g. `Borelogs`, `Demands`, `Bounds`). |
| 7 | **Transparency** | Base transparency percentage (0–100). Negative values create "Ghost Layers". |
| 8 | **Derive** | Field mapping for Point Data Estimator (e.g. `[contour, SHWL]`). |
| 9 | **Units** | Physical engineering unit (e.g. `m`, `m/s`, `g`). |
| 10 | **Estimate** | `Yes` or `No`. Whether sampled by the Point Data Estimator. |
| 11 | **Credit Page** | Attribution HTML page in `frontend/credits/` or inline hyperlink string for Basemaps. |
| 12 | **Zoom Level** | Maximum tile server zoom limit for Basemaps (e.g. `19`). |
| 13 | **Classify With** | Property name used to split features into discrete legend entries (e.g. `field_division`, `bridge_type`). Set `No` to disable. |
| 14 | **Search On** | Comma-separated bracketed search fields with masks (e.g. `[bridge_type, Bridge Type], [spans, Spans]`). |
| 15 | **Map from Legends** | `Yes` or `No`. If `Yes`, clicking legend chips in the side panel executes on-map feature filtering and zoom. |

---

## ⚙️ Environment Configuration (`.env`)

```bash
# --- Database credentials -----------------------------------------------------
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=webmap
DATABASE_URL=postgresql://postgres:your_secure_password@db:5432/webmap

# --- Production Ports & Re-import ---------------------------------------------
HTTP_PORT=8002
FORCE_REIMPORT=0

# --- Authentication (Webmaster & BDD Officers) --------------------------------
WEBMASTER_USERNAME=webmaster_username_now
WEBMASTER_PASSWORD=webmaster_password_now

BDD1_USERNAME=bdd_1
BDD1_PASSWORD=bdd1_rhd_bridge_2026

BDD2_USERNAME=bdd_2
BDD2_PASSWORD=bdd2_rhd_bridge_2026

BDD3_USERNAME=bdd_3
BDD3_PASSWORD=bdd3_rhd_bridge_2026

# --- RHD DESC Interoperability ------------------------------------------------
DESC_BASE_URL=https://acqform.rhdbridge.com
ADDS_BASE_URL=https://acqform.rhdbridge.com
```

---

## 🚀 Quickstart & Local Development

Dependencies are managed using `uv` (a blazingly fast Python package manager):

```bash
# 1. Clone repository
git clone https://github.com/MdIntisharRahman/webmap_for_infra_hydro_geo.git
cd webmap_for_infra_hydro_geo

# 2. First-time setup (database initialization & map ingestion)
./first_run.sh

# 3. Launch local development servers
./start.sh
```

- Local Webmap UI: `http://localhost:8383`
- Local FastAPI Backend: `http://localhost:8484`

---

## 🌐 Production Deployment (VPS / Docker)

The live production system runs on VPS `62.171.150.194`:

```bash
# Pull latest code
cd /opt/webmap
git pull origin main

# Rebuild backend image if Python code changed
docker compose up -d --build backend

# Or simply restart existing containers
docker compose restart backend frontend

# Zero-downtime Nginx reload (for frontend/ HTML/CSS/JS edits)
docker exec webmap-frontend-1 nginx -s reload
```

Live Production URL: **`https://webmap.rhdbridge.com`**

---

## 🏛️ Institutional Ownership

**Government of the People's Republic of Bangladesh**  
Roads and Highways Department (RHD)  
Bridge Management Wing / Bridge Design Circle  
Sarak Bhaban, Tejgaon, Dhaka-1208
