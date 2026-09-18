# TASK SPECIFICATION FOR ANTIGRAVITY

## Objective
Implement a robust borelog ingestion, approval, and visualization pipeline within the webmap stack (ReactJS, Python/FastAPI, PostgreSQL/PostGIS). The system will capture borelog data via a React form, stage it for review, and upon approval, publish it to a spatial vector map where users can view the data in a rich, multi-track Plotly.js interface or export it to XLSX.

**Strict Coordinate Reference System (CRS) Rules:** 
* Vector layers and GeoJSON data must be explicitly set to EPSG:4326 (Decimal Degrees)[cite: 5, 8].
* Visual raster tiles (basemaps) must be rendered in EPSG:3857 (Web Mercator)[cite: 5, 8].

**Reference Files Available in `./scratch/`:**
* `borelog_JSON_form.js`
* `Borelog_Visualizer.jsx`
* `MultiTab_XLSX_Export_Engine.js`
* `pastel_generator.js`

---

## Phase 1: Ingestion and Staging (Frontend & Backend)
**Context:** Users submit new borelogs which must be held in a staging area before public webmap display.
**Requirements:**
1. **Form Refinement:** Improve `./scratch/borelog_JSON_form.js` using the `/impeccable` command to ensure the UI is clean, robust, and free of AI artifacts[cite: 5].
2. **Data Serialization:** When submitted, the form must serialize the exhaustive borelog data (metadata, granular `strata`, and `spt_records`) into a self-contained JSON file[cite: 5, 6]. 
3. **File Naming & Staging:** Name the file with a unique 8-character alphanumeric string appended with `.JSON` (e.g., `A1B2C3D4.JSON`)[cite: 5]. Save this file to the storage directory and append a record of it to the 'Awaiting Borelogs' map in the geo-tab[cite: 5].

---

## Phase 2: The Approval Pipeline (`borelog-approval` script)
**Context:** An administrative script is required to move staged borelogs into the production map.
**Requirements:**
1. **Review Mechanism:** Write a Python/FastAPI script named `borelog-approval` that reads the records of appended borelogs awaiting approval and lists them sequentially for admin review[cite: 5].
2. **Publishing to PostGIS:** Upon approval, the script must create a new point feature in the 'Appended Borelogs' vector-point-feature-map in the database[cite: 5].
3. **Attribute Linking:** The newly created spatial feature must include an attribute named `f_file`, which strictly contains the exact filename of the associated JSON (e.g., `f_file: "A1B2C3D4.JSON"`)[cite: 5]. 

---

## Phase 3: Frontend Map Interface (ReactJS + Leaflet)
**Context:** The user interacts with the 'Appended Borelogs' map to view published data[cite: 5].
**Requirements:**
1. **Layer Rendering:** Load the 'Appended Borelogs' points as EPSG:4326 GeoJSON markers over an EPSG:3857 basemap[cite: 5, 8]. 
2. **Tooltip & Interaction:** Implement a check: if the clicked layer is of "Datapoint Type: Borelogs" (verified via the list of maps table), render a tooltip displaying "Borelog Detail"[cite: 5].
3. **Data Fetching:** When the user clicks the "Borelog Detail" tooltip, the application must read the `f_file` attribute from that specific feature, fetch the corresponding JSON file from the server, and pass its exhaustive payload into the `Borelog_Visualizer.jsx` modal[cite: 5].

---

## Phase 4: Visualization and Export Integration
**Context:** Integrating the provided scratch components to display the fetched JSON payload.
**Requirements:**
1. **Visualization:** Mount `Borelog_Visualizer.jsx` (which relies on `pastel_generator.js` for dynamic color assignment) to render the 4-track subsoil profile using the fetched JSON data[cite: 5].
2. **Data Export:** Wire the `MultiTab_XLSX_Export_Engine.js` to an "Export XLSX" button within the visualizer UI, allowing users to trigger a direct browser download of the raw data into separated tabs (Metadata/SPT, Atterberg, Consolidation, etc.)[cite: 5].