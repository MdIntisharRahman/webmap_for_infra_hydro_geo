const fs = require('fs');

let js = fs.readFileSync('frontend/app.js', 'utf8');

const old_cb = `            loadCb.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (loadCb.checked) {
                    await loadLayerData();
                    if (isVisuallyActive && geoLayer) {
                        geoLayer.addTo(map);
                    }
                } else {
                    if (geoLayer) {
                        map.removeLayer(geoLayer);
                        geoLayer = null;
                    }
                    colorUI.innerHTML = \`<div style="width: 12px; height: 12px; border-radius: 50%; background: #cbd5e1; margin-right: 6px; flex-shrink:0;"></div>\`;
                    subLegendUI.innerHTML = '';
                    delete loadedLayers[layerInfo.name];
                }
            });`;

const new_cb = `            loadCb.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (loadCb.checked) {
                    await loadLayerData();
                    if (isVisuallyActive && geoLayer) {
                        geoLayer.addTo(map);
                        item.classList.add('active');
                    }
                } else {
                    if (geoLayer) {
                        map.removeLayer(geoLayer);
                        geoLayer = null;
                    }
                    item.classList.remove('active');
                    colorUI.innerHTML = \`<div style="width: 12px; height: 12px; border-radius: 50%; background: #cbd5e1; margin-right: 6px; flex-shrink:0;"></div>\`;
                    subLegendUI.innerHTML = '';
                    delete loadedLayers[layerInfo.name];
                }
            });`;

if (js.includes(old_cb)) {
    console.log('Found loadCb');
    js = js.replace(old_cb, new_cb);
} else {
    console.log('NOT FOUND loadCb');
}

js = js.replaceAll("color: '#facc15'", "color: '#38bdf8'");

fs.writeFileSync('frontend/app.js', js);

let html = fs.readFileSync('frontend/index.html', 'utf8');
html = html.replace('v=36', 'v=37');
fs.writeFileSync('frontend/index.html', html);
