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

const map = L.map("map", {
    zoomControl: false,
    attributionControl: false,
}).setView([23.685, 90.3563], 7);

L.control.zoom({ position: "bottomright" }).addTo(map);

L.control
    .attribution({ position: "bottomleft" })
    .addAttribution(
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    )
    .addTo(map);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
    },
).addTo(map);

// ============================================================================
// UI ELEMENT REFERENCES
// ============================================================================

window.allLayerConfigs = [];
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

const renderTooltipProps = (props, displayKeys) => {
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
                    ? "Open Link ↗"
                    : "See More ↗";
                return `<a href="${trimmed}" target="_blank" rel="noopener noreferrer" class="detail-link" title="${trimmed}">${linkText}</a>`;
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
        const response = await fetch(`${API_BASE_URL}/layers`);
        const layers = await response.json();
        window.allLayerConfigs = layers;

        // Build Tabs
        const uniqueTabs = [
            ...new Set(layers.map((l) => l.tab || "Uncategorized")),
        ];
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

            let creditBtnUI = "";
            if (layerInfo.credit_page) {
                creditBtnUI = `<div class="credit-btn" data-url="credits/${layerInfo.credit_page}" title="View Credits">Cr</div>`;
            }

            const checkboxId = `cb-${i}`;
            const checkboxUI = `<input id="${checkboxId}" class="layer-load-cb" type="checkbox" style="margin:0; cursor:pointer; flex-shrink:0; transform: scale(0.8);" ${isLoaded ? 'checked' : ''}>`;

            // Restore v6 layout structure
            item.innerHTML = `
                <div class="layer-info-container" style="display: flex; flex-direction: column; gap: 4px; flex: 1; margin-right: 12px; min-width: 0;">
                    <div class="layer-info" style="display: flex; align-items: center; gap: 10px;">
                        ${checkboxUI}
                        <div class="layer-color-ui" style="display:flex; align-items:center; flex-shrink:0;"><div style="width: 12px; height: 12px; border-radius: 50%; background: #cbd5e1;"></div></div>
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

                    if (layerInfo.type && layerInfo.type.toLowerCase() === "raster") {
                        const displayFilename = layerInfo.rendered_filename || layerInfo.filename;
                        const url = API_BASE_URL.replace("/api", "") + `/maps/${encodeURIComponent(displayFilename)}`;
                        const georaster = await parseGeoraster(url);
                        let rasterOpacity = 0.7;
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
                        });
                        colorUI.innerHTML = `<div style="width: 12px; height: 12px; border-radius: 50%; background: #9aa5b1; flex-shrink:0;"></div>`;
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
                            colorUI.innerHTML = `<div style="width: 12px; height: 12px; border-radius: 50%; background: ${bg}; flex-shrink:0;"></div>`;
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
                            colorUI.innerHTML = `<div style="width: 12px; height: 12px; border-radius: 50%; background: ${singleColor}; flex-shrink:0;"></div>`;
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
                                            const firstKeyField = parsedKeys[0][0].toLowerCase();
                                            if (["name", "title", "road_name", "river_name"].includes(firstKeyField)) {
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
                    colorUI.innerHTML = `<div style="width: 12px; height: 12px; border-radius: 50%; background: #cbd5e1; flex-shrink:0;"></div>`;
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
    } catch (error) {
        console.error("Error fetching layers data:", error);
        layerListEl.innerHTML = `<div class="loading-state" style="color: #ffb3ba">Error connecting to server.</div>`;
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
            <img class="est-close-btn" src="resources/images/cross-nrm.svg" alt="Close" title="Close Marker" style="cursor: pointer; transition: content 0.2s; height: 10.7px;" onmouseover="this.src='resources/images/cross-cls.svg';" onmouseout="this.src='resources/images/cross-nrm.svg';" onclick="window.closeEstimatorMarker();">
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
}
