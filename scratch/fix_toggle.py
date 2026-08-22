with open('frontend/app.js', 'r') as f:
    js = f.read()

old_cb = '''            loadCb.addEventListener('click', async (e) => {
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
                    colorUI.innerHTML = `<div style="width: 12px; height: 12px; border-radius: 50%; background: #cbd5e1; margin-right: 6px; flex-shrink:0;"></div>`;
                    subLegendUI.innerHTML = '';
                    delete loadedLayers[layerInfo.name];
                }
            });'''

new_cb = '''            loadCb.addEventListener('click', async (e) => {
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
                    colorUI.innerHTML = `<div style="width: 12px; height: 12px; border-radius: 50%; background: #cbd5e1; margin-right: 6px; flex-shrink:0;"></div>`;
                    subLegendUI.innerHTML = '';
                    delete loadedLayers[layerInfo.name];
                }
            });'''

if old_cb in js:
    print('Found loadCb')
    js = js.replace(old_cb, new_cb)
else:
    print('NOT FOUND loadCb')

js = js.replace("color: '#facc15'", "color: '#38bdf8'")

with open('frontend/app.js', 'w') as f:
    f.write(js)

with open('frontend/index.html', 'r') as f:
    html = f.read()
html = html.replace('v=36', 'v=37')
with open('frontend/index.html', 'w') as f:
    f.write(html)
