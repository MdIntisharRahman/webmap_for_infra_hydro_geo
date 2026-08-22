import re

with open('frontend/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Make hidden layers visually hidden in the side panel
old_item = """            const item = document.createElement("div");
            item.className = "layer-item";
            item.dataset.table = layerInfo.table;"""
new_item = """            const item = document.createElement("div");
            item.className = "layer-item";
            item.dataset.table = layerInfo.table;
            
            if (layerInfo.transparency !== null && layerInfo.transparency < 0) {
                item.style.display = "none";
                layerInfo.show_first = true; // force load
            }"""
code = code.replace(old_item, new_item)

# Update raster URL from maps/ to ${API_BASE_URL}/maps/
old_raster_url = """                    if (layerInfo.type && layerInfo.type.toLowerCase() === "raster") {
                        const url = `maps/${layerInfo.filename}`;"""
new_raster_url = """                    if (layerInfo.type && layerInfo.type.toLowerCase() === "raster") {
                        const url = `${API_BASE_URL}/maps/${layerInfo.filename}`;"""
code = code.replace(old_raster_url, new_raster_url)

# Update raster opacity
old_raster_opacity = """                        geoLayer = new GeoRasterLayer({
                            georaster: georaster,
                            opacity: 0.7,
                            resolution: 256,
                            pane: paneName
                        });"""
new_raster_opacity = """                        let rasterOpacity = 0.7;
                        if (layerInfo.transparency !== null) {
                            if (layerInfo.transparency < 0) {
                                rasterOpacity = 0;
                            } else {
                                rasterOpacity = (100 - layerInfo.transparency) / 100;
                            }
                        }
                        
                        geoLayer = new GeoRasterLayer({
                            georaster: georaster,
                            opacity: rasterOpacity,
                            resolution: 256,
                            pane: paneName
                        });"""
code = code.replace(old_raster_opacity, new_raster_opacity)

# Update point data estimator activeTables
old_active_tables = """        const activeTables = Array.from(document.querySelectorAll('.layer-load-cb:checked'))
                                .map(cb => cb.closest('.layer-item').dataset.table)
                                .filter(Boolean)
                                .join(',');"""
new_active_tables = """        let activeTables = Array.from(document.querySelectorAll('.layer-load-cb:checked'))
                                .map(cb => cb.closest('.layer-item').dataset.table)
                                .filter(Boolean);
        
        if (window.allLayerConfigs) {
            window.allLayerConfigs.forEach(layer => {
                if (layer.transparency !== null && layer.transparency < 0) {
                    if (!activeTables.includes(layer.table)) {
                        activeTables.push(layer.table);
                    }
                }
            });
        }
        
        activeTables = activeTables.join(',');"""
code = code.replace(old_active_tables, new_active_tables)

with open('frontend/app.js', 'w', encoding='utf-8') as f:
    f.write(code)
print("done")
