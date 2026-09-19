/**
 * Borelog Form Logic
 * Handles dynamic table rows, coordinate parsing, and API submission.
 */

const getRowHTML = (type) => {
    switch (type) {
        case 'strata':
            return `
                <td><input type="number" class="f-stratum" placeholder="e.g. 1" required></td>
                <td><input type="number" step="0.01" class="f-top" required></td>
                <td><input type="number" step="0.01" class="f-bottom" required></td>
                <td><input type="text" class="f-class" placeholder="e.g. SM" required></td>
                <td><input type="text" class="f-desc" placeholder="Soil description" required></td>
                <td><button type="button" class="del-btn" onclick="deleteRow(this)" title="Delete Row">✕</button></td>
            `;
        case 'spt':
            return `
                <td><input type="number" step="0.01" class="f-depth" required></td>
                <td><input type="number" class="f-b150" required></td>
                <td><input type="number" class="f-b300" required></td>
                <td><input type="number" class="f-b450" required></td>
                <td><input type="text" class="f-nval" required></td>
                <td><button type="button" class="del-btn" onclick="deleteRow(this)" title="Delete Row">✕</button></td>
            `;
        case 'atterberg':
            return `
                <td><input type="number" step="0.01" class="f-depth" required></td>
                <td><input type="number" step="0.01" class="f-wl" required></td>
                <td><input type="number" step="0.01" class="f-wp" required></td>
                <td><input type="number" step="0.01" class="f-ip" required></td>
                <td><input type="number" step="0.01" class="f-li" required></td>
                <td><button type="button" class="del-btn" onclick="deleteRow(this)" title="Delete Row">✕</button></td>
            `;
        case 'cpt':
            return `
                <td><input type="number" step="0.01" class="f-depth" required></td>
                <td><input type="number" step="0.01" class="f-qc" required></td>
                <td><input type="number" step="0.01" class="f-fs" required></td>
                <td><input type="number" step="0.01" class="f-rf" required></td>
                <td><input type="number" step="0.01" class="f-u2"></td>
                <td><button type="button" class="del-btn" onclick="deleteRow(this)" title="Delete Row">×</button></td>
            `;
        case 'shear':
            return `
                <td><input type="number" step="0.01" class="f-depth" required></td>
                <td><input type="number" step="0.01" class="f-normal" required></td>
                <td><input type="number" step="0.01" class="f-shear" required></td>
                <td><input type="number" step="0.01" class="f-cohesion" required></td>
                <td><input type="number" step="0.01" class="f-friction" required></td>
                <td><button type="button" class="del-btn" onclick="deleteRow(this)" title="Delete Row">✕</button></td>
            `;
        case 'consolidation':
            return `
                <td><input type="number" step="0.01" class="f-depth" required></td>
                <td><input type="number" step="0.01" class="f-void" required></td>
                <td><input type="number" step="0.01" class="f-coeff" required></td>
                <td><button type="button" class="del-btn" onclick="deleteRow(this)" title="Delete Row">✕</button></td>
            `;
        case 'odeometric':
            return `
                <td><input type="number" step="0.01" class="f-depth" required></td>
                <td><input type="number" step="0.01" class="f-ivoid" required></td>
                <td><input type="number" step="0.01" class="f-fvoid" required></td>
                <td><input type="number" step="0.01" class="f-comp" required></td>
                <td><button type="button" class="del-btn" onclick="deleteRow(this)" title="Delete Row">✕</button></td>
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
    return tr;
};

window.deleteRow = (btn) => {
    btn.closest('tr').remove();
};

const showToast = (message, isError = false) => {
    const toast = document.getElementById('status-toast');
    toast.textContent = message;
    toast.style.background = isError ? "var(--danger)" : "var(--primary)";
    toast.classList.add('visible');
    setTimeout(() => {
        toast.classList.remove('visible');
    }, 4000);
};

// Initialize with one row each
window.onload = () => {
    addRow('strata-body');
    addRow('spt-body');
    addRow('cpt-body');
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
                
                strata: Array.from(document.querySelectorAll('#strata-body tr')).map(row => ({
                    stratum: parseInt(row.querySelector('.f-stratum').value),
                    top_m: parseFloat(row.querySelector('.f-top').value),
                    bottom_m: parseFloat(row.querySelector('.f-bottom').value),
                    class: row.querySelector('.f-class').value,
                    description: row.querySelector('.f-desc').value
                })),
                
                spt_data: Array.from(document.querySelectorAll('#spt-body tr')).map(row => ({
                    depth_m: parseFloat(row.querySelector('.f-depth').value),
                    blows_0_150: parseInt(row.querySelector('.f-b150').value),
                    blows_150_300: parseInt(row.querySelector('.f-b300').value),
                    blows_300_450: parseInt(row.querySelector('.f-b450').value),
                    n_value: row.querySelector('.f-nval').value
                })),
                
                atterberg_test_data: Array.from(document.querySelectorAll('#atterberg-body tr')).map(row => ({
                    depth_m: parseFloat(row.querySelector('.f-depth').value),
                    wl: parseFloat(row.querySelector('.f-wl').value),
                    wp: parseFloat(row.querySelector('.f-wp').value),
                    ip: parseFloat(row.querySelector('.f-ip').value),
                    li: parseFloat(row.querySelector('.f-li').value)
                })),
                
                cpt_data: Array.from(document.querySelectorAll('#cpt-body tr')).map(row => ({
                    depth_m: parseFloat(row.querySelector('.f-depth').value),
                    qc_mpa: parseFloat(row.querySelector('.f-qc').value),
                    fs_kpa: parseFloat(row.querySelector('.f-fs').value),
                    rf_percent: parseFloat(row.querySelector('.f-rf').value),
                    u2_kpa: row.querySelector('.f-u2').value ? parseFloat(row.querySelector('.f-u2').value) : null
                })),
                
                direct_shear_test_data: Array.from(document.querySelectorAll('#shear-body tr')).map(row => ({
                    depth_m: parseFloat(row.querySelector('.f-depth').value),
                    normal_stress_kpa: parseFloat(row.querySelector('.f-normal').value),
                    shear_stress_kpa: parseFloat(row.querySelector('.f-shear').value),
                    cohesion_kpa: parseFloat(row.querySelector('.f-cohesion').value),
                    friction_angle_deg: parseFloat(row.querySelector('.f-friction').value)
                })),
                
                consolidation_test_data: Array.from(document.querySelectorAll('#consolidation-body tr')).map(row => ({
                    depth_m: parseFloat(row.querySelector('.f-depth').value),
                    void_ratio: parseFloat(row.querySelector('.f-void').value),
                    coefficient_of_consolidation_m2_per_year: parseFloat(row.querySelector('.f-coeff').value)
                })),
                
                odeometric_test_data: Array.from(document.querySelectorAll('#odeometric-body tr')).map(row => ({
                    depth_m: parseFloat(row.querySelector('.f-depth').value),
                    initial_void_ratio: parseFloat(row.querySelector('.f-ivoid').value),
                    final_void_ratio: parseFloat(row.querySelector('.f-fvoid').value),
                    compression_index: parseFloat(row.querySelector('.f-comp').value)
                }))
            }
        };
}

document.getElementById('borelogForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.textContent = "Submitting...";

    try {
        const payload = gatherBorelogData();
        const response = await fetch('http://127.0.0.1:8000/api/borelog/stage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showToast('✅ Borelog successfully staged for approval!');
            document.getElementById('borelogForm').reset();
            // Clear arrays
            document.querySelectorAll('tbody').forEach(tbody => tbody.innerHTML = '');
            addRow('strata-body');
            addRow('spt-body');
            addRow('cpt-body');
        } else {
            const errorText = await response.text();
            showToast(`❌ Error: ${errorText}`, true);
        }
    } catch (error) {
        showToast(`❌ Validation Error: ${error.message}`, true);
    } finally {
        btn.disabled = false;
        btn.textContent = "Submit Borelog for Approval";
    }
});


document.getElementById('preview-btn').addEventListener('click', () => {
    const data = gatherBorelogData();
    document.getElementById('preview-modal').style.display = 'flex';
    if (window.renderBorelogChart) {
        window.renderBorelogChart('borelog-plotly-chart', data);
    } else {
        alert("Borelog visualizer engine is not loaded.");
    }
    
    // Wire up modal export buttons
    const btnXlsx = document.getElementById('modal-export-xlsx');
    const btnGraphic = document.getElementById('modal-export-graphic');
    
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
            showToast("JSON loaded successfully!", "success");
        } catch(err) {
            alert("Error parsing JSON: " + err.message);
        }
    };
    reader.readAsText(file);
});

function populateFormFromJson(geoJson) {
    const props = geoJson.properties || geoJson;
    const coords = geoJson.geometry && geoJson.geometry.coordinates ? geoJson.geometry.coordinates : [0,0];
    
    const setVal = (id, val) => { if(document.getElementById(id)) document.getElementById(id).value = val || ''; };
    
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
    ['strata', 'spt', 'atterberg', 'shear', 'consolidation', 'odeometric', 'cpt'].forEach(type => {
        document.getElementById(`${type}-body`).innerHTML = '';
    });
    
    // Fill tables
    const strataData = props.strata || props.stratigraphy;
    if (strataData) {
        strataData.forEach(s => {
            const tr = addRow('strata-body');
            const inputs = tr.querySelectorAll('input');
            inputs[0].value = s.stratum !== undefined ? s.stratum : '';
            inputs[1].value = s.top_m !== undefined ? s.top_m : '';
            inputs[2].value = s.bottom_m !== undefined ? s.bottom_m : '';
            inputs[3].value = s.class || s.uscs_class || '';
            inputs[4].value = s.description || '';
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
            inputs[1].value = s.void_ratio || '';
            inputs[2].value = s.cv_m2_yr || '';
        });
    }
    
    if (props.odeometric_test_data) {
        props.odeometric_test_data.forEach(s => {
            const tr = addRow('odeometric-body');
            const inputs = tr.querySelectorAll('input');
            inputs[0].value = s.depth_m || '';
            inputs[1].value = s.initial_void_ratio || '';
            inputs[2].value = s.final_void_ratio || '';
            inputs[3].value = s.compression_index || '';
        });
    }
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
            const workbook = XLSX.read(data, {type: 'array'});
            
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
                showToast("XLSX loaded successfully!", "success");
            }
        } catch(err) {
            alert("Error parsing XLSX: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
});
