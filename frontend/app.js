/**
 * GEOSPATIAL MAP VISUALIZATION APPLICATION
 * Interactive Leaflet.js-based map for viewing layered geographical data
 * Supports real-time tooltips, coordinate lookups, and water level estimation
 */

// ============================================================================
// MAP INITIALIZATION
// ============================================================================

const API_BASE_URL = window.location.port === '8383' ? 'http://localhost:8484/api' : '/api';

const map = L.map('map', {
    zoomControl: false,
    attributionControl: false
}).setView([23.6850, 90.3563], 7);

L.control.zoom({ position: 'bottomright' }).addTo(map);

L.control.attribution({ position: 'bottomleft' })
    .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>')
    .addTo(map);

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

// ============================================================================
// UI ELEMENT REFERENCES
// ============================================================================

const layerListEl = document.getElementById('layer-list');
const tooltip = document.getElementById('tooltip');
const tooltipRef = document.getElementById('tooltip-ref');
const tooltipLayer = document.getElementById('tooltip-layer');
const tooltipName = document.getElementById('tooltip-name');
const tooltipDetails = document.getElementById('tooltip-details');

// ============================================================================
// COLOR PALETTE & LAYER STORAGE
// ============================================================================

const engineeringColors = [
    '#1d46e9', '#4a90e2', '#76c33b', '#ffe734', '#9f7aea', '#ed8936', '#00b5d8', '#f11e1e', '#616874', '#f59e0b', '#3b82f6', '#10b981'
];

const loadedLayers = {};

// ============================================================================
// PANEL PIN BUTTONS (KEEP PANELS VISIBLE)
// ============================================================================

const pinBtn = document.getElementById('pin-btn');
const panelContainer = document.querySelector('.side-panel-container');

if (pinBtn && panelContainer) {
    pinBtn.addEventListener('click', () => {
        panelContainer.classList.toggle('pinned');
        pinBtn.classList.toggle('pinned-active');
    });
}

// Right panel pin close button
const rightPinBtn = document.getElementById('right-pin-btn');
const rightPanelContainer = document.getElementById('right-panel-container');
if (rightPinBtn && rightPanelContainer) {
    rightPinBtn.addEventListener('click', () => {
        rightPanelContainer.classList.remove('pinned');
    });
}

// ============================================================================
// FEATURE STYLING FUNCTIONS
// ============================================================================

const getFeatureStyle = (feature, defaultColor) => {
    let color = defaultColor;
    let weight = 1.5;
    
    // Check if data-driven styling is available
    if (feature.properties && feature.properties.f_class_color) {
        color = feature.properties.f_class_color;
    }
    
    const geomType = feature.geometry.type;
    const isPolygon = geomType.includes('Polygon');
    
    // Handle weight from feature properties if exists
    if (feature.properties && feature.properties.f_class_weight !== undefined && feature.properties.f_class_weight !== null) {
        let pct = parseFloat(feature.properties.f_class_weight);
        if (pct === 0) {
            return { weight: 0, opacity: 0, fillOpacity: 0, color: 'transparent' };
        }
        weight = isPolygon ? (0.75 * pct / 100) : (1.5 * pct / 100);
    } else {
        weight = isPolygon ? 0.75 : 1.5;
    }

    let finalOpacity = 0.8;
    let finalFillOpacity = isPolygon ? 0.3 : 1;

    if (feature.properties && feature.properties.f_class_transparency !== undefined && feature.properties.f_class_transparency !== null && feature.properties.f_class_transparency !== '') {
        const t = parseFloat(feature.properties.f_class_transparency);
        if (!isNaN(t)) {
            // Convert transparency percentage to opacity (e.g., 20% transparent = 80% opaque = 0.8)
            finalOpacity = (100 - t) / 100;
            // Scale fill opacity proportionally if it is a polygon
            finalFillOpacity = isPolygon ? Math.min(0.3, finalOpacity) : finalOpacity;
        }
    }

    return {
        color: color,
        fillColor: color,
        weight: weight,
        fillOpacity: finalFillOpacity,
        opacity: finalOpacity,
        lineCap: 'round'
    };
};

const getHighlightStyle = (feature, color) => {
    const isPolygon = feature.geometry.type.includes('Polygon');
    return {
        weight: isPolygon ? 1.5 : 2.5,
        color: '#4a5568',
        fillOpacity: isPolygon ? 0.6 : 1,
        opacity: 1
    };
};

// ============================================================================
// TOOLTIP RENDERING
// ============================================================================

const renderTooltipProps = (props, displayKeys) => {
    tooltipDetails.innerHTML = '';
    
    const otherPropsContainer = document.createElement('div');
    otherPropsContainer.className = 'other-props-container';
    otherPropsContainer.style.display = 'none'; 
    otherPropsContainer.style.flexDirection = 'column';
    otherPropsContainer.style.gap = '8px';
    otherPropsContainer.style.marginTop = '8px';
    otherPropsContainer.style.borderTop = '1px dashed #e2e8f0';
    otherPropsContainer.style.paddingTop = '8px';

    let count = 0;
    
    if (displayKeys) {
        // Data-driven keys logic
        for (const pair of displayKeys) {
            const field = pair[0];
            const label = pair[1];
            const val = props[field];
            
            if (val === undefined || val === null || val === '') continue;
            
            const row = document.createElement('div');
            row.className = 'detail-row';
            row.innerHTML = `<span class="detail-key">${label}</span><span class="detail-val">${val}</span>`;
            
            if (count < 3) tooltipDetails.appendChild(row);
            else otherPropsContainer.appendChild(row);
            count++;
        }
    } else {
        // Fallback logic for layers without 'keys'
        const skipKeys = [
            'id', 'original_id', 'fid', 'objectid', 'type', 'name', 'road_name', 'river_name', 
            'rhd_ref', 'shape_leng', 'shape_length', 'shape_area', 'st_area(shape)', 'st_length(shape)',
            'class_lad', 're_class', 'objectid_1','objectid_12', 'bridge_sif', 'contour', 'rmms_link', 'keys', 'f_class_name', 'f_class_color', 'f_class_weight'
        ];
        
        for (const [key, value] of Object.entries(props)) {
            if (skipKeys.includes(key.toLowerCase()) || value === null || value === undefined || value === '') continue;
            
            const row = document.createElement('div');
            row.className = 'detail-row';
            row.innerHTML = `<span class="detail-key">${key.replace(/_/g, ' ')}</span><span class="detail-val">${value}</span>`;
            
            if (count < 3) tooltipDetails.appendChild(row);
            else otherPropsContainer.appendChild(row);
            count++;
        }
    }
    
    // Add "See More" button if there are hidden properties
    if (otherPropsContainer.children.length > 0) {
        tooltipDetails.appendChild(otherPropsContainer);
        
        const seeMoreBtn = document.createElement('button');
        seeMoreBtn.className = 'see-more-btn';
        seeMoreBtn.textContent = 'See more ▼';
        seeMoreBtn.onclick = (e) => {
            e.stopPropagation();
            if (otherPropsContainer.style.display === 'none') {
                otherPropsContainer.style.display = 'flex';
                seeMoreBtn.textContent = 'See less ▲';
            } else {
                otherPropsContainer.style.display = 'none';
                seeMoreBtn.textContent = 'See more ▼';
            }
        };
        tooltipDetails.appendChild(seeMoreBtn);
    }
    
    if (tooltipDetails.children.length === 0) {
        tooltipDetails.style.display = 'none';
    } else {
        tooltipDetails.style.display = 'flex';
    }
};

tooltip.addEventListener('mouseenter', () => {
    if (window.tooltipHideTimeout) clearTimeout(window.tooltipHideTimeout);
});
tooltip.addEventListener('mouseleave', () => {
    if (!window.featureTooltipLocked) {
        tooltip.classList.remove('visible');
    }
});
L.DomEvent.disableClickPropagation(tooltip);
L.DomEvent.disableScrollPropagation(tooltip);

window.featureTooltipLocked = false;
window.activeFeatureLayer = null;

map.on('click', (e) => {
    // Check if Target Mode is active for Level Estimator
    const targetBtn = document.getElementById('target-btn');
    if (targetBtn && targetBtn.classList.contains('active')) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);
        document.getElementById('coord-input').value = `${lat}, ${lng}`;
        
        targetBtn.classList.remove('active');
        document.getElementById('map').classList.remove('crosshair-cursor');
        document.getElementById('coord-btn').click(); // Auto-estimate!
        return;
    }

    if (e.originalEvent && e.originalEvent.target && e.originalEvent.target.closest('#tooltip')) {
        return;
    }
    
    if (window.featureTooltipLocked) {
        window.featureTooltipLocked = false;
        tooltip.classList.remove('visible');
        if (window.activeFeatureLayer && window.activeFeatureLayer.resetStyleFunc) {
            window.activeFeatureLayer.resetStyleFunc();
        }
        window.activeFeatureLayer = null;
    }
});

// ============================================================================
// LAYER FETCHING AND RENDERING
// ============================================================================

async function fetchAndRenderLayers() {
    try {
        const response = await fetch(`${API_BASE_URL}/layers`);
        const layers = await response.json();
        
        layerListEl.innerHTML = '';
        
        for (let i = 0; i < layers.length; i++) {
            const layerInfo = layers[i];
            const color = engineeringColors[i % engineeringColors.length];
            
            const layerDataRes = await fetch(`${API_BASE_URL}/layers/${layerInfo.table}`);
            const data = await layerDataRes.json();
            
            // Extract dynamic classes from data
            const classMap = new Map();
            if (data.features) {
                for (const feat of data.features) {
                    if (feat.properties && feat.properties.f_class_name && feat.properties.f_class_color) {
                        const weight = feat.properties.f_class_weight;
                        classMap.set(feat.properties.f_class_name, {
                            color: feat.properties.f_class_color,
                            weight: weight !== undefined && weight !== null ? parseFloat(weight) : 100
                        });
                    }
                }
            }
            
            const classEntries = Array.from(classMap.entries());
            const hasClasses = classEntries.length > 0;
            
            // ---- Create UI Toggle Item for layer control ----
            const item = document.createElement('div');
            item.className = 'layer-arc-item active'; 
            
            let layerColorUI = `<div class="layer-color" style="background-color: ${color};"></div>`;
            let subLegendUI = '';

            if (hasClasses) {
                // Build conic gradient
                if (classEntries.length > 1) {
                    const sliceAngle = 360 / classEntries.length;
                    let gradParts = [];
                    for (let j = 0; j < classEntries.length; j++) {
                        gradParts.push(`${classEntries[j][1].color} ${j * sliceAngle}deg ${(j + 1) * sliceAngle}deg`);
                    }
                    layerColorUI = `<div class="layer-color" style="background: conic-gradient(${gradParts.join(', ')});"></div>`;
                } else {
                    layerColorUI = `<div class="layer-color" style="background-color: ${classEntries[0][1].color};"></div>`;
                }

                // Build sub-legend (max 4, or 3 + more button)
                subLegendUI = `<div class="layer-sub-legend" style="display: flex; gap: 6px; align-items: center; margin-left: 22px; width: calc(100% - 22px); font-size: 9px; color: var(--text-dim); font-weight: 600;">`;
                subLegendUI += `<div style="display: flex; gap: 8px; overflow: hidden; white-space: nowrap; flex: 1;">`;
                
                const displayLimit = 4;
                const toShow = classEntries.length <= displayLimit ? classEntries.length : 3;
                
                for (let k = 0; k < toShow; k++) {
                    const cName = classEntries[k][0];
                    const cColor = classEntries[k][1].color;
                    let displayName = cName;
                    
                    subLegendUI += `<span style="display: flex; align-items: center; gap: 3px; flex-shrink: 0;" title="${cName}"><div style="width: 6px; height: 6px; border-radius: 50%; background: ${cColor}; flex-shrink: 0;"></div><span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 55px;">${displayName}</span></span>`;
                }
                subLegendUI += `</div>`;

                if (classEntries.length > displayLimit) {
                    subLegendUI += `<div class="legend-more-btn" title="See all classes" style="flex-shrink: 0;">+${classEntries.length - 3}</div>`;
                }
                
                subLegendUI += `</div>`;
            }

            item.innerHTML = `
                <div class="layer-info-container" style="display: flex; flex-direction: column; gap: 4px; flex: 1; overflow: hidden; margin-right: 12px;">
                    <div class="layer-info">
                        ${layerColorUI}
                        <span class="layer-name">${layerInfo.name}</span>
                    </div>
                    ${subLegendUI}
                </div>
                <div class="toggle-switch"></div>
            `;
            layerListEl.appendChild(item);
            
            // Attach more button handler if it exists
            const moreBtn = item.querySelector('.legend-more-btn');
            if (moreBtn) {
                moreBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent layer toggle
                    
                    // Unpin left side panel
                    if (panelContainer) panelContainer.classList.remove('pinned');
                    if (pinBtn) pinBtn.classList.remove('pinned-active');
                    
                    // Populate right panel
                    const rightPanelTitle = document.getElementById('right-panel-title');
                    const rightPanelContent = document.getElementById('right-panel-content');
                    rightPanelTitle.textContent = layerInfo.name;
                    
                    rightPanelContent.innerHTML = '';
                    for (const [cName, cData] of classEntries) {
                        const isHidden = cData.weight === 0;
                        const hiddenMarkup = isHidden ? `<span style="color: var(--text-dim); font-style: italic; font-weight: 400; margin-left: 4px;">(hidden)</span>` : '';
                        rightPanelContent.innerHTML += `
                            <div class="right-legend-item" ${isHidden ? 'style="opacity: 0.6;"' : ''}>
                                <div class="right-legend-color" style="background: ${cData.color};"></div>
                                <span>${cName}${hiddenMarkup}</span>
                            </div>
                        `;
                    }
                    
                    // Open right panel and pin it automatically
                    if (rightPanelContainer) {
                        rightPanelContainer.classList.add('pinned');
                    }
                });
            }
            
            // ---- Create Leaflet GeoJSON layer with styling and interactivity ----
            const paneName = 'pane_' + i;
            if (!map.getPane(paneName)) {
                map.createPane(paneName);
            }
            // Z-index: smaller index (earlier in table) = higher z-index (drawn on top)
            map.getPane(paneName).style.zIndex = 400 + (layers.length - i);

            const geoJsonLayer = L.geoJSON(data, {
                pane: paneName,
                filter: function (feature) {
                    const name = (feature.properties.name || feature.properties.river_name || feature.properties.locality || '').toLowerCase();
                    if (name.includes('bay of bengal')) return false; 
                    return true;
                },
                style: (feature) => getFeatureStyle(feature, color),
                onEachFeature: (feature, layer) => {
                    const populateTooltip = (e) => {
                        const props = feature.properties;
                        
                        let headerValue = ' ';
                        let displayKeys = null;
                        
                        if (props.keys) {
                            let parsedKeys = [];
                            try {
                                let keysStr = props.keys;
                                if (typeof keysStr === 'string') {
                                    // Custom regex parser to handle formats like: "[river name, Name], [type, Type]"
                                    // Because the input is not valid JSON (no quotes around strings)
                                    let regex = /\[([^,]+),\s*([^\]]+)\]/g;
                                    let match;
                                    while ((match = regex.exec(keysStr)) !== null) {
                                        parsedKeys.push([match[1].trim(), match[2].trim()]);
                                    }
                                } else {
                                    parsedKeys = keysStr;
                                }
                            } catch(err) { console.error("Error parsing keys:", err); }
                            
                            if (parsedKeys && parsedKeys.length > 0) {
                                let hVal = props[parsedKeys[0][0]];
                                headerValue = (hVal !== undefined && hVal !== null && hVal !== '') ? hVal : ' ';
                                displayKeys = parsedKeys.slice(1);
                            }
                        } else {
                            // Fallback logic
                            headerValue = (props.contour !== undefined && props.contour !== null) ? `Contour: ${props.contour} m` : (props.name || props.road_name || props.river_name || props.locality || ' ');
                        }
                        
                        tooltipName.textContent = headerValue;
                        tooltipLayer.textContent = layerInfo.name;
                        
                        // Hide ref logic for generic data
                        tooltipRef.style.display = 'none';
                        
                        renderTooltipProps(props, displayKeys);
                        tooltip.classList.add('visible');
                    };

                    layer.on({
                        click: (e) => {
                            // Let click pass to map if target mode is active
                            const targetBtn = document.getElementById('target-btn');
                            if (targetBtn && targetBtn.classList.contains('active')) {
                                return; // Do not stop propagation
                            }
                            
                            L.DomEvent.stopPropagation(e);
                            
                            if (window.activeFeatureLayer && window.activeFeatureLayer !== layer && window.activeFeatureLayer.resetStyleFunc) {
                                window.activeFeatureLayer.resetStyleFunc();
                            }
                            
                            window.featureTooltipLocked = true;
                            window.activeFeatureLayer = layer;
                            layer.resetStyleFunc = () => geoJsonLayer.resetStyle(layer);
                            
                            layer.setStyle(getHighlightStyle(feature, color));
                            layer.bringToFront();
                            
                            populateTooltip(e);
                            
                            tooltip.style.left = (e.originalEvent.pageX + 15) + 'px';
                            tooltip.style.top = (e.originalEvent.pageY + 15) + 'px';
                        },
                        mouseover: (e) => {
                            if (window.featureTooltipLocked) return;
                            
                            if (window.tooltipHideTimeout) clearTimeout(window.tooltipHideTimeout);
                            
                            layer.setStyle(getHighlightStyle(feature, color));
                            layer.bringToFront(); 
                            
                            window.activeFeatureLayer = layer;
                            layer.resetStyleFunc = () => geoJsonLayer.resetStyle(layer);
                            
                            populateTooltip(e);
                        },
                        mouseout: (e) => {
                            if (window.featureTooltipLocked) return;
                            
                            geoJsonLayer.resetStyle(layer);
                            window.tooltipHideTimeout = setTimeout(() => {
                                if (!window.featureTooltipLocked) {
                                    tooltip.classList.remove('visible');
                                    window.activeFeatureLayer = null;
                                }
                            }, 250); 
                        },
                        mousemove: (e) => {
                            if (window.featureTooltipLocked) return;
                            tooltip.style.left = (e.originalEvent.pageX + 15) + 'px';
                            tooltip.style.top = (e.originalEvent.pageY + 15) + 'px';
                        }
                    });
                }
            });
            
            geoJsonLayer.addTo(map);
            loadedLayers[layerInfo.name] = geoJsonLayer;
            
            // Auto-fit map bounds logic: if layer has classes (like RHD) or is first layer
            if (hasClasses && data.features && data.features.length > 0) {
                map.fitBounds(geoJsonLayer.getBounds());
            } else if (i === 0 && data.features && data.features.length > 0) {
                map.fitBounds(geoJsonLayer.getBounds());
            }
            
            let isActive = true;
            item.addEventListener('click', () => {
                isActive = !isActive;
                if (isActive) {
                    item.classList.add('active');
                    geoJsonLayer.addTo(map);
                } else {
                    item.classList.remove('active');
                    map.removeLayer(geoJsonLayer);
                }
            });
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

function parseDMS(input) {
    const parts = input.split(',');
    if (parts.length !== 2) return null;
    
    function parsePart(str) {
        str = str.trim();
        if (/^-?\d+(\.\d+)?$/.test(str)) return parseFloat(str);
        
        let clean = str.replace(/\\degree/g, ' ').replace(/d/g, ' ').replace(/m/g, ' ').replace(/s/g, ' ')
                       .replace(/deg/g, ' ').replace(/min/g, ' ').replace(/sec/g, ' ').replace(/°/g, ' ')
                       .replace(/''/g, ' ').replace(/'/g, ' ').replace(/"/g, ' ');
        
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

document.getElementById('coord-btn').addEventListener('click', async () => {
    const rawInput = document.getElementById('coord-input').value;
    const coords = parseDMS(rawInput);
    
    if (!coords) {
        alert("Please enter a valid coordinate (e.g. '23.66, 91.06' or '23 45 33, 91 07 45' or '23d 45m 33s, 91d 07m 45s')");
        return;
    }
    
    const { lat, lng } = coords;
    
    if (currentMarker) map.removeLayer(currentMarker);
    
    const customIcon = L.icon({
        iconUrl: 'resources/placemarker.svg',
        iconSize: [78, 78],
        iconAnchor: [39, 78],
        tooltipAnchor: [0, -78]
    });
    
    currentMarker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
    map.setView([lat, lng], 13);
    
    try {
        const res = await fetch(`${API_BASE_URL}/estimate_water_levels?lat=${lat}&lng=${lng}`);
        const data = await res.json();
        
        let shwlText = data.shwl !== null ? `${data.shwl.toFixed(2)} m` : "N/A";
        let slwlText = data.slwl !== null ? `${data.slwl.toFixed(2)} m` : "N/A";
        
        const popupContent = `
            <div style="font-family: var(--font-display); font-size: 13px;">
                <strong style="color: var(--accent-blue); font-size: 15px; text-transform: uppercase;">Estimated Levels</strong><br>
                <span style="color: var(--text-dim);">SHWL:</span> <b>${shwlText}</b><br>
                <span style="color: var(--text-dim);">SLWL:</span> <b>${slwlText}</b>
            </div>
        `;
        
        currentMarker.bindTooltip(popupContent, {
            permanent: false,
            direction: 'top',
            className: 'custom-estimator-tooltip'
        }).openTooltip();
        
    } catch (err) {
        console.error("Estimation failed:", err);
        currentMarker.bindTooltip("Error calculating estimation.").openTooltip();
    }
});

// Target Mode Logic
const targetBtn = document.getElementById('target-btn');
if (targetBtn) {
    targetBtn.addEventListener('click', () => {
        const isActive = targetBtn.classList.contains('active');
        if (!isActive) {
            targetBtn.classList.add('active');
            document.getElementById('map').classList.add('crosshair-cursor');
        } else {
            targetBtn.classList.remove('active');
            document.getElementById('map').classList.remove('crosshair-cursor');
        }
    });
}
