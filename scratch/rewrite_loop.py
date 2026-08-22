import re

with open('frontend/app.js', 'r') as f:
    js = f.read()

pattern = r"(for \(let i = 0; i < layers\.length; i\+\+\) \{)(.*?)(^\s*\}\n\s*\} catch \(error\) \{)"
match = re.search(pattern, js, re.DOTALL | re.MULTILINE)
if not match:
    print("Could not find loop!")
    exit(1)

new_loop_body = """
            const layerInfo = layers[i];
            const color = engineeringColors[i % engineeringColors.length];

            const item = document.createElement("div");
            item.className = "layer-item";
            item.dataset.table = layerInfo.table;
            
            let isVisuallyActive = layerInfo.show_first !== false;
            let isLoaded = layerInfo.show_first !== false;
            
            if (isVisuallyActive) {
                item.classList.add("active");
            }

            let creditBtnUI = "";
            if (layerInfo.credit_page) {
                creditBtnUI = `<div class="credit-btn" data-url="credits/${layerInfo.credit_page}" title="View Credits">Cr</div>`;
            }

            const checkboxId = `cb-${i}`;
            const checkboxUI = `<input id="${checkboxId}" class="layer-load-cb" type="checkbox" style="margin-right: 8px; flex-shrink: 0; width: 14px; height: 14px; margin-top: 1px;" ${isLoaded ? 'checked' : ''}>`;

            item.innerHTML = `
                <div class="layer-info-container" style="display: flex; flex-direction: column; gap: 4px; flex: 1; overflow: hidden; margin-right: 12px;">
                    <div class="layer-info" style="display: flex; align-items: center; justify-content: space-between; overflow: hidden; width: 100%;">
                        <div style="display: flex; align-items: center; overflow: hidden; position: relative; flex: 1;">
                            ${checkboxUI}
                            <div class="layer-color-ui" style="display:flex; align-items:center;"></div>
                            <div class="sliding-name-container" style="overflow: hidden; white-space: nowrap; position: relative; flex: 1; margin-left: 6px;">
                                <span class="layer-name sliding-name" style="display: inline-block; transition: transform 2s ease-in-out;">${layerInfo.name}</span>
                            </div>
                        </div>
                        ${creditBtnUI}
                    </div>
                    <div class="sub-legend-ui"></div>
                </div>
                <div class="toggle-switch"></div>
            `;
            
            const toggleSwitch = item.querySelector('.toggle-switch');
            const loadCb = item.querySelector('.layer-load-cb');
            const colorUI = item.querySelector('.layer-color-ui');
            const subLegendUI = item.querySelector('.sub-legend-ui');
            
            const crBtn = item.querySelector(".credit-btn");
            if (crBtn) {
                crBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const modal = document.getElementById('iframe-modal');
                    const frame = document.getElementById('iframe-modal-frame');
                    frame.src = crBtn.dataset.url;
                    modal.classList.remove('hidden');
                });
            }

            const container = item.querySelector('.sliding-name-container');
            const nameEl = item.querySelector('.sliding-name');
            item.addEventListener('mouseenter', () => {
                const diff = nameEl.scrollWidth - container.clientWidth;
                if (diff > 0) {
                    nameEl.style.transform = `translateX(-${diff + 5}px)`;
                }
            });
            item.addEventListener('mouseleave', () => {
                nameEl.style.transform = `translateX(0)`;
            });

            tabContentWrappers[layerInfo.tab].appendChild(item);

            let geoLayer = null;

            const loadLayerData = async () => {
                toggleSwitch.classList.add('loading');
                try {
                    const paneName = "pane_" + i;
                    if (!map.getPane(paneName)) {
                        map.createPane(paneName);
                        map.getPane(paneName).style.zIndex = 400 + (layers.length - i);
                    }

                    if (layerInfo.type && layerInfo.type.toLowerCase() === "raster") {
                        const url = `maps/${layerInfo.filename}`;
                        const georaster = await parseGeoraster(url);
                        geoLayer = new GeoRasterLayer({
                            georaster: georaster,
                            opacity: 0.7,
                            resolution: 256,
                            pane: paneName
                        });
                        colorUI.innerHTML = `<div class="legend-color-dot" style="background: #9aa5b1; margin-right: 6px;"></div>`;
                    } else {
                        const layerDataRes = await fetch(`${API_BASE_URL}/layers/${layerInfo.table}`);
                        const data = await layerDataRes.json();
                        
                        const classMap = new Map();
                        if (data.features) {
                            for (const feat of data.features) {
                                if (feat.properties && feat.properties.f_class_name && feat.properties.color) {
                                    classMap.set(feat.properties.f_class_name, feat.properties.color);
                                }
                            }
                        }
                        const hasClasses = classMap.size > 0;
                        if (hasClasses) {
                            colorUI.innerHTML = `<div style="width: 12px; height: 12px; margin-right: 6px;"></div>`;
                            let subHTML = `<div class="layer-sub-legend" style="display:flex; flex-wrap:wrap; gap:6px;">`;
                            let count = 0;
                            const classEntries = Array.from(classMap.entries());
                            for (const [cName, cColor] of classEntries) {
                                if (count < 3) {
                                    subHTML += `<div class="legend-pill" title="${cName}"><div class="legend-color-dot" style="background: ${cColor};"></div><span class="legend-pill-text">${cName}</span></div>`;
                                }
                                count++;
                            }
                            if (count > 3) {
                                subHTML += `<div class="legend-more-btn">+${count - 3}</div>`;
                            }
                            subHTML += `</div>`;
                            subLegendUI.innerHTML = subHTML;
                            
                            const moreBtn = subLegendUI.querySelector('.legend-more-btn');
                            if (moreBtn) {
                                moreBtn.addEventListener("click", (e) => {
                                    e.stopPropagation();
                                    const rightPanelTitle = document.getElementById("right-panel-title");
                                    const rightPanelContent = document.getElementById("right-panel-content");
                                    const rightPanelContainer = document.getElementById("right-panel-container");
                                    if (rightPanelTitle) rightPanelTitle.textContent = layerInfo.name;
                                    if (rightPanelContent) {
                                        rightPanelContent.innerHTML = "";
                                        for (const [cName, cData] of classEntries) {
                                            rightPanelContent.innerHTML += `<div class="right-legend-item"><div class="right-legend-color" style="background: ${cData};"></div><span>${cName}</span></div>`;
                                        }
                                    }
                                    if (rightPanelContainer) rightPanelContainer.classList.add("pinned");
                                });
                            }
                        } else {
                            colorUI.innerHTML = `<div class="legend-color-dot" style="background: ${color}; margin-right: 6px;"></div>`;
                        }

                        geoLayer = L.geoJSON(data, {
                            pane: paneName,
                            filter: function (feature) {
                                const name = (feature.properties.name || feature.properties.river_name || feature.properties.locality || "").toLowerCase();
                                if (name.includes("bay of bengal")) return false;
                                return true;
                            },
                            style: (feature) => {
                                if (feature.properties && feature.properties.color) {
                                    let c = feature.properties.color;
                                    if (!c.startsWith("#")) c = "#" + c;
                                    return { color: c, weight: 2, fillOpacity: 0.6 };
                                }
                                return { color: color, weight: 2, fillOpacity: 0.6 };
                            },
                            onEachFeature: (feature, layer) => {
                                const populateTooltip = (e) => {
                                    const props = feature.properties;
                                    let headerValue = " ";
                                    let displayKeys = null;
                                    if (props.keys) {
                                        let parsedKeys = [];
                                        try {
                                            let keysStr = props.keys;
                                            if (typeof keysStr === "string") {
                                                let regex = /\\[([^,]+),\\s*([^\\]]+)\\]/g;
                                                let match;
                                                while ((match = regex.exec(keysStr)) !== null) {
                                                    parsedKeys.push([match[1].trim(), match[2].trim()]);
                                                }
                                            } else {
                                                parsedKeys = keysStr;
                                            }
                                        } catch (err) {}
                                        if (parsedKeys && parsedKeys.length > 0) {
                                            let hVal = props[parsedKeys[0][0]];
                                            headerValue = hVal !== undefined && hVal !== null && hVal !== "" ? hVal : " ";
                                            displayKeys = parsedKeys.slice(1);
                                        }
                                    } else {
                                        headerValue = props.contour !== undefined && props.contour !== null ? `Contour: ${props.contour} m` : props.name || props.road_name || props.river_name || props.locality || " ";
                                    }
                                    const tooltipName = document.getElementById("tooltip-name");
                                    const tooltipLayer = document.getElementById("tooltip-layer");
                                    const tooltipRef = document.getElementById("tooltip-ref");
                                    const tooltip = document.getElementById("tooltip");
                                    if(tooltipName) tooltipName.textContent = headerValue;
                                    if(tooltipLayer) tooltipLayer.textContent = layerInfo.name;
                                    if(tooltipRef) tooltipRef.style.display = "none";
                                    renderTooltipProps(props, displayKeys);
                                    if(tooltip) tooltip.classList.add("visible");
                                };
                                layer.on({
                                    click: (e) => {
                                        const targetBtn = document.getElementById("target-btn");
                                        if (targetBtn && targetBtn.classList.contains("active")) return;
                                        L.DomEvent.stopPropagation(e);
                                        if (window.activeFeatureLayer && window.activeFeatureLayer !== layer && window.activeFeatureLayer.resetStyleFunc) {
                                            window.activeFeatureLayer.resetStyleFunc();
                                        }
                                        window.featureTooltipLocked = true;
                                        window.activeFeatureLayer = layer;
                                        window.lockedLatLng = e.latlng;
                                        layer.resetStyleFunc = () => geoLayer.resetStyle(layer);
                                        layer.setStyle({ weight: 5, color: '#facc15', fillOpacity: 0.8 });
                                        layer.bringToFront();
                                        populateTooltip(e);
                                        const tooltip = document.getElementById("tooltip");
                                        if(tooltip) tooltip.style.transform = `translate3d(${e.originalEvent.pageX + 15}px, ${e.originalEvent.pageY + 15}px, 0)`;
                                    },
                                    mouseover: (e) => {
                                        if (window.featureTooltipLocked) return;
                                        if (window.tooltipHideTimeout) clearTimeout(window.tooltipHideTimeout);
                                        layer.setStyle({ weight: 5, color: '#facc15', fillOpacity: 0.8 });
                                        layer.bringToFront();
                                        window.activeFeatureLayer = layer;
                                        layer.resetStyleFunc = () => geoLayer.resetStyle(layer);
                                        populateTooltip(e);
                                    },
                                    mouseout: (e) => {
                                        if (window.featureTooltipLocked) return;
                                        geoLayer.resetStyle(layer);
                                        window.tooltipHideTimeout = setTimeout(() => {
                                            if (!window.featureTooltipLocked) {
                                                const tooltip = document.getElementById("tooltip");
                                                if(tooltip) tooltip.classList.remove("visible");
                                                window.activeFeatureLayer = null;
                                            }
                                        }, 250);
                                    },
                                    mousemove: (e) => {
                                        if (window.featureTooltipLocked) return;
                                        const tooltip = document.getElementById("tooltip");
                                        if(tooltip) tooltip.style.transform = `translate3d(${e.originalEvent.pageX + 15}px, ${e.originalEvent.pageY + 15}px, 0)`;
                                    },
                                });
                            },
                        });
                    }
                    loadedLayers[layerInfo.name] = geoLayer;
                } catch (e) {
                    console.error("Error loading layer:", e);
                }
                toggleSwitch.classList.remove('loading');
            };

            loadCb.addEventListener('click', async (e) => {
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
                    colorUI.innerHTML = '';
                    subLegendUI.innerHTML = '';
                    delete loadedLayers[layerInfo.name];
                }
            });

            item.addEventListener("click", () => {
                if (!loadCb.checked) return;
                isVisuallyActive = !isVisuallyActive;
                if (isVisuallyActive) {
                    item.classList.add("active");
                    if (geoLayer) geoLayer.addTo(map);
                } else {
                    item.classList.remove("active");
                    if (geoLayer) map.removeLayer(geoLayer);
                }
            });

            if (isLoaded) {
                loadLayerData().then(() => {
                    if (isVisuallyActive && geoLayer) {
                        geoLayer.addTo(map);
                    }
                });
            }
"""

js = js[:match.start(2)] + new_loop_body + js[match.start(3):]

# 2. Update the Point Data Estimator API call again
new_fetch = '''const activeTables = Array.from(document.querySelectorAll('.layer-load-cb:checked'))
                                .map(cb => cb.closest('.layer-item').dataset.table)
                                .filter(Boolean)
                                .join(',');
        const res = await fetch(
            `${API_BASE_URL}/estimate_water_levels?lat=${lat}&lng=${lng}&active_tables=${activeTables}`,
        );'''
js = re.sub(r'const res = await fetch\(\s*`\$\{API_BASE_URL\}/estimate_water_levels\?lat=\$\{lat\}&lng=\$\{lng\}`,\s*\);', new_fetch, js)

with open('frontend/app.js', 'w') as f:
    f.write(js)
print("Loop replaced")
