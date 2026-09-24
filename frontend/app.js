/**
 * GEOSPATIAL MAP VISUALIZATION APPLICATION
 * Interactive Leaflet.js-based map for viewing layered geographical data
 * Supports real-time tooltips, coordinate lookups, and water level estimation
 */

// ============================================================================
// MAP INITIALIZATION
// ============================================================================

const API_BASE_URL =
    window.location.port === "8383" ? "http://localhost:8484/api" : "/api";

window.rasterMetadata = {};

const map = L.map("map", {
    zoomControl: false,
    attributionControl: false,
}).setView([23.685, 90.3563], 7);

L.control.zoom({ position: "bottomright" }).addTo(map);

L.control
    .attribution({ position: "bottomleft" })
    .addTo(map);

// ============================================================================
// UI ELEMENT REFERENCES
// ============================================================================

window.allLayerConfigs = [];
window.activeBasemapLayer = null;
window.activeBasemapItem = null;
const tabsContainerEl = document.getElementById("dynamic-tabs-container");
const tabContentAreaEl = document.getElementById("tab-content-area");
const tooltip = document.getElementById("tooltip");
const tooltipRef = document.getElementById("tooltip-ref");
const tooltipLayer = document.getElementById("tooltip-layer");
const tooltipName = document.getElementById("tooltip-name");
const tooltipDetails = document.getElementById("tooltip-details");

// ============================================================================
// COLOR PALETTE & LAYER STORAGE
// ============================================================================

const engineeringColors = [
    "#1d46e9",
    "#4a90e2",
    "#76c33b",
    "#ffe734",
    "#9f7aea",
    "#ed8936",
    "#00b5d8",
    "#3b82f6",
    "#f59e0b",
    "#f11e1e",
    "#616874",
    "#10b981",
];

const loadedLayers = {};

// ============================================================================
// PANEL PIN BUTTONS (KEEP PANELS VISIBLE)
// ============================================================================

const pinBtn = document.getElementById("pin-btn");
const panelContainer = document.querySelector(".side-panel-container");

if (pinBtn && panelContainer) {
    pinBtn.addEventListener("click", () => {
        panelContainer.classList.toggle("pinned");
        pinBtn.classList.toggle("pinned-active");
    });
}

// Right panel pin close button
const rightPinBtn = document.getElementById("right-pin-btn");
const rightPanelContainer = document.getElementById("right-panel-container");
if (rightPinBtn && rightPanelContainer) {
    rightPinBtn.addEventListener("click", () => {
        rightPanelContainer.classList.remove("pinned");
    });
}

// ============================================================================
// FEATURE STYLING FUNCTIONS
// ============================================================================

const getFeatureStyle = (feature, defaultColor, layerTransparency = null) => {
    let color = defaultColor;
    let weight = 1.5;

    // Check if data-driven styling is available
    if (feature.properties) {
        let fc = feature.properties.color || feature.properties.f_class_color;
        if (fc) {
            if (!fc.startsWith('#') && !fc.startsWith('rgb')) fc = '#' + fc;
            color = fc;
        }
    }

    if (!feature.geometry) return {}; // Handle features with null geometry
    const geomType = feature.geometry.type;
    const isPolygon = geomType.includes("Polygon");
    const isPoint = geomType.includes("Point");

    // Handle weight from feature properties if exists
    if (
        feature.properties &&
        feature.properties.f_class_weight !== undefined &&
        feature.properties.f_class_weight !== null
    ) {
        let pct = parseFloat(feature.properties.f_class_weight);
        if (pct === 0) {
            return { weight: 0, opacity: 0, fillOpacity: 0, color: "transparent" };
        }
        weight = isPolygon ? (0.75 * pct) / 100 : isPoint ? (1 * pct) / 100 : (1.5 * pct) / 100;
    } else {
        weight = isPolygon ? 0.75 : isPoint ? 1 : 1.5;
    }

    if (layerTransparency !== null && layerTransparency < 0) {
        return { weight: 0, opacity: 0, fillOpacity: 0, color: "transparent", interactive: false };
    }

    let finalOpacity = 0.8;
    let finalFillOpacity = isPolygon ? 0.3 : isPoint ? 0.8 : 1;

    let t = null;
    if (layerTransparency !== null && layerTransparency > 0) {
        t = parseFloat(layerTransparency);
    } else if (
        feature.properties &&
        feature.properties.f_class_transparency !== undefined &&
        feature.properties.f_class_transparency !== null &&
        feature.properties.f_class_transparency !== ""
    ) {
        t = parseFloat(feature.properties.f_class_transparency);
    }
    
    if (t !== null && !isNaN(t)) {
        finalOpacity = (100 - t) / 100;
        finalFillOpacity = isPolygon ? Math.min(0.3, finalOpacity) : isPoint ? Math.min(0.8, finalOpacity) : finalOpacity;
    }

    return {
        color: color,
        fillColor: color,
        weight: weight,
        fillOpacity: finalFillOpacity,
        opacity: finalOpacity,
        lineCap: "round",
        radius: isPoint ? 2.5 : undefined,
    };
};

const getHighlightStyle = (feature, color) => {
    const isPolygon = feature.geometry.type.includes("Polygon");
    const isPoint = feature.geometry.type.includes("Point");
    return {
        weight: isPolygon ? 1.5 : isPoint ? 2 : 2.5,
        color: "#4a5568",
        fillOpacity: isPolygon ? 0.6 : isPoint ? 1 : 1,
        opacity: 1,
        radius: isPoint ? 3.5 : undefined,
    };
};

// ============================================================================
// TOOLTIP RENDERING
// ============================================================================

const renderTooltipProps = (props, displayKeys, layerInfo) => {
    tooltipDetails.innerHTML = "";

    const otherPropsContainer = document.createElement("div");
    otherPropsContainer.className = "other-props-container";
    otherPropsContainer.style.display = "none";
    otherPropsContainer.style.flexDirection = "column";
    otherPropsContainer.style.gap = "8px";
    otherPropsContainer.style.marginTop = "8px";
    otherPropsContainer.style.borderTop = "1px dashed #e2e8f0";
    otherPropsContainer.style.paddingTop = "8px";

    let count = 0;

            const formatValue = (keyLabel, value) => {
        if (typeof value === "string") {
            const trimmed = value.trim();
            if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
                const linkText = (keyLabel && keyLabel.toLowerCase().includes("see more"))
                    ? "Open Link ➔"
                    : "See More ➔";
                return `<a href="${trimmed}" target="_blank" rel="noopener noreferrer" class="detail-link" title="${trimmed}">${linkText}</a>`;
            }
            const isBorelogLayer = layerInfo && (
                (layerInfo.datapoint_type && layerInfo.datapoint_type.trim().toLowerCase() === 'borelogs') ||
                (layerInfo.table && layerInfo.table.toLowerCase().includes('borelog')) ||
                (layerInfo.name && layerInfo.name.toLowerCase().includes('borelog'))
            );
            if (isBorelogLayer && trimmed.toLowerCase().endsWith('.json')) {
                return `<a href="javascript:void(0)" onclick="if(window.openBorelogVisualizer) { window.openBorelogVisualizer('${trimmed}') } else { alert('Visualizer not loaded.') }" style="color:#2563eb; font-weight:normal; text-decoration:underline; font-size:inherit;">[borelog]</a>`;
            }
        }
        return value;
    };

    if (displayKeys) {
        // Data-driven keys logic
        for (const pair of displayKeys) {
            const field = pair[0];
            const label = pair[1];
            const val = props[field];

            if (val === undefined || val === null || val === "") continue;

            const formattedVal = formatValue(label, val);

            const row = document.createElement("div");
            row.className = "detail-row";
            row.innerHTML = `<span class="detail-key">${label}</span><span class="detail-val">${formattedVal}</span>`;

            if (count < 3) tooltipDetails.appendChild(row);
            else otherPropsContainer.appendChild(row);
            count++;
        }
    } else {
        // Fallback logic for layers without 'keys'
        const skipKeys = [
            "id",
            "original_id",
            "fid",
            "objectid",
            "type",
            "name",
            "road_name",
            "river_name",
            "rhd_ref",
            "shape_leng",
            "shape_length",
            "shape_area",
            "st_area(shape)",
            "st_length(shape)",
            "class_lad",
            "re_class",
            "objectid_1",
            "objectid_12",
            "bridge_sif",
            "contour",
            "rmms_link",
            "keys",
            "f_class_name",
            "f_class_color",
            "f_class_weight",
        ];

        for (const [key, value] of Object.entries(props)) {
            if (
                skipKeys.includes(key.toLowerCase()) ||
                value === null ||
                value === undefined ||
                value === ""
            )
                continue;

            const label = key.replace(/_/g, " ");
            const formattedVal = formatValue(label, value);

            const row = document.createElement("div");
            row.className = "detail-row";
            row.innerHTML = `<span class="detail-key">${label}</span><span class="detail-val">${formattedVal}</span>`;

            if (count < 3) tooltipDetails.appendChild(row);
            else otherPropsContainer.appendChild(row);
            count++;
        }
    }

    // Add "See More" button if there are hidden properties
    if (otherPropsContainer.children.length > 0) {
        tooltipDetails.appendChild(otherPropsContainer);

        const seeMoreBtn = document.createElement("button");
        seeMoreBtn.className = "see-more-btn";
        seeMoreBtn.textContent = "See more ▼";
        seeMoreBtn.onclick = (e) => {
            e.stopPropagation();
            if (otherPropsContainer.style.display === "none") {
                otherPropsContainer.style.display = "flex";
                seeMoreBtn.textContent = "See less ▲";
            } else {
                otherPropsContainer.style.display = "none";
                seeMoreBtn.textContent = "See more ▼";
            }
        };
        tooltipDetails.appendChild(seeMoreBtn);
    }

    if (tooltipDetails.children.length === 0) {
        tooltipDetails.style.display = "none";
    } else {
        tooltipDetails.style.display = "flex";
    }
};

tooltip.addEventListener("mouseenter", () => {
    if (window.tooltipHideTimeout) clearTimeout(window.tooltipHideTimeout);
});
tooltip.addEventListener("mouseleave", () => {
    if (!window.featureTooltipLocked) {
        tooltip.classList.remove("visible");
    }
});
L.DomEvent.disableClickPropagation(tooltip);
L.DomEvent.disableScrollPropagation(tooltip);

window.featureTooltipLocked = false;
window.activeFeatureLayer = null;

map.on("click", (e) => {
    // Check if Target Mode is active for Level Estimator
    const targetBtn = document.getElementById("target-btn");
    if (targetBtn && targetBtn.classList.contains("active")) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);
        document.getElementById("coord-input").value = `${lat}, ${lng}`;

        targetBtn.classList.remove("active");
        document.getElementById("map").classList.remove("crosshair-cursor");
        document.getElementById("coord-btn").click(); // Auto-estimate!
        return;
    }

    if (
        e.originalEvent &&
        e.originalEvent.target &&
        e.originalEvent.target.closest("#tooltip")
    ) {
        return;
    }

    if (window.featureTooltipLocked) {
        window.featureTooltipLocked = false;
        tooltip.classList.remove("visible");
        if (window.activeFeatureLayer && window.activeFeatureLayer.resetStyleFunc) {
            window.activeFeatureLayer.resetStyleFunc();
        }
        window.activeFeatureLayer = null;
    }
});

map.on('move', () => {
    if (window.featureTooltipLocked && window.lockedLatLng) {
        // Calculate the map container offset to align with pageX/pageY
        const mapRect = document.getElementById("map").getBoundingClientRect();
        const pt = map.latLngToContainerPoint(window.lockedLatLng);
        tooltip.style.transform = `translate3d(${mapRect.left + pt.x + 15}px, ${mapRect.top + pt.y + 15}px, 0)`;
    }
});

// ============================================================================
// LAYER FETCHING AND RENDERING
// ============================================================================

async function fetchAndRenderLayers() {
    try {
        // Fix Race Condition: Wait for raster metadata before processing layers
        try {
            const rMetaRes = await fetch(`${API_BASE_URL.replace("/api", "")}/maps/raster_metadata.json`);
            if (rMetaRes.ok) {
                window.rasterMetadata = await rMetaRes.json();
            }
        } catch(e) {
            console.warn("No raster metadata:", e);
        }

        const response = await fetch(`${API_BASE_URL}/layers`);
        const layers = await response.json();
        window.allLayerConfigs = layers;

        // Build Tabs
        let uniqueTabs = [
            ...new Set(layers.map((l) => l.tab || "Uncategorized")),
        ];
        uniqueTabs.push("Control Tools");
        uniqueTabs.push("About Us");

        tabsContainerEl.innerHTML = "";
        tabContentAreaEl.innerHTML = "";

        const tabContentWrappers = {};

        uniqueTabs.forEach((tabName, idx) => {
            const slug = tabName.toLowerCase().replace(/[^a-z0-9]/g, "-");

            // Create tab button
            const tabBtn = document.createElement("div");
            tabBtn.className = `tab ${idx === 0 ? "active" : ""}`;
            tabBtn.textContent = tabName;
            tabBtn.dataset.target = `tab-content-${slug}`;
            tabsContainerEl.appendChild(tabBtn);

            // Create tab content container
            const tabContent = document.createElement("div");
            tabContent.id = `tab-content-${slug}`;
            tabContent.className = `tab-content ${idx === 0 ? "active" : ""}`;
            tabContentAreaEl.appendChild(tabContent);

            tabContentWrappers[tabName] = tabContent;
        });

        // Add tab slider
        const slider = document.createElement("div");
        slider.className = "tab-slider";
        tabsContainerEl.appendChild(slider);

        // Tab switching logic
        const updateSlider = (activeTab) => {
            if (window.innerWidth <= 767) {
                slider.style.height = "3px";
                slider.style.width = activeTab.offsetWidth + "px";
                slider.style.transform = `translateX(${activeTab.offsetLeft}px)`;
                slider.style.top = "auto";
                slider.style.bottom = "-1px";
                slider.style.right = "auto";
                slider.style.left = "0";
            } else {
                slider.style.width = "3px";
                slider.style.height = activeTab.offsetHeight + "px";
                slider.style.transform = `translateY(${activeTab.offsetTop}px)`;
                slider.style.top = "0";
                slider.style.bottom = "auto";
                slider.style.right = "-2px";
                slider.style.left = "auto";
            }
        };

        window.addEventListener('resize', () => {
            const activeTab = tabsContainerEl.querySelector(".tab.active");
            if (activeTab) updateSlider(activeTab);
        });

        tabsContainerEl.addEventListener("click", (e) => {
            if (e.target.classList.contains("tab")) {
                // Remove active from all tabs
                tabsContainerEl
                    .querySelectorAll(".tab")
                    .forEach((t) => t.classList.remove("active"));
                tabContentAreaEl
                    .querySelectorAll(".tab-content")
                    .forEach((c) => c.classList.remove("active"));

                // Add active to clicked
                e.target.classList.add("active");
                const targetId = e.target.dataset.target;
                document.getElementById(targetId).classList.add("active");
                
                if (targetId === "tab-content-about-us") {
                    tabContentAreaEl.classList.add("no-scrollbar");
                } else {
                    tabContentAreaEl.classList.remove("no-scrollbar");
                }

                updateSlider(e.target);
            }
        });

        // Initial slider positioning (wait for DOM to settle)
        setTimeout(() => {
            const activeTab = tabsContainerEl.querySelector(".tab.active");
            if (activeTab) {
                updateSlider(activeTab);
                if (activeTab.dataset.target === "tab-content-about-us") {
                    tabContentAreaEl.classList.add("no-scrollbar");
                }
            }
        }, 100);

        // Fetch About Us content
        if (tabContentWrappers["About Us"]) {
            fetch(`${API_BASE_URL}/about_us`)
                .then((res) => res.json())
                .then((data) => {
                    tabContentWrappers["About Us"].innerHTML =
                        `<div id="about-us-content">${marked.parse ? marked.parse(data.content, {breaks: true}) : data.content}</div>`;
                })
                .catch((err) => {
                    tabContentWrappers["About Us"].innerHTML =
                        `<div id="about-us-content">Could not load About Us.</div>`;
                });
        }

        
        if (tabContentWrappers["Control Tools"]) {
            tabContentWrappers["Control Tools"].innerHTML = `
                <div style="padding: 15px; font-family: var(--font-body-special);">
                    <h3 style="margin-top:0; color:#1e293b; font-size:14px;">Borelog Management</h3>
                    <p style="color:#475569; font-size:12px; margin:11px 0px 11px 0px;">Submit and review geotechnical borelog records.</p>
                    <button onclick="window.open('borelog-entry.html', '_blank')" class="management-btn submit-btn blue_button">
                        Submit Borelog
                    </button>
                    <button onclick="openApprovalLogin()" class="management-btn approve-btn orange_button">
                        Approve Borelogs
                    </button>
                    
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    
                    <h3 style="margin-top:0; color:#1e293b; font-size:14px;">Map Management</h3>
                    <p style="color:#475569; font-size:12px; margin:11px 0px 11px 0px;">Submit map layers and trigger server database builds.</p>
                    <button disabled="true" class="management-btn submit-btn blue_button">
                        Submit Feature
                    </button>
                    <button disabled="true" class="management-btn approve-btn orange_button">
                        Approve Features
                    </button>
                    <button onclick="openUpdateMapsLogin()" class="management-btn teal_button">
                        Update Maps
                    </button>
                </div>
            `;
        }

        for (let i = 0; i < layers.length; i++) {
            const layerInfo = layers[i];
            const color = engineeringColors[i % engineeringColors.length];

            const item = document.createElement("div");
            item.className = "layer-item";
            item.dataset.table = layerInfo.table;
            
            if (layerInfo.transparency !== null && layerInfo.transparency < 0) {
                item.style.display = "none";
                layerInfo.show_first = true; // force load
            }
            
            let isVisuallyActive = layerInfo.show_first !== false;
            let isLoaded = layerInfo.show_first !== false;
            
            if (isVisuallyActive) {
                item.classList.add("active");
            }

            const isBasemap = layerInfo.type && layerInfo.type.toLowerCase() === 'basemap';
            
            let creditBtnUI = "";
            if (layerInfo.credit_page && layerInfo.credit_page.trim() !== '' && !isBasemap) {
                creditBtnUI = `<div class="credit-btn" data-url="credits/${layerInfo.credit_page}" title="View Credits">Cr</div>`;
            }

            const checkboxId = `cb-${i}`;
            const isChecked = isLoaded ? 'checked' : '';
            const inputType = isBasemap ? 'radio' : 'checkbox';
            const inputName = isBasemap ? 'name="basemap-group"' : '';
            const classExtras = isBasemap ? 'basemap-radio layer-load-cb' : 'layer-load-cb';
            
            checkboxUI = `
                <label class="ios-checkbox">
                  <input id="${checkboxId}" class="${classExtras}" ${inputName} type="${inputType}" ${isChecked} />
                  <div class="checkbox-wrapper">
                    <div class="checkbox-bg"></div>
                    <svg fill="none" viewBox="0 0 24 24" class="checkbox-icon">
                      <path stroke-linejoin="round" stroke-linecap="round" stroke-width="4" stroke="currentColor" d="M4 12L10 18L20 6" class="check-path"></path>
                    </svg>
                  </div>
                </label>
            `;

            // Restore v6 layout structure
            item.innerHTML = `
                <div class="layer-info-container" style="display: flex; flex-direction: column; gap: 4px; flex: 1; margin-right: 12px; min-width: 0;">
                    <div class="layer-info" style="display: flex; align-items: center; gap: 10px;">
                        ${checkboxUI}
                        <div class="layer-color-ui" style="display:flex; align-items:center; flex-shrink:0;"><div style="width: 1em; height: 1em; border-radius: 50%; background: #cbd5e1;"></div></div>
                        <div class="sliding-name-container" style="flex: 1; overflow: hidden; white-space: nowrap; display: flex; align-items: center; min-width: 0; position: relative;">
                            <span class="layer-name sliding-name" style="display: inline-block; transition: transform 0.3s ease; overflow: visible; flex-shrink: 0;" title="${layerInfo.name}">${layerInfo.name}</span>
                        </div>
                        ${creditBtnUI}
                    </div>
                    <div class="sub-legend-ui" style="display: flex; gap: 6px; align-items: center; margin-left: 50px; width: calc(100% - 50px); font-size: 9px; color: var(--text-dim); font-weight: 600;"></div>
                </div>
                <div class="toggle-switch" style="flex-shrink: 0;"></div>
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
            const handleSlide = () => {
                const diff = nameEl.scrollWidth - container.clientWidth;
                if (diff > 0) {
                    nameEl.style.transition = `transform ${diff * 0.02}s linear`;
                    nameEl.style.transform = `translateX(-${diff + 5}px)`;
                }
            };
            const handleReset = () => {
                nameEl.style.transition = `transform 0.3s ease`;
                nameEl.style.transform = `translateX(0)`;
            };
            
            item.addEventListener('mouseenter', handleSlide);
            item.addEventListener('mouseleave', handleReset);
            item.addEventListener('touchstart', handleSlide, {passive: true});
            item.addEventListener('touchend', () => { setTimeout(handleReset, 1500); }, {passive: true});

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

                    if (layerInfo.type && layerInfo.type.toLowerCase() === "basemap") {
                        let attributionHtml = '';
                        if (layerInfo.credit_page) {
                            const match = layerInfo.credit_page.match(/^(.*?)\s*\[(.*?)\]$/);
                            if (match) {
                                attributionHtml = `&copy; <a href="${match[1].trim()}" target="_blank">${match[2].trim()}</a>`;
                            } else {
                                attributionHtml = layerInfo.credit_page;
                            }
                        }
                        
                        let maxZoom = 19;
                        if (layerInfo.zoom_level) {
                            maxZoom = parseInt(layerInfo.zoom_level, 10) || 19;
                        }
                        
                        geoLayer = L.tileLayer(layerInfo.filename, {
                            maxZoom: maxZoom,
                            attribution: attributionHtml,
                            pane: "tilePane"
                        });
                        
                        colorUI.innerHTML = `<div style="width: 1em; height: 1em; border-radius: 50%; background: #cbd5e1; flex-shrink:0;"></div>`;
                    } else if (layerInfo.type && layerInfo.type.toLowerCase() === "raster") {
                        const rMeta = window.rasterMetadata && window.rasterMetadata[layerInfo.filename];
                        
                        let rasterOpacity = 0.7;
                        if (layerInfo.transparency !== null) {
                            if (layerInfo.transparency < 0) {
                                rasterOpacity = 0;
                            } else {
                                rasterOpacity = (100 - layerInfo.transparency) / 100;
                            }
                        }
                        
                        if (rMeta) {
                            const imageUrl = API_BASE_URL.replace("/api", "") + rMeta.png_url + "?v=" + new Date().getTime();
                            geoLayer = L.imageOverlay(imageUrl, rMeta.bounds, {
                                opacity: rasterOpacity,
                                pane: paneName
                            });
                            
                            // Because raster images don't download until added to the map, 
                            // we must manage the spinner independently via Leaflet events
                            geoLayer.on('add', () => { toggleSwitch.classList.add('loading'); });
                            geoLayer.on('load', () => { toggleSwitch.classList.remove('loading'); });
                            geoLayer.on('error', () => { 
                                toggleSwitch.classList.remove('loading');
                                console.error("Raster failed to load:", imageUrl);
                            });
                            
                        } else {
                            console.warn("No metadata found for raster:", layerInfo.filename);
                            geoLayer = L.imageOverlay("", [[0,0],[0,0]], { opacity: 0 }); // dummy
                        }

                        if (layerInfo.color_map && layerInfo.color_map.length > 0) {
                            const classEntries = layerInfo.color_map.map(cm => [cm.label, cm.color]);
                            let gradientParts = [];
                            let pct = 100 / classEntries.length;
                            for (let i = 0; i < classEntries.length; i++) {
                                let c = classEntries[i][1];
                                gradientParts.push(`${c} ${i*pct}% ${(i+1)*pct}%`);
                            }
                            let bg = `conic-gradient(${gradientParts.join(', ')})`;
                            colorUI.innerHTML = `<div style="width: 1em; height: 1em; border-radius: 50%; background: ${bg}; flex-shrink:0;"></div>`;
                            subLegendUI.innerHTML = "";
                            const renderLegends = () => {
                                const containerWidth = subLegendUI.clientWidth || 200;
                                let available = containerWidth - 26; // for +X button
                                let subHTML = `<div style="display: flex; gap: 8px; overflow: hidden; white-space: nowrap; flex: 1;">`;
                                let count = 0;
                                let rendered = 0;
                                for (const [cName, cColor] of classEntries) {
                                    let estWidth = 12 + (cName.length * 5.5);
                                    if (estWidth > 95) estWidth = 95;
                                    
                                    if (available - estWidth >= 0) {
                                        subHTML += `<span style="display: flex; align-items: center; gap: 3px; flex-shrink: 0;" title="${cName}"><div style="width: 6px; height: 6px; border-radius: 50%; background: ${cColor}; flex-shrink: 0;"></div><span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80px;">${cName}</span></span>`;
                                        available -= (estWidth + 8);
                                        rendered++;
                                    } else {
                                        break;
                                    }
                                    count++;
                                }
                                subHTML += `</div>`;
                                
                                const remaining = classEntries.length - rendered;
                                if (remaining > 0) {
                                    subHTML += `<div class="legend-more-btn" title="See all classes" style="flex-shrink: 0; width: 24px; height: 18px; border-radius: 10px; background: #e2e8f0; color: var(--text-dim); font-size: 10px; font-weight: bold; display: flex; align-items: center; justify-content: center; cursor: pointer;">+${remaining}</div>`;
                                }
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
                            };
                            
                            setTimeout(renderLegends, 50);
                            
                            const ro = new ResizeObserver(() => {
                                if (subLegendUI.clientWidth > 0 && Math.abs(subLegendUI.clientWidth - (subLegendUI._lastWidth || 0)) > 10) {
                                    subLegendUI._lastWidth = subLegendUI.clientWidth;
                                    renderLegends();
                                }
                            });
                            ro.observe(subLegendUI);
                        } else {
                            colorUI.innerHTML = `<div style="width: 1em; height: 1em; border-radius: 50%; background: #9aa5b1; flex-shrink:0;"></div>`;
                        }
                    } else {
                        const layerDataRes = await fetch(`${API_BASE_URL}/layers/${layerInfo.table}`);
                        const data = await layerDataRes.json();
                        
                        const classMap = new Map();
                        if (data.features) {
                            for (const feat of data.features) {
                                if (feat.properties && feat.properties.f_class_name) {
                                    let clr = feat.properties.color || feat.properties.f_class_color || '#9aa5b1';
                                    if (clr && !clr.startsWith('#')) clr = '#' + clr;
                                    classMap.set(feat.properties.f_class_name, clr);
                                }
                            }
                        }
                        const hasClasses = classMap.size > 0;
                        if (hasClasses) {
                            const classEntries = Array.from(classMap.entries());
                            let gradientParts = [];
                            let pct = 100 / classEntries.length;
                            for (let i = 0; i < classEntries.length; i++) {
                                let c = classEntries[i][1];
                                gradientParts.push(`${c} ${i*pct}% ${(i+1)*pct}%`);
                            }
                            let bg = `conic-gradient(${gradientParts.join(', ')})`;
                            colorUI.innerHTML = `<div style="width: 1em; height: 1em; border-radius: 50%; background: ${bg}; flex-shrink:0;"></div>`;
                            subLegendUI.innerHTML = "";
                            const renderLegends = () => {
                                const containerWidth = subLegendUI.clientWidth || 200;
                                let available = containerWidth - 26; // for +X button
                                let subHTML = `<div style="display: flex; gap: 8px; overflow: hidden; white-space: nowrap; flex: 1;">`;
                                let count = 0;
                                let rendered = 0;
                                for (const [cName, cColor] of classEntries) {
                                    // Estimate width: 12px for dot/gap + ~5.5px per char
                                    let estWidth = 12 + (cName.length * 5.5);
                                    if (estWidth > 95) estWidth = 95; // max-width is 80px + 15px
                                    
                                    if (available - estWidth >= 0) {
                                        subHTML += `<span style="display: flex; align-items: center; gap: 3px; flex-shrink: 0;" title="${cName}"><div style="width: 6px; height: 6px; border-radius: 50%; background: ${cColor}; flex-shrink: 0;"></div><span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80px;">${cName}</span></span>`;
                                        available -= (estWidth + 8); // gap
                                        rendered++;
                                    } else {
                                        break;
                                    }
                                    count++;
                                }
                                subHTML += `</div>`;
                                
                                const remaining = classEntries.length - rendered;
                                if (remaining > 0) {
                                    subHTML += `<div class="legend-more-btn" title="See all classes" style="flex-shrink: 0; width: 24px; height: 18px; border-radius: 10px; background: #e2e8f0; color: var(--text-dim); font-size: 10px; font-weight: bold; display: flex; align-items: center; justify-content: center; cursor: pointer;">+${remaining}</div>`;
                                }
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
                            };
                            
                            // Initial render (might have 0 clientWidth if display is none, so setTimeout)
                            setTimeout(renderLegends, 50);
                            
                            // Re-render on resize
                            const ro = new ResizeObserver(() => {
                                // Only re-render if width changed significantly to avoid infinite loops
                                if (subLegendUI.clientWidth > 0 && Math.abs(subLegendUI.clientWidth - (subLegendUI._lastWidth || 0)) > 10) {
                                    subLegendUI._lastWidth = subLegendUI.clientWidth;
                                    renderLegends();
                                }
                            });
                            ro.observe(subLegendUI);
                            
                            // Cleanup observer when item is removed or unchecked
                            item._ro = ro;
                        } else {
                            let singleColor = color;
                            if (data.features && data.features.length > 0) {
                                const fp = data.features[0].properties;
                                if (fp) {
                                    let clr = fp.color || fp.f_class_color;
                                    if (clr) {
                                        if (!clr.startsWith('#') && !clr.startsWith('rgb')) clr = '#' + clr;
                                        singleColor = clr;
                                    }
                                }
                            }
                            colorUI.innerHTML = `<div style="width: 1em; height: 1em; border-radius: 50%; background: ${singleColor}; flex-shrink:0;"></div>`;
                        }

                        geoLayer = L.geoJSON(data, {
                            pane: paneName,
                            pointToLayer: (feature, latlng) => {
                                return L.circleMarker(latlng, getFeatureStyle(feature, color, layerInfo.transparency));
                            },
                            filter: function (feature) {
                                const name = (feature.properties.name || feature.properties.river_name || feature.properties.locality || "").toLowerCase();
                                if (name.includes("bay of bengal")) return false;
                                return true;
                            },
                            style: (feature) => getFeatureStyle(feature, color, layerInfo.transparency),
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
                                                let regex = /\[([^,]+),\s*([^\]]+)\]/g;
                                                let match;
                                                while ((match = regex.exec(keysStr)) !== null) {
                                                    parsedKeys.push([match[1].trim(), match[2].trim()]);
                                                }
                                            } else {
                                                parsedKeys = keysStr;
                                            }
                                        } catch (err) {}
                                        if (parsedKeys && parsedKeys.length > 0) {
                                            let hasNameInKeys = false;
                                            for (let i = 0; i < parsedKeys.length; i++) {
                                                const fieldName = parsedKeys[i][0].toLowerCase();
                                                if (["name", "title", "road_name", "river_name", "locality"].includes(fieldName)) {
                                                    hasNameInKeys = true;
                                                    break;
                                                }
                                            }

                                            if (hasNameInKeys) {
                                                let hVal = props[parsedKeys[0][0]];
                                                headerValue = hVal !== undefined && hVal !== null && hVal !== "" ? hVal : " ";
                                                displayKeys = parsedKeys.slice(1);
                                            } else if (props.Name || props.name || props.road_name || props.river_name || props.locality) {
                                                headerValue = props.Name || props.name || props.road_name || props.river_name || props.locality;
                                                displayKeys = parsedKeys;
                                            } else {
                                                let hVal = props[parsedKeys[0][0]];
                                                headerValue = hVal !== undefined && hVal !== null && hVal !== "" ? hVal : " ";
                                                displayKeys = parsedKeys.slice(1);
                                            }
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
                                    renderTooltipProps(props, displayKeys, layerInfo);
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
                                        layer.setStyle(getHighlightStyle(feature, color, layerInfo.transparency));
                                        layer.bringToFront();
                                        populateTooltip(e);
                                        const tooltip = document.getElementById("tooltip");
                                        if(tooltip) tooltip.style.transform = `translate3d(${e.originalEvent.pageX + 15}px, ${e.originalEvent.pageY + 15}px, 0)`;
                                    },
                                    mouseover: (e) => {
                                        if (window.featureTooltipLocked) return;
                                        if (window.tooltipHideTimeout) clearTimeout(window.tooltipHideTimeout);
                                        layer.setStyle(getHighlightStyle(feature, color, layerInfo.transparency));
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

            if (isBasemap) {
                loadCb.addEventListener('change', async (e) => {
                    console.log("Basemap radio changed for:", layerInfo.name, "checked:", loadCb.checked);
                    if (loadCb.checked) {
                        if (window.activeBasemapLayer && window.activeBasemapLayer !== geoLayer) {
                            console.log("Removing previous basemap");
                            map.removeLayer(window.activeBasemapLayer);
                        }
                        if (window.activeBasemapItem && window.activeBasemapItem !== item) {
                            window.activeBasemapItem.classList.remove('active');
                        }
                        
                        if (!geoLayer) {
                            console.log("Loading basemap data...");
                            await loadLayerData();
                        }
                        
                        if (geoLayer) {
                            console.log("Adding new basemap to map");
                            geoLayer.addTo(map);
                            geoLayer.bringToBack();
                            item.classList.add('active');
                            window.activeBasemapLayer = geoLayer;
                            window.activeBasemapItem = item;
                        }
                        isVisuallyActive = true;
                    }
                });
                
                item.addEventListener("click", () => {
                    if (!loadCb.checked) {
                        loadCb.checked = true;
                        loadCb.dispatchEvent(new Event('change'));
                    }
                });
                
                if (isLoaded) {
                    loadLayerData().then(() => {
                        if (isVisuallyActive && geoLayer) {
                            if (!window.activeBasemapLayer) {
                                geoLayer.addTo(map);
                                geoLayer.bringToBack();
                                window.activeBasemapLayer = geoLayer;
                                window.activeBasemapItem = item;
                            } else {
                                loadCb.checked = false;
                                item.classList.remove('active');
                                isVisuallyActive = false;
                            }
                        }
                    });
                }
            } else {
                loadCb.addEventListener('click', async (e) => {
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
                        colorUI.innerHTML = `<div style="width: 1em; height: 1em; border-radius: 50%; background: #cbd5e1; flex-shrink:0;"></div>`;
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
            }
        }
    } catch (error) {
        console.error("Error fetching layers data:", error);
        if (typeof tabContentAreaEl !== 'undefined' && tabContentAreaEl) {
            tabContentAreaEl.innerHTML = `<div class="loading-state" style="color: #ef4444; padding: 20px; font-family: sans-serif;">
                <b>Critical Error:</b> Cannot connect to the Backend API (localhost:8484).<br><br>
                It looks like the FastAPI server failed to start or crashed. Please check your terminal logs for errors in uvicorn or backend.main.
            </div>`;
        }
    }
}

fetchAndRenderLayers();

// ============================================================================
// COORDINATE LOOKUP TOOL
// ============================================================================

let currentMarker = null;
window.closeEstimatorMarker = () => {
    if (currentMarker) {
        map.removeLayer(currentMarker);
        currentMarker = null;
    }
};

function parseDMS(input) {
    const parts = input.split(",");
    if (parts.length !== 2) return null;

    function parsePart(str) {
        str = str.trim();
        if (/^-?\d+(\.\d+)?$/.test(str)) return parseFloat(str);

        let clean = str
            .replace(/\\degree/g, " ")
            .replace(/d/g, " ")
            .replace(/m/g, " ")
            .replace(/s/g, " ")
            .replace(/deg/g, " ")
            .replace(/min/g, " ")
            .replace(/sec/g, " ")
            .replace(/°/g, " ")
            .replace(/''/g, " ")
            .replace(/'/g, " ")
            .replace(/"/g, " ");

        let nums = clean.trim().split(/\s+/).map(Number);
        if (nums.length === 0 || nums.some(isNaN)) return NaN;

        let d = nums[0] || 0;
        let m = nums[1] || 0;
        let s = nums[2] || 0;
        let sign = d < 0 ? -1 : 1;

        return sign * (Math.abs(d) + m / 60 + s / 3600);
    }

    const lat = parsePart(parts[0]);
    const lng = parsePart(parts[1]);

    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat, lng };
}

document.getElementById("coord-btn").addEventListener("click", async () => {
    const rawInput = document.getElementById("coord-input").value;
    const coords = parseDMS(rawInput);

    if (!coords) {
        alert(
            "Please enter a valid coordinate (e.g. '23.66, 91.06' or '23 45 33, 91 07 45' or '23d 45m 33s, 91d 07m 45s')",
        );
        return;
    }

    const { lat, lng } = coords;

    if (currentMarker) map.removeLayer(currentMarker);

    const customIcon = L.icon({
        iconUrl: "resources/images/placemarker.svg",
        iconSize: [78, 78],
        iconAnchor: [39, 78],
        tooltipAnchor: [0, -78],
        popupAnchor: [0, -78],
    });

    currentMarker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
    map.setView([lat, lng], 13);

    try {
        let activeTables = Array.from(document.querySelectorAll('.layer-load-cb:checked'))
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
        
        activeTables = activeTables.join(',');
        const res = await fetch(
            `${API_BASE_URL}/estimate_water_levels?lat=${lat}&lng=${lng}&active_tables=${activeTables}`,
        );
        const data = await res.json();

        let allRows = [];
        
        if (data.estimates) {
            for (const [label, val] of Object.entries(data.estimates)) {
                let text = "N/A";
                if (val !== null && typeof val === "object" && val.value !== undefined) {
                    text = val.value !== null ? `${Number(val.value).toFixed(2)} ${val.unit}`.trim() : "N/A";
                } else if (val !== null && typeof val === "number") {
                    text = val.toFixed(2);
                } else if (val !== null) {
                    text = val;
                }
                allRows.push(`<div class="est-row"><div class="est-key">${label}:</div><div class="est-val">${text}</div></div>`);
            }
        }

        if (data.nearby) {
            for (const [layerName, features] of Object.entries(data.nearby)) {
                allRows.push(`<div class="est-row"><div class="est-key">${layerName}:</div><div class="est-val text-val">${features}</div></div>`);
            }
        }

        const visibleRows = allRows.slice(0, 3).join("");
        const hiddenRows = allRows.slice(3).join("");
        
        let seeMoreHTML = "";
        if (hiddenRows.length > 0) {
            seeMoreHTML = `
                <div class="est-hidden-rows">${hiddenRows}</div>
                <button class="see-more-btn" onclick="this.previousElementSibling.classList.toggle('show'); this.textContent = this.textContent === 'See more ▼' ? 'See less ▲' : 'See more ▼';">See more ▼</button>
            `;
        }

        const popupContent = `
        <div class="est-header" style="display: flex; justify-content: space-between; align-items: center;">
            <span>Point Data Estimator</span>
            <img class="est-close-btn" src="resources/images/cross-nrm.svg" alt="Close" title="Close Marker" style="cursor: pointer; transition: content 0.2s; height: 1.07em;" onmouseover="this.src='resources/images/cross-cls.svg';" onmouseout="this.src='resources/images/cross-nrm.svg';" onclick="window.closeEstimatorMarker();">
        </div>
        ${visibleRows}
        ${seeMoreHTML}
        `;

        currentMarker
            .bindPopup(popupContent, {
                className: "custom-estimator-popup",
                closeButton: false,
                offset: [0, 10]
            })
            .openPopup();
    } catch (err) {
        console.error("Estimation failed:", err);
        currentMarker.bindPopup("Error calculating estimation.", { closeButton: false }).openPopup();
    }
});

// Target Mode Logic
const targetBtn = document.getElementById("target-btn");
if (targetBtn) {
    targetBtn.addEventListener("click", () => {
        const isActive = targetBtn.classList.contains("active");
        if (!isActive) {
            targetBtn.classList.add("active");
            document.getElementById("map").classList.add("crosshair-cursor");
        } else {
            targetBtn.classList.remove("active");
            document.getElementById("map").classList.remove("crosshair-cursor");
        }
    });
}

// Hover scrolling for tabs
let tabScrollInterval;
tabsContainerEl.addEventListener("mousemove", (e) => {
    const rect = tabsContainerEl.getBoundingClientRect();
    const hoverY = e.clientY - rect.top;

    clearInterval(tabScrollInterval);
    if (hoverY < 20) {
        tabScrollInterval = setInterval(() => {
            tabsContainerEl.scrollTop -= 2;
        }, 16);
    } else if (hoverY > rect.height - 20) {
        tabScrollInterval = setInterval(() => {
            tabsContainerEl.scrollTop += 2;
        }, 16);
    }
});
tabsContainerEl.addEventListener("mouseleave", () => {
    clearInterval(tabScrollInterval);
});

// Modal close handlers
const iframeModal = document.getElementById('iframe-modal');
const iframeClose = document.getElementById('iframe-modal-close');
const iframeBackdrop = document.getElementById('iframe-modal-backdrop');



if (iframeModal) {
    const closeModal = () => {
        iframeModal.classList.add('hidden');
        document.getElementById('iframe-modal-frame').src = '';
    };
    iframeClose.addEventListener('click', closeModal);
    iframeBackdrop.addEventListener('click', closeModal);

    // Mount the borelog React root in this modal instead of the separate modal.
    // const borelogModalHeaderClose = document.getElementById('close-btn-container');
    // if (borelogModalHeaderClose) {
    //     const iframeFrame = document.getElementById('iframe-modal-frame');
    //     if (iframeFrame) iframeFrame.insertAdjacentElement('afterend', borelogModalHeaderClose);
    //     else iframeModal.appendChild(borelogModalHeaderClose);
    // }
}




window.openBorelogVisualizer = async (f_file) => {
    document.getElementById('borelog-modal').classList.remove('hidden');
    const modalContent = document.querySelector('#borelog-modal .approval-modal-content');
    // if (modalContent) modalContent.style.overflowY = 'hidden';
    const closeBtnOuter = document.querySelector('#borelog-modal .absolute-close-btn');
    if (closeBtnOuter) closeBtnOuter.style.display = 'none';
    
    const rootNode = document.getElementById('borelog-react-root');
    rootNode.innerHTML = "<div style='padding: 20px;'>Loading borelog data...</div>";
    
    try {
        const res = await fetch(`${API_BASE_URL.replace("/api", "")}/borelogs/${f_file}`);
        if (!res.ok) throw new Error("Could not fetch " + f_file);
        const data = await res.json();
        const uid = f_file.replace(/\.json$/i, "");
        
        rootNode.innerHTML = document.getElementById("visualizer-template").innerHTML;
        
        document.getElementById("export-xlsx-btn").onclick = () => {
            if (window.exportBorelogToXLSX) window.exportBorelogToXLSX(data, uid);
            else alert("Export engine not loaded.");
        };
        
        document.getElementById("export-graphic-btn").onclick = () => {
            if (window.downloadBorelogSVG) {
                window.downloadBorelogSVG(data, uid);
            } else {
                alert("SVG exporter not loaded.");
            }
        };
        
        if (window.renderBorelogChart) {
            window.renderBorelogChart("borelog-visualizer-container", data);
        } else {
            document.getElementById("borelog-visualizer-container").innerHTML = "<p style='color:red;'>Chart renderer not loaded.</p>";
        }
        
    } catch (e) {
        console.error(e);
        rootNode.innerHTML = "<p style='color:red;'>Error loading borelog data.</p>";
    }
};

window.adminCredentials = null;

window.openApprovalLogin = () => {
    document.getElementById('borelog-modal').classList.remove('hidden');
    const modalContent = document.querySelector('#borelog-modal .approval-modal-content');
    if (modalContent) modalContent.style.overflowY = 'auto';
    const closeBtnOuter = document.querySelector('#borelog-modal .absolute-close-btn');
    if (closeBtnOuter) closeBtnOuter.style.display = 'flex';
    
    const rootNode = document.getElementById('borelog-react-root');
    rootNode.innerHTML = `
        <div style="max-width: 380px; margin: 60px auto; font-family: 'Outfit', sans-serif; background: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.05); border: 1px solid #eaeaea;">
            <h2 style="margin: 0; color: #111; font-size: 32px; font-weight: 700;">Webmaster Login</h2>
            <p style="margin: 5px 0 35px 0; color: #555; font-size: 16px; font-family: 'SmartGothic', sans-serif;">to access the approval system</p>
            
            <div style="margin-bottom: 20px;">
                <input type="text" id="admin-user" placeholder="Username" style="width: 100%; box-sizing: border-box; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 15px; font-family: 'SmartGothic', sans-serif; outline: none; transition: border 0.2s;" onfocus="this.style.borderColor='#001ecc'" onblur="this.style.borderColor='#e2e8f0'">
            </div>
            <div style="margin-bottom: 30px;">
                <input type="password" id="admin-pass" placeholder="Password" style="width: 100%; box-sizing: border-box; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 15px; font-family: 'SmartGothic', sans-serif; outline: none; transition: border 0.2s;" onfocus="this.style.borderColor='#001ecc'" onblur="this.style.borderColor='#e2e8f0'">
            </div>
            
            <button id="admin-login-btn" style="width: 100%; padding: 16px; background: #001ecc; color: #ffffff; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; font-family: 'Outfit', sans-serif; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#0019a8'" onmouseout="this.style.background='#001ecc'">Continue</button>
            
            <p id="admin-error" style="color: #ef4444; margin-top: 15px; text-align: center; font-family: 'SmartGothic', sans-serif; font-size: 14px;"></p>
        </div>
    `;
    
    document.getElementById('admin-login-btn').onclick = async () => {
        const u = document.getElementById('admin-user').value;
        const p = document.getElementById('admin-pass').value;
        const hash = btoa(u + ":" + p);
        try {
            const res = await fetch(`${API_BASE_URL}/borelog/auth`, { headers: { 'Authorization': 'Basic ' + hash } });
            if (res.ok) {
                window.adminCredentials = hash;
                renderAdminDashboard();
            } else {
                document.getElementById('admin-error').innerText = "Invalid credentials.";
            }
        } catch (e) {
            document.getElementById('admin-error').innerText = "Network error.";
        }
    };
};

window.renderAdminDashboard = async () => {
    const rootNode = document.getElementById('borelog-react-root');
    rootNode.innerHTML = "<div style='padding:20px;'>Loading staged borelogs...</div>";
    try {
        const res = await fetch(`${API_BASE_URL}/borelog/staged_list`, { headers: { 'Authorization': 'Basic ' + window.adminCredentials } });
        if (!res.ok) throw new Error("Failed to fetch list");
        const data = await res.json();
        const files = data.files;
        
        if (files.length === 0) {
            rootNode.innerHTML = `
                <div style="padding: 60px 20px; text-align: center; font-family: 'Inter', sans-serif;">
                    <div style="width: 64px; height: 64px; border-radius: 50%; background: #fdfbf7; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px auto; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2d5e7c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                    <h3 style="font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 700; color: #0d2838; margin: 0 0 12px 0; letter-spacing: -0.5px;">All Caught Up</h3>
                    <p style="color: #69707a; font-size: 15px; max-width: 400px; margin: 0 auto; line-height: 1.5;">There are currently no borelogs awaiting your authorization. You can close this panel and return to the map.</p>
                </div>
            `;
            return;
        }
        
        /* background: rgba(144, 205, 244, 0.15); */
        let html = `
            <div style="padding: 10px 20px; font-family: 'Inter', sans-serif; color: #313845;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; border-bottom: 2px solid #fdfbf7; padding-bottom: 16px;">
                    <div>
                        <h2 style="font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 700; color: #0d2838; margin: 0 0 8px 0; letter-spacing: -0.5px;">Pending Approvals</h2>
                        <p style="margin: 0; color: #69707a; font-size: 14px;">Review and authorize submitted geotechnical borelog records.</p>
                    </div>
                    <div style="color: #078915; padding: 6px 12px; border-radius: 0px; font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; border: 1px solid rgba(0, 0, 0, 0.57);">
                        ${files.length} AWAITING
                    </div>
                </div>
                
                <div class="approval-table-container" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow-x: auto; -webkit-overflow-scrolling: touch; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);">
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="background: #f1fffe; border-bottom: 1px solid #e2e8f0;">
                                <th style="padding: 16px 24px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #69707a; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Borelog ID</th>
                                <th style="padding: 16px 24px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #69707a; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Project</th>
                                <th style="padding: 16px 24px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #69707a; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">File Reference</th>
                                <th style="padding: 16px 24px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #69707a; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; text-align: right;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        files.forEach((f, i) => {
            const bg = i % 2 === 0 ? '#ffffff' : '#fafafa';
            html += `
                <tr style="background: ${bg}; border-bottom: 1px solid #f1f5f9; transition: background 0.2s;" onmouseover="this.style.backgroundColor='#f1f5f9'" onmouseout="this.style.backgroundColor='${bg}'">
                    <td style="padding: 16px 24px; font-weight: 600; color: #0d2838; font-size: 15px;">
                        ${f.properties.borelog_id || 'N/A'}
                        <div style="margin-top: 8px; display: flex; gap: 8px;">
                            <button onclick="adminAction('${f.f_file}', 'reject')" style="padding: 6px 12px; background: transparent; color: #ef4444; border: 1px solid #fca5a5; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.backgroundColor='#fef2f2'; this.style.borderColor='#ef4444'" onmouseout="this.style.backgroundColor='transparent'; this.style.borderColor='#fca5a5'">Reject</button>
                            <button onclick="adminAction('${f.f_file}', 'approve')" style="padding: 6px 12px; background: #0d2838; color: white; border: none; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.1);" onmouseover="this.style.backgroundColor='#2d5e7c'" onmouseout="this.style.backgroundColor='#0d2838'">Approve</button>
                        </div>
                    </td>
                    <td style="padding: 16px 24px; color: #475569; font-size: 14px;">
                        ${f.properties.project || 'N/A'}
                    </td>
                    <td style="padding: 16px 24px; font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #69707a;">
                        ${f.f_file}
                    </td>
                    <td style="padding: 16px 24px; text-align: right;">
                        <div style="display: inline-flex; gap: 8px;">
                            <button onclick="window.open('/maps/borelogs/staged/${f.f_file}', '_blank')" style="padding: 8px 16px; background: #f8fafc; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 0px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.backgroundColor='#e2e8f0'" onmouseout="this.style.backgroundColor='#f8fafc'">JSON</button>
                            <button onclick="window.open('borelog-entry.html?view_staged=${f.f_file}', '_blank')" style="padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 0px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.1);" onmouseover="this.style.backgroundColor='#1d4ed8'" onmouseout="this.style.backgroundColor='#2563eb'">View</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        rootNode.innerHTML = html;
        
    } catch(e) {
        rootNode.innerHTML = "<div style='padding:20px; color:red;'>Error loading dashboard.</div>";
    }
};

window.adminAction = async (f_file, action) => {
    if (!confirm(`Are you sure you want to ${action} ${f_file}?`)) return;
    try {
        const res = await fetch(`${API_BASE_URL}/borelog/${action}/${f_file}`, {
            method: 'POST',
            headers: { 'Authorization': 'Basic ' + window.adminCredentials }
        });
        if (res.ok) {
            alert(`Successfully ${action}d ${f_file}`);
            renderAdminDashboard(); // refresh
        } else {
            alert(`Failed to ${action} ${f_file}`);
        }
    } catch(e) {
        alert("Network error.");
    }
};

window.updateAllMaps = async () => {
    const btn = document.getElementById("update-maps-btn");
    if (btn) {
        btn.disabled = true;
        btn.textContent = "Updating...";
    }
    
    try {
        const res = await fetch(`${API_BASE_URL}/maps/update`, {
            method: 'POST',
            headers: { 'Authorization': 'Basic ' + window.adminCredentials }
        });
        if (res.ok) {
            alert("Map update has been started in the background. It may take a few moments to finish processing.");
        } else {
            alert("Failed to start map update. Check server logs.");
        }
    } catch(e) {
        alert("Network error while trying to update maps.");
    }
    
    if (btn) {
        btn.disabled = false;
        btn.textContent = "Update All Maps";
    }
};

window.openUpdateMapsLogin = () => {
    document.getElementById('borelog-modal').classList.remove('hidden');
    const modalContent = document.querySelector('#borelog-modal .approval-modal-content');
    if (modalContent) modalContent.style.overflowY = 'auto';
    const closeBtnOuter = document.querySelector('#borelog-modal .absolute-close-btn');
    if (closeBtnOuter) closeBtnOuter.style.display = 'flex';
    const rootNode = document.getElementById('borelog-react-root');
    rootNode.innerHTML = `
        <div style="max-width: 380px; margin: 60px auto; font-family: 'Outfit', sans-serif; background: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.05); border: 1px solid #eaeaea;">
            <h2 style="margin: 0; color: #111; font-size: 32px; font-weight: 700;">Webmaster Login</h2>
            <p style="margin: 5px 0 35px 0; color: #555; font-size: 16px; font-family: 'SmartGothic', sans-serif;">to update static maps</p>
            
            <div style="margin-bottom: 20px;">
                <input type="text" id="admin-user-map" placeholder="Username" style="width: 100%; box-sizing: border-box; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 15px; font-family: 'SmartGothic', sans-serif; outline: none; transition: border 0.2s;" onfocus="this.style.borderColor='#001ecc'" onblur="this.style.borderColor='#e2e8f0'">
            </div>
            <div style="margin-bottom: 30px;">
                <input type="password" id="admin-pass-map" placeholder="Password" style="width: 100%; box-sizing: border-box; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 15px; font-family: 'SmartGothic', sans-serif; outline: none; transition: border 0.2s;" onfocus="this.style.borderColor='#001ecc'" onblur="this.style.borderColor='#e2e8f0'">
            </div>
            
            <button id="admin-login-btn-map" style="width: 100%; padding: 16px; background: #001ecc; color: #ffffff; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; font-family: 'Outfit', sans-serif; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#0019a8'" onmouseout="this.style.background='#001ecc'">Continue</button>
            
            <p id="admin-error-map" style="color: #ef4444; margin-top: 15px; text-align: center; font-family: 'SmartGothic', sans-serif; font-size: 14px;"></p>
        </div>
    `;
    
    document.getElementById('admin-login-btn-map').onclick = async () => {
        const u = document.getElementById('admin-user-map').value;
        const p = document.getElementById('admin-pass-map').value;
        const hash = btoa(u + ":" + p);
        try {
            const res = await fetch(`${API_BASE_URL}/borelog/auth`, { headers: { 'Authorization': 'Basic ' + hash } });
            if (res.ok) {
                window.adminCredentials = hash;
                openUpdateMapsLogWindow();
            } else {
                document.getElementById('admin-error-map').innerText = "Invalid credentials.";
            }
        } catch (e) {
            document.getElementById('admin-error-map').innerText = "Network error.";
        }
    };
};

window.openUpdateMapsLogWindow = async () => {
    const rootNode = document.getElementById('borelog-react-root');
    rootNode.innerHTML = `
        <div style="max-width: 800px; margin: 40px auto; background: #0f172a; padding: 20px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid #334155; padding-bottom: 12px;">
                <h2 style="margin: 0; color: #f8fafc; font-size: 18px; font-family: 'JetBrains Mono', monospace;">import_local_maps.py Logs</h2>
                <div id="update-status" style="color: #38bdf8; font-size: 14px; font-weight: bold; font-family: 'JetBrains Mono', monospace;">Running...</div>
            </div>
            <pre id="update-logs-container" style="background: #020617; color: #a5b4fc; padding: 16px; border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 13px; height: 400px; overflow-y: auto; white-space: pre-wrap; margin: 0;"></pre>
            <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
                <button id="close-logs-btn" style="padding: 10px 20px; background: #334155; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: not-allowed; opacity: 0.5; font-family: 'Outfit', sans-serif;">Close</button>
            </div>
        </div>
    `;

    const logsContainer = document.getElementById('update-logs-container');
    const closeBtn = document.getElementById('close-logs-btn');
    const statusText = document.getElementById('update-status');

    closeBtn.onclick = () => {
        if (!closeBtn.disabled) {
            document.getElementById('borelog-modal').classList.add('hidden');
        }
    };
    closeBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/maps/update`, {
            method: 'POST',
            headers: { 'Authorization': 'Basic ' + window.adminCredentials }
        });

        if (!response.ok) {
            logsContainer.textContent += "\\nError: HTTP " + response.status;
            statusText.textContent = "Failed";
            statusText.style.color = "#ef4444";
        } else {
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                logsContainer.textContent += chunk;
                logsContainer.scrollTop = logsContainer.scrollHeight;
            }
            statusText.textContent = "Completed";
            statusText.style.color = "#10b981";
        }
    } catch (e) {
        logsContainer.textContent += "\\n\\nNetwork error: " + e.message;
        statusText.textContent = "Error";
        statusText.style.color = "#ef4444";
    }

    closeBtn.disabled = false;
    closeBtn.style.cursor = "pointer";
    closeBtn.style.opacity = "1";
    closeBtn.style.background = "#2563eb";
    closeBtn.onmouseover = () => closeBtn.style.background = "#1d4ed8";
    closeBtn.onmouseout = () => closeBtn.style.background = "#2563eb";
};




