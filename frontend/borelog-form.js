/**
 * Borelog Form Logic
 * Handles dynamic table rows, coordinate parsing, and API submission.
 */

const getRowHTML = (type) => {
    switch (type) {
        case 'strata':
            return `
                <td data-label="Top (m)"><input required type="number" step="0.5" class="f-top"></td>
                <td data-label="Bottom (m)"><input required type="number" step="0.5" class="f-bottom"></td>
                <td data-label="Class (USCS)"><select required class="f-class" style="padding: 11px; border: 1px solid var(--border-color); width: 100%;">
                    <option value="" disabled selected>Select USCS</option>
                    <option value="GW">GW</option>
                    <option value="GP">GP</option>
                    <option value="GM">GM</option>
                    <option value="GC">GC</option>
                    <option value="SW">SW</option>
                    <option value="SP">SP</option>
                    <option value="SM">SM</option>
                    <option value="SC">SC</option>
                    <option value="ML">ML</option>
                    <option value="CL">CL</option>
                    <option value="OL">OL</option>
                    <option value="MH">MH</option>
                    <option value="CH">CH</option>
                    <option value="OH">OH</option>
                    <option value="Pt">Pt</option>
                    <option value="GW-GM">GW-GM</option>
                    <option value="GW-GC">GW-GC</option>
                    <option value="GP-GM">GP-GM</option>
                    <option value="GP-GC">GP-GC</option>
                    <option value="SW-SM">SW-SM</option>
                    <option value="SW-SC">SW-SC</option>
                    <option value="SP-SM">SP-SM</option>
                    <option value="SP-SC">SP-SC</option>
                    <option value="GC-GM">GC-GM</option>
                    <option value="SC-SM">SC-SM</option>
                    <option value="CL-ML">CL-ML</option>
                </select></td>
                <td data-label="Description"><input required type="text" class="f-desc" placeholder="Soil description" placeholder="Add a concise description"></td>
                <td data-label="Actions" class="action-pill-td">
                    <span class="empty-table-row-filler" title="Type into any field to begin"><img src="resources/images/enter-svgrepo.svg"></span>
                    <div class="action-pill" style="display: inline-flex; align-items: center; justify-content: center; gap: 5px; padding: 2px 9px; height: 32px; /*! background: #fff; */"> 
                        <button type="button" class="insert-btn" onclick="insertRowAfter(this)" title="Insert Row Below">🞣</button>
                        <button type="button" class="del-btn" onclick="deleteRow(this)" title="Delete Row">𐩃</button>
                    </div>
                </td>
            `;
        case 'spt':
            return `
                <td data-label="Depth (m)"><input required type="number" step="0.01" class="f-depth"></td>
                <td data-label="Blows (0-150)"><input required type="number" class="f-b150"></td>
                <td data-label="Blows (150-300)"><input required type="number" class="f-b300"></td>
                <td data-label="Blows (300-450)"><input required type="number" class="f-b450"></td>
                <td data-label="N-Value"><input required type="text" class="f-nval"></td>
                <td data-label="Actions" class="action-pill-td">
                    <span class="empty-table-row-filler" title="Type into any field to begin"><img src="resources/images/enter-svgrepo.svg"></span>
                    <div class="action-pill">                    
                        <button type="button" class="insert-btn" onclick="insertRowAfter(this)" title="Insert Row Below">🞣</button>
                        <button type="button" class="del-btn" onclick="deleteRow(this)" title="Delete Row">𐩃</button>
                    </div>
                </td>
            `;
        case 'atterberg':
            return `
                <td data-label="Depth (m)"><input type="number" step="0.1" class="f-depth" required></td>
                <td data-label="WL (%)"><input type="number" step="1" class="f-wl" required></td>
                <td data-label="WP (%)"><input type="number" step="1" class="f-wp" required></td>
                <td data-label="IP (%)"><input type="number" step="0.1" class="f-ip" required></td>
                <td data-label="LI"><input type="number" step="1" class="f-li" required></td>
                <td data-label="Actions" class="action-pill-td">
                    <span class="empty-table-row-filler" title="Type into any field to begin"><img src="resources/images/enter-svgrepo.svg"></span>
                    <div class="action-pill">                    
                        <button type="button" class="insert-btn" onclick="insertRowAfter(this)" title="Insert Row Below">🞣</button>
                        <button type="button" class="del-btn" onclick="deleteRow(this)" title="Delete Row">𐩃</button>
                    </div>
                </td>
            `;
        case 'cpt':
            return `
                <td data-label="Depth (m)"><input required aria-required="true" type="number" step="0.1" class="f-depth"></td>
                <td data-label="qc (MPa)"><input required aria-required="true" type="number" step="10" class="f-qc"></td>
                <td data-label="fs (kPa)"><input type="number" step="1" class="f-fs"></td>
                <td data-label="Rf (%)"><input required aria-required="true" type="number" step="1" class="f-rf"></td>
                <td data-label="u2 (kPa)"><input required aria-required="true" type="number" step="10" class="f-u2"></td>
                <td data-label="Actions" class="action-pill-td">
                    <span class="empty-table-row-filler" title="Type into any field to begin"><img src="resources/images/enter-svgrepo.svg"></span>
                    <div class="action-pill">                    
                        <button type="button" class="insert-btn" onclick="insertRowAfter(this)" title="Insert Row Below">🞣</button>
                        <button type="button" class="del-btn" onclick="deleteRow(this)" title="Delete Row">𐩃</button>
                    </div>
                </td>
            `;
        case 'shear':
            return `
                <td><input required aria-required="true" type="number" step="0.001" class="f-depth"></td>
                <td><input required aria-required="true" type="number" step="0.001" class="f-normal"></td>
                <td><input required aria-required="true" type="number" step="0.001" class="f-shear"></td>
                <td><input required aria-required="true" type="number" step="0.001" class="f-cohesion"></td>
                <td><input required aria-required="true" type="number" step="0.001" class="f-friction"></td>
                <td data-label="Actions" class="action-pill-td">
                    <span class="empty-table-row-filler" title="Type into any field to begin"><img src="resources/images/enter-svgrepo.svg"></span>
                    <div class="action-pill">                    
                        <button type="button" class="insert-btn" onclick="insertRowAfter(this)" title="Insert Row Below">🞣</button>
                        <button type="button" class="del-btn" onclick="deleteRow(this)" title="Delete Row">𐩃</button>
                    </div>
                </td>
            `;
        case 'triaxial':
            return `
                <td><input required type="number" step="0.001" class="f-depth"></td>
                <td>
                    <select class="f-type" style="padding: 11px; border: 1px solid var(--border-color); width: 100%;">
                        <option value="CD">CD</option>
                        <option value="CU">CU</option>
                    </select>
                </td>
                <td><input required type="number" step="0.1" class="f-confining"></td>
                <td><input required type="number" step="0.1" class="f-deviator"></td>
                <td><input required type="number" step="0.1" class="f-e50"></td>
                <td data-label="Actions" class="action-pill-td">
                    <span class="empty-table-row-filler" title="Type into any field to begin"><img src="resources/images/enter-svgrepo.svg"></span>
                    <div class="action-pill">                    
                        <button type="button" class="insert-btn" onclick="insertRowAfter(this)" title="Insert Row Below">🞣</button>
                        <button type="button" class="del-btn" onclick="deleteRow(this)" title="Delete Row">𐩃</button>
                    </div>
                </td>
            `;
        case 'consolidation':
            return `
                <td><input required type="number" step="0.001" class="f-depth"></td>
                <td><input required type="number" step="0.1" class="f-stress"></td>
                <td><input required type="number" step="0.1" class="f-eoed"></td>
                <td><input required type="number" step="0.001" class="f-cc"></td>
                <td><input required type="number" step="0.001" class="f-cr"></td>
                <td><input required type="number" step="0.1" class="f-pc"></td>
                <td data-label="Actions" class="action-pill-td">
                    <span class="empty-table-row-filler" title="Type into any field to begin"><img src="resources/images/enter-svgrepo.svg"></span>
                    <div class="action-pill"> 
                    
                        <button type="button" class="insert-btn" onclick="insertRowAfter(this)" title="Insert Row Below">🞣</button>
                        
                        <button type="button" class="del-btn" onclick="deleteRow(this)" title="Delete Row">𐩃</button>
                    </div>
                </td>
            `;
        default:
            return '';
    }
};

window.addRow = (tbodyId) => {
    const tbody = document.getElementById(tbodyId);
    const type = tbody.dataset.type;
    const tr = document.createElement('tr');
    tr.innerHTML = getRowHTML(type);
    tbody.appendChild(tr);

    if (type === 'strata') {
        const rows = tbody.querySelectorAll('tr');
        if (rows.length > 1) {
            const prevRow = rows[rows.length - 2];
            const prevBottom = prevRow.querySelector('.f-bottom').value;
            if (prevBottom) {
                tr.querySelector('.f-top').value = prevBottom;
            }
        }
    }

    return tr;
};

window.deleteRow = (btn) => {
    btn.closest('tr').remove();
};

window.insertRowAfter = (btn) => {
    const currentRow = btn.closest('tr');
    const tbody = currentRow.closest('tbody');
    const type = tbody.dataset.type;
    const tr = document.createElement('tr');
    tr.innerHTML = getRowHTML(type);
    currentRow.insertAdjacentElement('afterend', tr);

    if (type === 'strata') {
        const prevBottom = currentRow.querySelector('.f-bottom').value;
        if (prevBottom) {
            tr.querySelector('.f-top').value = prevBottom;
        }
    }

    return tr;
};

const showToast = (message, isError = false) => {
    const toast = document.getElementById('status-toast');
    toast.textContent = message;

    // Reset classes
    toast.className = '';

    // Apply correct theme class
    toast.classList.add(isError ? 'toast-error' : 'toast-success');

    // Trigger animation
    toast.classList.add('visible');

    setTimeout(() => {
        toast.classList.remove('visible');
    }, 4000);
};

// Initialize with one row each
window.onload = () => {
    ['strata', 'spt', 'atterberg', 'shear', 'consolidation', 'triaxial', 'cpt'].forEach(type => {
        addRow(`${type}-body`);
    });
};

const parseNum = (val) => val ? parseFloat(val) : null;
const parseIntSafe = (val) => val ? parseInt(val, 10) : null;

// Parse coordinates string "lat, lng"
const parseCoordinates = (coordString) => {
    const parts = coordString.split(',').map(s => s.trim());
    if (parts.length !== 2) throw new Error("Coordinates must be in format 'Latitude, Longitude'");
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lng)) throw new Error("Coordinates must be valid numbers");
    return [lat, lng]; // We store as [lat, lng], backend expects what? Usually GeoJSON is [lng, lat], let's check
};

function gatherBorelogData() {
    const coordRaw = document.getElementById('coordinates').value || "0,0";
    const [lat, lng] = parseCoordinates(coordRaw);

    return {
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [lat, lng]
        },
        properties: {
            borelog_id: document.getElementById('borelog_id').value,
            client: document.getElementById('client').value,
            project: document.getElementById('project').value,
            location: document.getElementById('location').value,
            drilling_team: document.getElementById('drilling_team').value,
            supervisor: document.getElementById('supervisor').value,
            drill_rig: document.getElementById('drill_rig').value,
            tbm_no: document.getElementById('tbm_no').value,
            date_of_starting_boring: document.getElementById('date_of_starting_boring').value,
            date_of_ending_boring: document.getElementById('date_of_ending_boring').value,
            rl_m: parseNum(document.getElementById('rl_m').value),
            depth_m: parseNum(document.getElementById('depth_m').value),
            water_table_m: parseNum(document.getElementById('water_table_m').value),
            comments: document.getElementById('comments').value,

            strata: Array.from(document.querySelectorAll('#strata-body tr')).filter(row => row.querySelector('.f-bottom').value.trim() !== '').map(row => ({
                top_m: parseFloat(row.querySelector('.f-top').value),
                bottom_m: parseFloat(row.querySelector('.f-bottom').value),
                class: row.querySelector('.f-class').value,
                description: row.querySelector('.f-desc').value
            })),

            spt_data: Array.from(document.querySelectorAll('#spt-body tr')).filter(row => row.querySelector('.f-depth').value.trim() !== '').map(row => ({
                depth_m: parseFloat(row.querySelector('.f-depth').value),
                blows_0_150: parseInt(row.querySelector('.f-b150').value),
                blows_150_300: parseInt(row.querySelector('.f-b300').value),
                blows_300_450: parseInt(row.querySelector('.f-b450').value),
                n_value: row.querySelector('.f-nval').value
            })),

            atterberg_test_data: Array.from(document.querySelectorAll('#atterberg-body tr')).filter(row => row.querySelector('.f-depth').value.trim() !== '').map(row => ({
                depth_m: parseFloat(row.querySelector('.f-depth').value),
                wl: parseFloat(row.querySelector('.f-wl').value),
                wp: parseFloat(row.querySelector('.f-wp').value),
                ip: parseFloat(row.querySelector('.f-ip').value),
                li: parseFloat(row.querySelector('.f-li').value)
            })),

            cpt_data: Array.from(document.querySelectorAll('#cpt-body tr')).filter(row => row.querySelector('.f-depth').value.trim() !== '').map(row => ({
                depth_m: parseFloat(row.querySelector('.f-depth').value),
                qc_mpa: parseFloat(row.querySelector('.f-qc').value),
                fs_kpa: parseFloat(row.querySelector('.f-fs').value),
                rf_percent: parseFloat(row.querySelector('.f-rf').value),
                u2_kpa: row.querySelector('.f-u2').value ? parseFloat(row.querySelector('.f-u2').value) : null
            })),

            direct_shear_test_data: Array.from(document.querySelectorAll('#shear-body tr')).filter(row => row.querySelector('.f-depth').value.trim() !== '').map(row => ({
                depth_m: parseFloat(row.querySelector('.f-depth').value),
                normal_stress_kpa: parseFloat(row.querySelector('.f-normal').value),
                shear_stress_kpa: parseFloat(row.querySelector('.f-shear').value),
                cohesion_kpa: parseFloat(row.querySelector('.f-cohesion').value),
                friction_angle_deg: parseFloat(row.querySelector('.f-friction').value)
            })),

            consolidation_test_data: Array.from(document.querySelectorAll('#consolidation-body tr')).filter(row => row.querySelector('.f-depth').value.trim() !== '').map(row => ({
                depth_m: parseFloat(row.querySelector('.f-depth').value),
                vertical_effective_stress_kpa: parseFloat(row.querySelector('.f-stress').value),
                constrained_modulus_eoed_mpa: parseFloat(row.querySelector('.f-eoed').value),
                compression_index: parseFloat(row.querySelector('.f-cc').value),
                recompression_index: parseFloat(row.querySelector('.f-cr').value),
                preconsolidation_pressure_kpa: parseFloat(row.querySelector('.f-pc').value)
            })),

            triaxial_test_data: Array.from(document.querySelectorAll('#triaxial-body tr')).filter(row => row.querySelector('.f-depth').value.trim() !== '').map(row => ({
                depth_m: parseFloat(row.querySelector('.f-depth').value),
                test_type: row.querySelector('.f-type').value,
                effective_confining_stress_kpa: parseFloat(row.querySelector('.f-confining').value),
                peak_deviator_stress_kpa: parseFloat(row.querySelector('.f-deviator').value),
                secant_modulus_e50_mpa: parseFloat(row.querySelector('.f-e50').value)
            }))
        }
    };

    // Continuity Validation for Stratigraphy
    const strata = payload.properties.strata;
    if (strata.length > 0) {
        if (strata[0].top_m !== 0) {
            throw new Error(`Stratigraphy must begin at 0 m. The first layer begins at ${strata[0].top_m} m.`);
        }
        for (let i = 1; i < strata.length; i++) {
            if (strata[i].top_m !== strata[i - 1].bottom_m) {
                throw new Error(`Stratigraphy discontinuity detected! Layer ${i + 1} begins at ${strata[i].top_m} m, but the previous layer ended at ${strata[i - 1].bottom_m} m.`);
            }
        }
    }

    return payload;
}

document.getElementById('borelogForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.textContent = "Submitting...";

    try {
        const payload = gatherBorelogData();
        const API_BASE_URL = window.location.port === "8383" ? "http://localhost:8484/api" : "/api";
        const response = await fetch(`${API_BASE_URL}/borelog/stage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showToast(' ✔ Borelog successfully staged for approval!', false);
            document.getElementById('borelogForm').reset();
            // Clear arrays
            document.querySelectorAll('tbody').forEach(tbody => tbody.innerHTML = '');
            ['strata', 'spt', 'atterberg', 'shear', 'consolidation', 'triaxial', 'cpt'].forEach(type => {
                addRow(`${type}-body`);
            });
        } else {
            const errorText = await response.text();
            showToast(` ✘ Error: ${errorText}`, true);
        }
    } catch (error) {
        showToast(` ✘ Validation Error: ${error.message}`, true);
    } finally {
        btn.disabled = false;
        btn.textContent = "Submit Borelog for Approval";
    }
});


document.getElementById('preview-btn').addEventListener('click', () => {
    let data;
    try {
        data = gatherBorelogData();
    } catch (e) {
        alert("Validation Error: " + e.message);
        return;
    }
    
    document.getElementById('preview-modal').style.display = 'flex';
    if (window.renderBorelogChart) {
        window.renderBorelogChart('borelog-visualizer-container', data);
    } else {
        alert("Borelog visualizer engine is not loaded.");
    }

    // Wire up modal export buttons
    const btnXlsx = document.getElementById('export-xlsx-btn');
    const btnGraphic = document.getElementById('export-graphic-btn');

    if (btnXlsx) {
        btnXlsx.onclick = () => {
            if (window.exportBorelogToXLSX) window.exportBorelogToXLSX(data);
            else alert("Export engine not loaded.");
        };
    }

    if (btnGraphic) {
        btnGraphic.onclick = () => {
            if (window.downloadBorelogSVG) {
                window.downloadBorelogSVG(data);
            } else {
                alert("SVG exporter not loaded.");
            }
        };
    }
});


document.getElementById('upload-json').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            populateFormFromJson(data);
            showToast(" ✔ JSON loaded successfully!", false);
        } catch (err) {
            alert("Error parsing JSON: " + err.message);
            showToast(" ✘ Error loading JSON data", true)
        }
    };
    reader.readAsText(file);
});

// Auto-load staged JSON if provided in URL
window.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewStaged = urlParams.get('view_staged');
    if (viewStaged) {
        try {
            const API_BASE_URL_FOR_MAPS = window.location.port === "8383" ? "http://localhost:8484" : "";
            const response = await fetch(`${API_BASE_URL_FOR_MAPS}/maps/borelogs/staged/${viewStaged}`);
            if (response.ok) {
                const data = await response.json();
                populateFormFromJson(data);
                showToast("View mode: Loaded " + viewStaged, false);

                // Disable submit button in view mode
                const submitBtn = document.getElementById('submit-btn');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = "View Mode (Read Only)";
                    submitBtn.style.opacity = "0.5";
                }
            } else {
                showToast("Failed to load requested borelog.", true);
            }
        } catch (e) {
            console.error(e);
            showToast("Network error loading borelog.", true);
        }
    }
});

function populateFormFromJson(geoJson) {
    const props = geoJson.properties || geoJson;
    const coords = geoJson.geometry && geoJson.geometry.coordinates ? geoJson.geometry.coordinates : [0, 0];

    const setVal = (id, val) => { if (document.getElementById(id)) document.getElementById(id).value = val || ''; };

    setVal('borelog_id', props.borelog_id);
    let lat = coords[0];
    let lng = coords[1];

    // Safety fallback: if an older JSON with standard [Lng, Lat] is uploaded,
    // we swap them back based on Bangladesh coordinate norms (Lat ~23, Lng ~90)
    if (lat > lng) {
        lat = coords[1];
        lng = coords[0];
    }
    setVal('coordinates', `${lat}, ${lng}`);
    setVal('client', props.client);
    setVal('project', props.project);
    setVal('location', props.location);
    setVal('drilling_team', props.drilling_team);
    setVal('supervisor', props.supervisor);
    setVal('drill_rig', props.drill_rig);
    setVal('tbm_no', props.tbm_no);
    setVal('date_of_starting_boring', props.date_of_starting_boring || props.date_of_boring); // fallback if field changed
    setVal('date_of_ending_boring', props.date_of_ending_boring);
    setVal('rl_m', props.rl_m);
    setVal('depth_m', props.depth_m);
    setVal('water_table_m', props.water_table_m);
    setVal('comments', props.comments);

    // Clear existing tables
    ['strata', 'spt', 'atterberg', 'shear', 'consolidation', 'triaxial', 'cpt'].forEach(type => {
        document.getElementById(`${type}-body`).innerHTML = '';
    });

    // Fill tables
    const strataData = props.strata || props.stratigraphy;
    if (strataData) {
        strataData.forEach(s => {
            const tr = addRow('strata-body');
            tr.querySelector('.f-top').value = s.top_m !== undefined ? s.top_m : '';
            tr.querySelector('.f-bottom').value = s.bottom_m !== undefined ? s.bottom_m : '';
            tr.querySelector('.f-class').value = s.class || s.uscs_class || '';
            tr.querySelector('.f-desc').value = s.description || '';
        });
    }

    const sptDataList = props.spt_data || props.spt_records;
    if (sptDataList) {
        sptDataList.forEach(s => {
            const tr = addRow('spt-body');
            const inputs = tr.querySelectorAll('input');
            inputs[0].value = s.depth_m !== undefined ? s.depth_m : '';
            inputs[1].value = s.blows_0_150 !== undefined ? s.blows_0_150 : (s.blows_150 !== undefined ? s.blows_150 : '');
            inputs[2].value = s.blows_150_300 !== undefined ? s.blows_150_300 : (s.blows_300 !== undefined ? s.blows_300 : '');
            inputs[3].value = s.blows_300_450 !== undefined ? s.blows_300_450 : (s.blows_450 !== undefined ? s.blows_450 : '');
            inputs[4].value = s.n_value !== undefined ? s.n_value : '';
        });
    }

    const atterbergData = props.atterberg_test_data || props.atterberg_limits;
    if (atterbergData) {
        atterbergData.forEach(s => {
            const tr = addRow('atterberg-body');
            const inputs = tr.querySelectorAll('input');
            inputs[0].value = s.depth_m !== undefined ? s.depth_m : '';
            inputs[1].value = s.wl !== undefined ? s.wl : (s.liquid_limit !== undefined ? s.liquid_limit : '');
            inputs[2].value = s.wp !== undefined ? s.wp : (s.plastic_limit !== undefined ? s.plastic_limit : '');
            inputs[3].value = s.ip !== undefined ? s.ip : (s.plasticity_index !== undefined ? s.plasticity_index : '');
            inputs[4].value = s.li !== undefined ? s.li : (s.liquidity_index !== undefined ? s.liquidity_index : '');
        });
    }

    if (props.cpt_data) {
        props.cpt_data.forEach(s => {
            const tr = addRow('cpt-body');
            const inputs = tr.querySelectorAll('input');
            inputs[0].value = s.depth_m || '';
            inputs[1].value = s.qc_mpa || '';
            inputs[2].value = s.fs_kpa || '';
            inputs[3].value = s.rf_percent || '';
            inputs[4].value = s.u2_kpa || '';
        });
    }

    if (props.direct_shear_test_data) {
        props.direct_shear_test_data.forEach(s => {
            const tr = addRow('shear-body');
            const inputs = tr.querySelectorAll('input');
            inputs[0].value = s.depth_m || '';
            inputs[1].value = s.normal_stress_kpa || '';
            inputs[2].value = s.shear_stress_kpa || '';
            inputs[3].value = s.cohesion_kpa || '';
            inputs[4].value = s.friction_angle_deg || '';
        });
    }

    if (props.consolidation_test_data) {
        props.consolidation_test_data.forEach(s => {
            const tr = addRow('consolidation-body');
            const inputs = tr.querySelectorAll('input');
            inputs[0].value = s.depth_m || '';
            inputs[1].value = s.vertical_effective_stress_kpa || '';
            inputs[2].value = s.constrained_modulus_eoed_mpa || '';
            inputs[3].value = s.compression_index || '';
            inputs[4].value = s.recompression_index || '';
            inputs[5].value = s.preconsolidation_pressure_kpa || '';
        });
    }

    if (props.triaxial_test_data) {
        props.triaxial_test_data.forEach(s => {
            const tr = addRow('triaxial-body');
            const selects = tr.querySelectorAll('select');
            const inputs = tr.querySelectorAll('input');
            inputs[0].value = s.depth_m || '';
            if (selects.length > 0) selects[0].value = s.test_type || 'CD';
            inputs[1].value = s.effective_confining_stress_kpa || '';
            inputs[2].value = s.peak_deviator_stress_kpa || '';
            inputs[3].value = s.secant_modulus_e50_mpa || '';
        });
    }

    // Always append one empty row at the end of every table to act as the filler/entry row
    ['strata', 'spt', 'atterberg', 'shear', 'consolidation', 'triaxial', 'cpt'].forEach(type => {
        addRow(`${type}-body`);
    });
}


document.getElementById('upload-xlsx').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (typeof XLSX === 'undefined') {
        alert("SheetJS library is not loaded.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = new Uint8Array(ev.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Assume the first sheet has metadata
            const metaSheet = workbook.Sheets[workbook.SheetNames[0]];
            const metaJson = XLSX.utils.sheet_to_json(metaSheet);

            if (metaJson.length > 0) {
                // A very rough mapping, assuming column names match our props roughly
                // For a real production app, we would map exact templates
                const row = metaJson[0];
                const geoJsonStub = { properties: row, geometry: { coordinates: [row.Latitude || 0, row.Longitude || 0] } };

                // If there are other sheets, map them to tables
                workbook.SheetNames.forEach(sheetName => {
                    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
                    if (sheetName.toLowerCase().includes('strata')) geoJsonStub.properties.stratigraphy = sheetData;
                    if (sheetName.toLowerCase().includes('spt')) geoJsonStub.properties.spt_data = sheetData;
                    if (sheetName.toLowerCase().includes('cpt')) geoJsonStub.properties.cpt_data = sheetData;

                    // (Expand for others as needed)
                });

                populateFormFromJson(geoJsonStub);
                showToast(" ✔ XLSX loaded successfully!", false);
            }
        } catch (err) {
            alert("Error parsing XLSX: " + err.message);
            showToast(" ✘ Error loading XLSX data", true)
        }
    };
    reader.readAsArrayBuffer(file);
});


// Auto-spawn new row when typing in the last row
document.addEventListener('input', (e) => {
    const target = e.target;
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT') {
        const tr = target.closest('tr');
        if (!tr) return;
        const tbody = tr.closest('tbody');
        if (!tbody) return;

        // If this is the last row in the table, spawn a new one!
        if (tr === tbody.lastElementChild) {
            window.addRow(tbody.id);
        }
    }
});

// Add input validation for depth values
document.addEventListener('change', (e) => {
    const target = e.target;

    if (target.tagName === 'INPUT' && target.type === 'number') {
        // Prevent negative depths globally
        if (target.classList.contains('f-depth') || target.classList.contains('f-top') || target.classList.contains('f-bottom')) {
            if (parseFloat(target.value) < 0) {
                showToast("Depth cannot be negative.", true);
                target.value = "0";
            }
        }

        const tr = target.closest('tr');
        if (!tr) return;
        const tbody = tr.closest('tbody');
        if (!tbody) return;

        const type = tbody.dataset.type;
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const index = rows.indexOf(tr);

        if (type === 'strata') {
            if (target.classList.contains('f-top')) {
                if (index > 0) {
                    const prevRow = rows[index - 1];
                    const prevBottom = parseFloat(prevRow.querySelector('.f-bottom').value);
                    const currentTop = parseFloat(target.value);
                    if (!isNaN(prevBottom) && !isNaN(currentTop) && currentTop < prevBottom) {
                        showToast(`Top depth cannot be lower than previous bottom depth (${prevBottom}m)`, true);
                        target.value = prevBottom;
                    }
                }
                const currentBottom = parseFloat(tr.querySelector('.f-bottom').value);
                const currentTop = parseFloat(target.value);
                if (!isNaN(currentBottom) && !isNaN(currentTop) && currentTop > currentBottom) {
                    showToast(`Top depth cannot be greater than bottom depth (${currentBottom}m)`, true);
                    target.value = currentBottom;
                }
            } else if (target.classList.contains('f-bottom')) {
                const currentTop = parseFloat(tr.querySelector('.f-top').value);
                const currentBottom = parseFloat(target.value);
                if (!isNaN(currentTop) && !isNaN(currentBottom) && currentBottom < currentTop) {
                    showToast(`Bottom depth cannot be lower than top depth (${currentTop}m)`, true);
                    target.value = currentTop;
                }

                if (index < rows.length - 1) {
                    const nextRow = rows[index + 1];
                    const nextTopInput = nextRow.querySelector('.f-top');
                    if (!nextTopInput.value || parseFloat(nextTopInput.value) < currentBottom) {
                        nextTopInput.value = currentBottom;
                    }
                }
            }
        } else {
            if (target.classList.contains('f-depth')) {
                if (index > 0) {
                    const prevRow = rows[index - 1];
                    const prevDepth = parseFloat(prevRow.querySelector('.f-depth').value);
                    const currentDepth = parseFloat(target.value);
                    if (!isNaN(prevDepth) && !isNaN(currentDepth) && currentDepth < prevDepth) {
                        showToast(`Depth cannot be lower than previous row's depth (${prevDepth}m)`, true);
                        target.value = prevDepth;
                    }
                }
            }
        }
    }
});
