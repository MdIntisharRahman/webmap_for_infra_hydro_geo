import re

with open('frontend/app.js', 'r') as f:
    js = f.read()

pattern = r"(async function fetchAndRenderLayers\(\) \{)(.*?)(^\}\n\nfetchAndRenderLayers\(\);)"
match = re.search(pattern, js, re.DOTALL | re.MULTILINE)

new_func = """async function fetchAndRenderLayers() {
    try {
        const response = await fetch(`${API_BASE_URL}/layers`);
        const layers = await response.json();

        // Build Tabs
        const uniqueTabs = [...new Set(layers.map((l) => l.tab || "Uncategorized"))];
        uniqueTabs.push("About Us");

        tabsContainerEl.innerHTML = "";
        tabContentAreaEl.innerHTML = "";

        const tabContentWrappers = {};

        uniqueTabs.forEach((tabName, idx) => {
            const slug = tabName.toLowerCase().replace(/[^a-z0-9]/g, "-");

            const tabBtn = document.createElement("div");
            tabBtn.className = "vertical-tab";
            tabBtn.textContent = tabName;
            if (idx === 0) tabBtn.classList.add("active");
            tabsContainerEl.appendChild(tabBtn);

            const contentWrapper = document.createElement("div");
            contentWrapper.className = "tab-content-wrapper";
            if (idx === 0) contentWrapper.classList.add("active");
            contentWrapper.id = `tab-${slug}`;
            tabContentAreaEl.appendChild(contentWrapper);

            tabContentWrappers[tabName] = contentWrapper;

            tabBtn.addEventListener("click", () => {
                document.querySelectorAll(".vertical-tab").forEach((btn) => btn.classList.remove("active"));
                document.querySelectorAll(".tab-content-wrapper").forEach((content) => content.classList.remove("active"));
                tabBtn.classList.add("active");
                contentWrapper.classList.add("active");
            });
        });

        if (tabContentWrappers["About Us"]) {
            fetch("about_us.html")
                .then(r => r.text())
                .then(html => {
                    tabContentWrappers["About Us"].innerHTML = html;
                })
                .catch(() => {
                    tabContentWrappers["About Us"].innerHTML = `<div id="about-us-content">Could not load About Us.</div>`;
                });
        }

        for (let i = 0; i < layers.length; i++) {
            const layerInfo = layers[i];
            const color = engineeringColors[i % engineeringColors.length];

            const item = document.createElement("div");
            item.className = "layer-item";
            item.dataset.table = layerInfo.table;
            
            let isActive = layerInfo.show_first !== false;
            if (isActive) {
                item.classList.add("active");
            }

            let creditBtnUI = "";
            if (layerInfo.credit_page) {
                creditBtnUI = `<div class="credit-btn" data-url="credits/${layerInfo.credit_page}" title="View Credits">Cr</div>`;
            }

            item.innerHTML = `
                <div class="layer-info-container" style="display: flex; flex-direction: column; gap: 4px; flex: 1; overflow: hidden; margin-right: 12px;">
                    <div class="layer-info" style="display: flex; align-items: center; justify-content: space-between; overflow: hidden; width: 100%;">
                        <div class="sliding-name-container" style="flex: 1; overflow: hidden; white-space: nowrap; margin-right: 8px;">
                            <span class="sliding-name" style="display: inline-block; transition: transform 0.3s ease;">${layerInfo.name}</span>
                        </div>
                        ${creditBtnUI}
                    </div>
                    <div class="sub-legend-ui"></div>
                </div>
                <div class="toggle-switch"></div>
            `;
            
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

            // Lazy loading logic
            let loadedData = false;
            let geoLayer = null;

            const loadLayer = async () => {
                if (loadedData) return;
                item.querySelector('.toggle-switch').classList.add('loading');
                try {
                    const paneName = "pane_" + i;
                    if (!map.getPane(paneName)) {
                        map.createPane(paneName);
                    }
                    map.getPane(paneName).style.zIndex = 400 + (layers.length - i);

                    if (layerInfo.type && layerInfo.type.toLowerCase() === "raster") {
                        const url = `maps/${layerInfo.filename}`;
                        const georaster = await parseGeoraster(url);
                        geoLayer = new GeoRasterLayer({
                            georaster: georaster,
                            opacity: 0.7,
                            resolution: 256,
                            pane: paneName
                        });
                        loadedData = true;
                    } else {
                        const layerDataRes = await fetch(`${API_BASE_URL}/layers/${layerInfo.table}`);
                        const data = await layerDataRes.json();
                        
                        // Extract classes
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
                            let subLegendUI = `<div class="layer-sub-legend" style="display:flex; flex-wrap:wrap; gap:6px;">`;
                            let count = 0;
                            const classEntries = Array.from(classMap.entries());
                            for (const [cName, cColor] of classEntries) {
                                if (count < 3) {
                                    subLegendUI += `
                                        <div class="legend-pill" title="${cName}">
                                            <div class="legend-color-dot" style="background: ${cColor};"></div>
                                            <span class="legend-pill-text">${cName}</span>
                                        </div>
                                    `;
                                }
                                count++;
                            }
                            if (count > 3) {
                                subLegendUI += `<div class="legend-more-btn">+${count - 3}</div>`;
                            }
                            subLegendUI += `</div>`;
                            item.querySelector('.sub-legend-ui').innerHTML = subLegendUI;
                            
                            const moreBtn = item.querySelector('.legend-more-btn');
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
                                            rightPanelContent.innerHTML += `
                                                <div class="right-legend-item">
                                                    <div class="right-legend-color" style="background: ${cData};"></div>
                                                    <span>${cName}</span>
                                                </div>
                                            `;
                                        }
                                    }
                                    if (rightPanelContainer) rightPanelContainer.classList.add("pinned");
                                });
                            }
                        }

                        geoLayer = L.geoJSON(data, {
                            pane: paneName,
                            filter: function (feature) {
                                const name = (feature.properties.name || feature.properties.river_name || feature.properties.locality || "").toLowerCase();
                                if (name.includes("bay of bengal")) return false;
                                return true;
                            },
                            style: (feature) => getFeatureStyle(feature, color),
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
                                    tooltipName.textContent = headerValue;
                                    tooltipLayer.textContent = layerInfo.name;
                                    tooltipRef.style.display = "none";
                                    renderTooltipProps(props, displayKeys);
                                    tooltip.classList.add("visible");
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
                                        layer.setStyle(getHighlightStyle(feature, color));
                                        layer.bringToFront();
                                        populateTooltip(e);
                                        tooltip.style.transform = `translate3d(${e.originalEvent.pageX + 15}px, ${e.originalEvent.pageY + 15}px, 0)`;
                                    },
                                    mouseover: (e) => {
                                        if (window.featureTooltipLocked) return;
                                        if (window.tooltipHideTimeout) clearTimeout(window.tooltipHideTimeout);
                                        layer.setStyle(getHighlightStyle(feature, color));
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
                                                tooltip.classList.remove("visible");
                                                window.activeFeatureLayer = null;
                                            }
                                        }, 250);
                                    },
                                    mousemove: (e) => {
                                        if (window.featureTooltipLocked) return;
                                        tooltip.style.transform = `translate3d(${e.originalEvent.pageX + 15}px, ${e.originalEvent.pageY + 15}px, 0)`;
                                    },
                                });
                            },
                        });
                        loadedData = true;
                    }

                    loadedLayers[layerInfo.name] = geoLayer;

                } catch (error) {
                    console.error("Error loading layer", layerInfo.name, error);
                }
                item.querySelector('.toggle-switch').classList.remove('loading');
            };

            item.addEventListener("click", async () => {
                isActive = !isActive;
                if (isActive) {
                    item.classList.add("active");
                    if (!loadedData) {
                        await loadLayer();
                    }
                    if (geoLayer) geoLayer.addTo(map);
                } else {
                    item.classList.remove("active");
                    if (geoLayer) map.removeLayer(geoLayer);
                }
            });

            // Initial load
            if (isActive) {
                loadLayer().then(() => {
                    if (geoLayer) geoLayer.addTo(map);
                });
            }
        }
    } catch (error) {
        console.error("Error fetching layers data:", error);
        layerListEl.innerHTML = `<div class="loading-state" style="color: #ffb3ba">Error connecting to server.</div>`;
    }
}

fetchAndRenderLayers();"""

js = js[:match.start()] + new_func + js[match.end():]
# bump cache buster
js = js.replace('app.js?v=27', 'app.js?v=28')
with open('frontend/index.html', 'r') as f:
    html = f.read()
html = html.replace('app.js?v=27', 'app.js?v=28')
with open('frontend/index.html', 'w') as f:
    f.write(html)

with open('frontend/app.js', 'w') as f:
    f.write(js)
print('Rewrite successful')
