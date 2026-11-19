# RHD Webmap — Geospatial Infrastructure, Hydrographic & Geotechnical Portal
## Master Codebase Index & Architectural Catalog

> **Institutional Scope**: Roads and Highways Department (RHD), Ministry of Road Transport and Bridges, Government of the People's Republic of Bangladesh.  
> **System Purpose**: Interactive national GIS visualization, geotechnical borehole strata modeling, Point Data hydraulic estimation (SHWL/SLWL), multi-source basemap compositing, and dynamic RHD DESC structural demand spatial coordination.  
> **Codebase Graph Index**: 2,102 Nodes • 10,957 Edges (Synchronized via `codebase-memory-mcp`)  
> **Index Timestamp**: 2026-11-20

---

## 1. Executive Summary & Tech Stack

| Layer | Technology | Key Libraries / Modules |
| :--- | :--- | :--- |
| **Frontend UI** | HTML5, CSS3, Vanilla JavaScript | Leaflet.js 1.9.4, GeoRaster, Hardware-Accelerated Glassmorphic CSS |
| **Backend API** | Python 3.12+ / FastAPI | Uvicorn, SQLAlchemy (Async), GeoPandas, GeoAlchemy2, Rasterio, Shapely |
| **Database** | PostgreSQL 15+ with PostGIS 3.4 | PostGIS native spatial functions (`ST_AsGeoJSON`, `ST_DWithin`, KNN `<->`) |
| **Web Server** | Nginx Alpine (Frontend container) | Static file caching, reverse proxy routing for `/api/` and `/maps/` |
| **Interoperability** | RHD DESC Integration | Dynamic REST GeoJSON proxying, iframe preview dossiers, RBAC headers |

---

## 2. Directory Structure Map

```
d:\System 47\Webmap/
├── backend/                            # FastAPI Asynchronous Application
│   ├── main.py                         # App entrypoint, layer discovery, proxying, IDW calculations
│   └── database.py                     # Async database engine & PostGIS connection pool
├── frontend/                           # Client-side Static Web Application
│   ├── credits/                        # Layer attribution HTML pages (Prosoil, SRTM, USGS, DPM)
│   ├── resources/                      # Self-hosted assets (Fonts, Images, Icons, Leaflet library)
│   │   ├── fonts/                      # Offline WOFF2 font files (Inter, Outfit, ITC Stone Sans)
│   │   └── images/                     # SVGs, icons, and logo assets
│   ├── app.js                          # Core Leaflet map coordinator, legends, search, auth, and IDW
│   ├── BorelogVisualizer.js            # DOM-based geotechnical strata rendering engine
│   ├── index.html                      # Single page application HTML shell
│   └── styles.css                      # Master design tokens, glassmorphism, responsive bottom sheets
├── Maps/                               # Geospatial Data Repository & Manifest
│   ├── map_list.md                     # Master 15-column configuration table (Source of Truth)
│   ├── *.geojson                       # Vector GeoJSON layers (Roads, Rivers, Borelogs, Zones)
│   ├── *.tif / *.png                   # Analytical GeoTIFF rasters and rendered PNG visualization overlays
│   └── *-color_map.txt                 # QGIS discrete color map files for raster legends
├── docker-compose.yml                  # Production multi-container orchestration (db, backend, frontend)
├── Dockerfile                          # Backend container image definition with GDAL dependencies
├── nginx.conf                          # Frontend Nginx routing & reverse proxy configuration
├── import_local_maps.py                # PostGIS vector ingestion and raster metadata extraction pipeline
├── about_us.md                         # Institutional about-us content
├── first_run.sh                        # Automated local setup & database provisioning script
├── start.sh                            # Development startup script
├── update_maps.sh                      # Hot map manifest update script
├── INDEX.md                            # This Master Architecture & System Index
└── README.md                           # Comprehensive Developer & Operational Guide
```

---

## 3. Subsystem Architecture

### A. RHD DESC Demands Interoperability
- **Header Decoupling**: Sneaky login via double-click on `#header-rhd-logo` prompts for basic auth credentials.
- **Dynamic Proxying (`/api/layers/{table_name}`)**: When a demand layer (`demand_bdd_{1|2|3}_{demand|processing|delivered}`) is requested, `backend/main.py` checks role clearance and proxies the GeoJSON directly from `https://acqform.rhdbridge.com/api/exchange/webmap/geojson/{table_name}`.
- **Preview Dossier (`demand-preview-modal`)**: Renders embedded HTML preview with deep-link button opening the live record in RHD DESC.

### B. 'Map from Legends' & Classification Engine
- **Field-Driven Categorization**: When `classify_with` is defined (e.g. `field_division`), features are bucketed by category values rather than color, creating individual chips in the sub-legend and side panel.
- **Interactive Search Dispatch**: When `map_from_legends: true`, clicking a legend item invokes `window.executeLegendSearch`:
  - Syncs the search drawer to the layer and query.
  - Isolates matching features on the map canvas.
  - Applies crimson POI halo pulse animation (`.poi-halo-pulse`).
  - Animates map zoom via `flyToBounds`.
  - Displays match count toast.
  - Toggles off when clicked again to restore all features.

### C. Basemap Opacity & Compositing Engine
- **Single Basemap Opacity Synchronization**: Automatically slides `#single-basemap-opacity-slider` and applies $\text{Opacity \%} = 100 - \text{Transparency}$ on basemap switch.
- **Composite Mode**: Renders Primary basemap in `baseTilePanePrimary` (z-index 200) and Secondary basemap in `baseTilePaneSecondary` (z-index 201) with CSS `mixBlendMode` (`normal`, `multiply`, `overlay`, `screen`).
- **Interactive Swipe Split**: Injects `#basemap-swipe-divider` onto the canvas; mouse and touch dragging dynamically updates `clipPath: polygon(...)`.

### D. Geodesic Point Data Estimator
- **Geodesic Contours**: Samples Static High Water Level (SHWL) and Static Low Water Level (SLWL) contours using PostGIS KNN geodesic distance (`<->`).
- **Inverse Distance Weighting**:
  $$W(p) = \frac{\sum_{i=1}^k \frac{v_i}{d_i^p}}{\sum_{i=1}^k \frac{1}{d_i^p}}$$
- **Bedrock & Seismic Sampling**: Queries 1000-year and 2500-year Peak Ground Acceleration (PGA) grids, 0.2s/1.0s spectral acceleration, and USGS geological formations.

---

## 4. Production Host Configuration

- **Host IP**: `62.171.150.194`
- **Application Directory**: `/opt/webmap`
- **Frontend Container**: `webmap-frontend-1` (port 8002)
- **Backend Container**: `webmap-backend-1` (port 8484)
- **PostGIS Container**: `webmap-db-1` (port 5432 / 5433 host)
- **SSL / Domain**: `https://webmap.rhdbridge.com`
