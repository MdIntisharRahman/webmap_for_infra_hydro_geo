/**
 * Borelog Form Logic
 * Handles dynamic table rows, coordinate parsing, and API submission.
 */

const getRowHTML = (type) => {
    switch (type) {
        case 'strata':
            return `
                <td data-label="Top (m)"><input required type="number" step="any" class="f-top"></td>
                <td data-label="Bottom (m)"><input required type="number" step="any" class="f-bottom"></td>
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
                    <div class="action-pill"> 
                        <button type="button" class="insert-btn" onclick="insertRowAfter(this)" title="Insert Row Below">🞣</button>
                        <button type="button" class="del-btn" onclick="deleteRow(this)" title="Delete Row">𐩃</button>
                    </div>
                </td>
            `;
        case 'spt':
            return `
                <td data-label="Depth (m)"><input required type="number" step="any" class="f-depth"></td>
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
                <td data-label="Depth (m)"><input type="number" step="any" class="f-depth" required></td>
                <td data-label="G"><input type="number" step="0.001" class="f-gr"></td>
                <td data-label="WC (%)"><input type="number" step="0.01" class="f-wc" ></td>
                <td data-label="LL (%)"><input type="number" step="0.01" class="f-ll" ></td>
                <td data-label="PL (%)"><input type="number" step="0.01" class="f-pl" ></td>
                <td data-label="PI"><input type="number" step="0.001" class="f-pi"></td>
                <td data-label="LI"><input type="number" step="0.001" class="f-li"></td>
                <td data-label="Actions" class="action-pill-td">
                    <span class="empty-table-row-filler" title="Type into any field to begin"><img src="resources/images/enter-svgrepo.svg"></span>
                    <div class="action-pill">                    
                        <button type="button" class="insert-btn" onclick="insertRowAfter(this)" title="Insert Row Below">🞣</button>
                        <button type="button" class="del-btn" onclick="deleteRow(this)" title="Delete Row">𐩃</button>
                    </div>
                </td>
            `;
        case 'grain_size':
            return `
                <td data-label="Depth (m)"><input type="number" step="any" class="f-depth" required></td>
                <td data-label="Sand (%)"><input type="number" step="0.01" class="f-sand" required></td>
                <td data-label="Silt (%)"><input type="number" step="0.01" class="f-silt" required></td>
                <td data-label="Clay (%)"><input type="number" step="0.01" class="f-clay" required></td>
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
                <td data-label="Depth (m)"><input required aria-required="true" type="number" step="any" class="f-depth"></td>
                <td data-label="qc (MPa)"><input required aria-required="true" type="number" step="any" class="f-qc"></td>
                <td data-label="fs (kPa)"><input type="number" step="any" class="f-fs"></td>
                <td data-label="Rf (%)"><input required aria-required="true" type="number" step="any" class="f-rf"></td>
                <td data-label="u2 (kPa)"><input required aria-required="true" type="number" step="any" class="f-u2"></td>
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
                <td data-label="Depth (m)"><input required aria-required="true" type="number" step="any" class="f-depth"></td>
                <td data-label="Normal Stress (kPa)"><input required aria-required="true" type="number" step="any" class="f-normal"></td>
                <td data-label="Shear Stress (kPa)"><input required aria-required="true" type="number" step="any" class="f-shear"></td>
                <td data-label="Cohesion (kPa)"><input required aria-required="true" type="number" step="any" class="f-cohesion"></td>
                <td data-label="Fric. Angle (deg)"><input required aria-required="true" type="number" step="any" class="f-friction"></td>
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
                <td data-label="Depth (m)"><input required type="number" step="any" class="f-depth"></td>
                <td data-label="Type">
                    <select required class="f-type" style="padding: 11px; border: 1px solid var(--border-color); width: 100%;">
                        <option value="" disabled selected>Type</option>
                        <option value="CD">CD</option>
                        <option value="CU">CU</option>
                        <option value="UU">UU</option>
                    </select>
                </td>
                <td data-label="Confining Stress σ'₃ (kPa)"><input required type="number" step="any" class="f-confining"></td>
                <td data-label="Peak Deviator Stress q_f (kPa)"><input required type="number" step="any" class="f-deviator"></td>
                <td data-label="Secant Modulus E₅₀ (MPa)"><input required type="number" step="any" class="f-e50"></td>
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
                <td data-label="Depth (m)"><input required type="number" step="any" class="f-depth"></td>
                <td data-label="Eff. Stress σ'v  (kPa)"><input required type="number" step="any" class="f-stress"></td>
                <td data-label="Constrained Modulus E_oed (MPa)"><input required type="number" step="any" class="f-eoed"></td>
                <td data-label="Comp. Index (C_c)"><input required type="number" step="any" class="f-cc"></td>
                <td data-label="Recomp. Index (C_r)"><input required type="number" step="any" class="f-cr"></td>
                <td data-label="Precons. Pressure (kPa)"><input required type="number" step="any" class="f-pc"></td>
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
    tr.classList.add('new-row');
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

    // Remove class after animation to clean up DOM
    setTimeout(() => tr.classList.remove('new-row'), 400);

    return tr;
};

window.deleteRow = (btn) => {
    const tr = btn.closest('tr');
    tr.classList.add('removing-row');
    setTimeout(() => tr.remove(), 200);
};

window.insertRowAfter = (btn) => {
    const currentRow = btn.closest('tr');
    const tbody = currentRow.closest('tbody');
    const type = tbody.dataset.type;
    const tr = document.createElement('tr');
    tr.classList.add('new-row');
    tr.innerHTML = getRowHTML(type);
    currentRow.insertAdjacentElement('afterend', tr);

    setTimeout(() => tr.classList.remove('new-row'), 400);

    if (type === 'strata') {
        const prevBottom = currentRow.querySelector('.f-bottom').value;
        if (prevBottom) {
            tr.querySelector('.f-top').value = prevBottom;
        }
    }

    return tr;
};

let toastTimeout = null;
const showToast = (message, isError = false, timeoutMs = null) => {
    const toast = document.getElementById('status-toast');
    if (!toast) return;
    toast.innerHTML = message;

    // Reset classes
    toast.className = '';

    // Apply correct theme class
    toast.classList.add(isError ? 'toast-error' : 'toast-success');

    // Trigger animation
    toast.classList.add('visible');

    // Allow clicking the toast to dismiss immediately
    toast.onclick = () => {
        toast.classList.remove('visible');
    };

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('visible');
    }, timeoutMs || (isError ? 10000 : 4000));
};

// Initialize with one row each
window.onload = () => {
    ['strata', 'spt', 'atterberg', 'grain_size', 'shear', 'consolidation', 'triaxial', 'cpt'].forEach(type => {
        addRow(`${type}-body`);
    });
};

const parseNum = (val) => val ? parseFloat(val) : null;
const parseIntSafe = (val) => val ? parseInt(val, 10) : null;

// Parse coordinates string "lat, lng" safely
const parseCoordinates = (coordString) => {
    if (!coordString || typeof coordString !== 'string') return [NaN, NaN];
    const parts = coordString.split(',').map(s => s.trim());
    if (parts.length !== 2) return [NaN, NaN];
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    return [lat, lng];
};

function validateGeotechnicalRules(payload) {
    const errors = [];
    const props = payload.properties || {};
    const coords = (payload.geometry && payload.geometry.coordinates) ? payload.geometry.coordinates : [NaN, NaN];
    const lat = Number(coords[0]);
    const lng = Number(coords[1]);

    // 1. Mandatory Metadata Checks
    const borelogName = (props.borelog_name || "").trim();
    if (!borelogName) {
        errors.push("Borelog Name is required.");
    }

    const engTeam = ((props.engineering_team || props.drilling_team) || "").trim();
    if (!engTeam) {
        errors.push("Engineering Team (or Drilling Team) is required.");
    }

    const location = (props.location || "").trim();
    if (!location) {
        errors.push("Location is required.");
    }

    const dateStart = (props.date_of_starting_boring || "").trim();
    if (!dateStart) {
        errors.push("Date of Starting Boring is required.");
    }

    const dateEnd = (props.date_of_ending_boring || "").trim();
    if (dateStart && dateEnd) {
        const dStart = new Date(dateStart);
        const dEnd = new Date(dateEnd);
        if (!isNaN(dStart.getTime()) && !isNaN(dEnd.getTime()) && dEnd < dStart) {
            errors.push(`Date of Completion (${dateEnd}) cannot be earlier than Date of Starting (${dateStart}).`);
        }
    }

    // Coordinates check
    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
        errors.push("Valid borehole Coordinates (Latitude, Longitude) must be specified.");
    } else {
        if (lat < -90 || lat > 90) {
            errors.push(`Latitude (${lat}) must be between -90 and 90 degrees.`);
        }
        if (lng < -180 || lng > 180) {
            errors.push(`Longitude (${lng}) must be between -180 and 180 degrees.`);
        }
    }

    // Reduced Level (RL) check (can be negative or positive elevation)
    const rl = props.rl_m;
    if (rl === null || rl === undefined || isNaN(rl)) {
        errors.push("Reduced Level (RL in m) must be specified as a valid numeric elevation.");
    }

    // Total Depth check (strictly positive)
    const totalDepth = props.depth_m;
    if (totalDepth === null || totalDepth === undefined || isNaN(totalDepth) || totalDepth <= 0) {
        errors.push("Total Borehole Depth (m) must be specified and strictly greater than 0.");
    }

    // Water Table Depth check (non-negative)
    const wt = props.water_table_m;
    if (wt !== null && wt !== undefined && !isNaN(wt) && wt < 0) {
        errors.push(`Water Table Depth (${wt} m) cannot be negative.`);
    }

    // 2. Sounding / Geotechnical Minimum Existence Rule:
    // Stratigraphy must be present together with EITHER SPT or CPT data
    const strata = Array.isArray(props.strata) ? props.strata : [];
    const spt = Array.isArray(props.spt_data) ? props.spt_data : [];
    const cpt = Array.isArray(props.cpt_data) ? props.cpt_data : [];

    if (strata.length === 0) {
        errors.push("At least one Stratigraphy layer must be provided.");
    }

    if (spt.length === 0 && cpt.length === 0) {
        errors.push("Sounding data missing: At least one in-situ sounding test (SPT or CPT data) must be provided alongside Stratigraphy.");
    }

    // Helper for non-negativity across numeric test fields
    const checkNonNegative = (val, fieldName, context) => {
        if (val !== null && val !== undefined && !isNaN(val) && val < 0) {
            errors.push(`${context}: ${fieldName} (${val}) cannot be negative.`);
        }
    };

    // Helper for depth exceeding borehole total depth
    const checkDepth = (depth, context) => {
        if (depth !== null && depth !== undefined && !isNaN(depth)) {
            if (depth < 0) {
                errors.push(`${context}: Depth (${depth} m) cannot be negative.`);
            } else if (totalDepth > 0 && depth > totalDepth + 0.05) {
                errors.push(`${context}: Depth (${depth} m) exceeds total borehole depth (${totalDepth} m).`);
            }
        }
    };

    // 3. Stratigraphy Integrity Rules
    if (strata.length > 0) {
        if (Math.abs(strata[0].top_m - 0) > 0.001) {
            errors.push(`Stratigraphy must begin at ground surface (0.0 m). First layer starts at ${strata[0].top_m} m.`);
        }
        for (let i = 0; i < strata.length; i++) {
            const layer = strata[i];
            const layerNum = i + 1;
            if (isNaN(layer.top_m) || isNaN(layer.bottom_m)) {
                errors.push(`Stratigraphy Layer ${layerNum}: Top and Bottom depths must be numeric.`);
                continue;
            }
            if (layer.bottom_m <= layer.top_m) {
                errors.push(`Stratigraphy Layer ${layerNum}: Bottom depth (${layer.bottom_m} m) must be strictly greater than top depth (${layer.top_m} m).`);
            }
            if (totalDepth > 0 && layer.bottom_m > totalDepth + 0.05) {
                errors.push(`Stratigraphy Layer ${layerNum}: Bottom depth (${layer.bottom_m} m) exceeds total borehole depth (${totalDepth} m).`);
            }
            if (i > 0) {
                const prevBottom = strata[i - 1].bottom_m;
                if (Math.abs(layer.top_m - prevBottom) > 0.01) {
                    errors.push(`Stratigraphy discontinuity: Layer ${layerNum} starts at ${layer.top_m} m, but Layer ${layerNum - 1} ends at ${prevBottom} m.`);
                }
            }
        }
    }

    // 4. SPT Data Validation
    spt.forEach((row, idx) => {
        const rowNum = idx + 1;
        const ctx = `SPT Row ${rowNum}`;
        checkDepth(row.depth_m, ctx);
        checkNonNegative(row.blows_0_150, "Blows (0-150mm)", ctx);
        checkNonNegative(row.blows_150_300, "Blows (150-300mm)", ctx);
        checkNonNegative(row.blows_300_450, "Blows (300-450mm)", ctx);
        if (row.n_value !== undefined && row.n_value !== null && row.n_value !== "") {
            const nVal = parseFloat(row.n_value);
            if (!isNaN(nVal) && nVal < 0) {
                errors.push(`${ctx}: N-value (${row.n_value}) cannot be negative.`);
            }
        }
    });

    // 5. Atterberg Limits Validation
    const atterberg = Array.isArray(props.atterberg_test_data) ? props.atterberg_test_data : [];
    atterberg.forEach((row, idx) => {
        const rowNum = idx + 1;
        const ctx = `Atterberg Limits Row ${rowNum}`;
        checkDepth(row.depth_m, ctx);
        const gr = row.gr !== undefined ? row.gr : (row.g !== undefined ? row.g : row.specific_gravity);
        checkNonNegative(gr, "Specific Gravity", ctx);
        checkNonNegative(row.wc, "Water Content", ctx);
        checkNonNegative(row.ll, "Liquid Limit", ctx);
        checkNonNegative(row.pl, "Plastic Limit", ctx);

        // Liquid Limit strictly greater than Plastic Limit (LL > PL)
        const ll = row.ll;
        const pl = row.pl;

        if (ll !== null && ll !== undefined && !isNaN(ll) &&
            pl !== null && pl !== undefined && !isNaN(pl)) {
            if (ll > 0 || pl > 0) {
                if (ll <= pl) {
                    errors.push(`${ctx}: Liquid Limit (${ll}%) must be strictly greater than Plastic Limit (${pl}%).`);
                }
            }
        }
    });

    // 6. Grain Size Analysis Validation
    const grainSize = Array.isArray(props.grain_size_analysis_data) ? props.grain_size_analysis_data : [];
    grainSize.forEach((row, idx) => {
        const rowNum = idx + 1;
        const ctx = `Grain Size Row ${rowNum}`;
        checkDepth(row.depth_m, ctx);
        checkNonNegative(row.sand, "Sand %", ctx);
        checkNonNegative(row.silt, "Silt %", ctx);
        checkNonNegative(row.clay, "Clay %", ctx);

        const sand = row.sand || 0;
        const silt = row.silt || 0;
        const clay = row.clay || 0;
        if (sand > 100 || silt > 100 || clay > 100) {
            errors.push(`${ctx}: Individual particle fractions cannot exceed 100%.`);
        }
        if (sand + silt + clay > 105) {
            errors.push(`${ctx}: Sum of fractions (${(sand + silt + clay).toFixed(1)}%) exceeds 100%.`);
        }
    });

    // 7. CPT Data Validation
    cpt.forEach((row, idx) => {
        const rowNum = idx + 1;
        const ctx = `CPT Row ${rowNum}`;
        checkDepth(row.depth_m, ctx);
        checkNonNegative(row.qc_mpa, "Tip Resistance qc", ctx);
        checkNonNegative(row.fs_kpa, "Sleeve Friction fs", ctx);
        checkNonNegative(row.rf_percent, "Friction Ratio Rf", ctx);
    });

    // 8. Direct Shear Test Validation
    const shear = Array.isArray(props.direct_shear_test_data) ? props.direct_shear_test_data : [];
    shear.forEach((row, idx) => {
        const rowNum = idx + 1;
        const ctx = `Direct Shear Row ${rowNum}`;
        checkDepth(row.depth_m, ctx);
        checkNonNegative(row.normal_stress_kpa, "Normal Stress", ctx);
        checkNonNegative(row.shear_stress_kpa, "Shear Stress", ctx);
        checkNonNegative(row.cohesion_kpa, "Cohesion c", ctx);
        checkNonNegative(row.friction_angle_deg, "Friction Angle φ", ctx);
        if (row.friction_angle_deg !== null && !isNaN(row.friction_angle_deg) && row.friction_angle_deg > 90) {
            errors.push(`${ctx}: Friction angle (${row.friction_angle_deg}°) cannot exceed 90°.`);
        }
    });

    // 9. 1-D Consolidation Test Validation
    const consolidation = Array.isArray(props.consolidation_test_data) ? props.consolidation_test_data : [];
    consolidation.forEach((row, idx) => {
        const rowNum = idx + 1;
        const ctx = `Consolidation Row ${rowNum}`;
        checkDepth(row.depth_m, ctx);
        checkNonNegative(row.vertical_effective_stress_kpa, "Vertical Effective Stress", ctx);
        checkNonNegative(row.constrained_modulus_eoed_mpa, "Constrained Modulus", ctx);
        checkNonNegative(row.compression_index, "Compression Index Cc", ctx);
        checkNonNegative(row.recompression_index, "Recompression Index Cr", ctx);
        checkNonNegative(row.preconsolidation_pressure_kpa, "Preconsolidation Pressure", ctx);

        // Recompression Index strictly less than Compression Index (Cr < Cc)
        const cc = row.compression_index;
        const cr = row.recompression_index;
        if (cc !== null && cc !== undefined && !isNaN(cc) &&
            cr !== null && cr !== undefined && !isNaN(cr)) {
            if (cc > 0 && cr > 0) {
                if (cr >= cc) {
                    errors.push(`${ctx}: Recompression Index Cr (${cr}) must be strictly less than Compression Index Cc (${cc}).`);
                }
            }
        }
    });

    // 10. Triaxial Test Validation
    const triaxial = Array.isArray(props.triaxial_test_data) ? props.triaxial_test_data : [];
    triaxial.forEach((row, idx) => {
        const rowNum = idx + 1;
        const ctx = `Triaxial Row ${rowNum}`;
        checkDepth(row.depth_m, ctx);
        checkNonNegative(row.effective_confining_stress_kpa, "Confining Stress", ctx);
        checkNonNegative(row.peak_deviator_stress_kpa, "Deviator Stress", ctx);
        checkNonNegative(row.secant_modulus_e50_mpa, "Secant Modulus E50", ctx);
    });

    return errors;
}

function gatherBorelogData() {
    const coordRaw = document.getElementById('coordinates').value || "0,0";
    const [lat, lng] = parseCoordinates(coordRaw);

    const payload = {
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [lat, lng]
        },
        properties: {
            borelog_name: document.getElementById('borelog_name').value,
            client: document.getElementById('client').value,
            project: document.getElementById('project').value,
            location: document.getElementById('location').value,
            engineering_team: (document.getElementById('engineering_team') || document.getElementById('drilling_team'))?.value || "",
            drilling_team: (document.getElementById('engineering_team') || document.getElementById('drilling_team'))?.value || "",
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

            atterberg_test_data: Array.from(document.querySelectorAll('#atterberg-body tr')).filter(row => row.querySelector('.f-depth').value.trim() !== '').map(row => {
                const depth_m = parseNum(row.querySelector('.f-depth')?.value);
                const gr = parseNum(row.querySelector('.f-gr')?.value);
                const wc = parseNum(row.querySelector('.f-wc')?.value);
                const ll = parseNum(row.querySelector('.f-ll')?.value);
                const pl = parseNum(row.querySelector('.f-pl')?.value);
                return { depth_m, gr, wc, ll, pl };
            }),

            grain_size_analysis_data: Array.from(document.querySelectorAll('#grain_size-body tr')).filter(row => row.querySelector('.f-depth').value.trim() !== '').map(row => ({
                depth_m: parseFloat(row.querySelector('.f-depth').value),
                sand: parseFloat(row.querySelector('.f-sand').value),
                silt: parseFloat(row.querySelector('.f-silt').value),
                clay: parseFloat(row.querySelector('.f-clay').value)
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

    // Run Geotechnical & Integrity Validations
    const errors = validateGeotechnicalRules(payload);
    if (errors.length > 0) {
        const errorHtml = `<strong> ✘ Geotechnical Validation Failed (${errors.length} issue${errors.length > 1 ? 's' : ''}):</strong><ul style="margin: 6px 0 0 18px; padding: 0; text-align: left;">` +
            errors.map(err => `<li>${err}</li>`).join('') + `</ul>`;
        const err = new Error(errors.join('\n'));
        err.htmlMessage = errorHtml;
        err.validationErrors = errors;
        throw err;
    }

    return payload;
}

// Ignore completely empty rows during native HTML5 validation
function validateFormIgnoringEmptyRows() {
    const form = document.getElementById('borelogForm');
    const emptyInputs = [];

    document.querySelectorAll('tbody[data-type]').forEach(tbody => {
        const type = tbody.dataset.type;
        tbody.querySelectorAll('tr').forEach(row => {
            const inputs = Array.from(row.querySelectorAll('input, select'));

            let isEmpty = true;
            if (type === 'strata') {
                // Ignore the auto-filled Top (m) when checking if strata row is completely empty
                const checkInputs = Array.from(row.querySelectorAll('.f-bottom, .f-class, .f-desc'));
                isEmpty = checkInputs.every(input => {
                    if (input.tagName === 'SELECT') return input.value === '';
                    return input.value.trim() === '';
                });
            } else {
                isEmpty = inputs.every(input => {
                    if (input.tagName === 'SELECT') return input.value === '';
                    return input.value.trim() === '';
                });
            }

            if (isEmpty) {
                inputs.forEach(input => {
                    if (input.hasAttribute('required')) {
                        input.removeAttribute('required');
                        emptyInputs.push(input);
                    }
                });
            }
        });
    });

    const isValid = form.reportValidity();

    // Restore required attributes shortly after native validation completes
    setTimeout(() => {
        emptyInputs.forEach(input => input.setAttribute('required', 'true'));
    }, 10);

    return isValid;
}

document.getElementById('submit-btn').addEventListener('click', (e) => {
    if (!validateFormIgnoringEmptyRows()) {
        e.preventDefault(); // Stop submission if invalid
    }
});

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
            showToast(' ✔ Borelog successfully staged for approval!', false, 5000);
            document.getElementById('borelogForm').reset();
            // Clear arrays
            document.querySelectorAll('tbody').forEach(tbody => tbody.innerHTML = '');
            ['strata', 'spt', 'atterberg', 'grain_size', 'shear', 'consolidation', 'triaxial', 'cpt'].forEach(type => {
                addRow(`${type}-body`);
            });
        } else {
            let errorText = await response.text();
            try {
                const parsed = JSON.parse(errorText);
                if (Array.isArray(parsed.detail)) {
                    errorText = `<ul style="margin:4px 0 0 16px; padding:0; text-align:left;">` +
                        parsed.detail.map(d => `<li>${d}</li>`).join('') + `</ul>`;
                } else if (parsed.detail) {
                    errorText = parsed.detail;
                }
            } catch (_) { }
            showToast(`<strong> ✘ Submission Rejected:</strong><br>${errorText}`, true, 12000);
        }
    } catch (error) {
        if (error.htmlMessage) {
            showToast(error.htmlMessage, true, 12000);
        } else {
            showToast(` ✘ Validation Error: ${error.message}`, true, 9000);
        }
    } finally {
        btn.disabled = false;
        btn.textContent = "Submit Borelog for Approval";
    }
});


document.getElementById('preview-btn').addEventListener('click', () => {
    if (!validateFormIgnoringEmptyRows()) return;

    let data;
    try {
        data = gatherBorelogData();
    } catch (e) {
        if (e.htmlMessage) {
            showToast(e.htmlMessage, true, 12000);
        } else {
            showToast(` ✘ Validation Error: ${e.message}`, true, 9000);
        }
        return;
    }

    document.getElementById('preview-modal').classList.add('active');
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

    setVal('borelog_name', props.borelog_name);
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
    const engTeam = props.engineering_team || props.drilling_team || '';
    setVal('engineering_team', engTeam);
    setVal('drilling_team', engTeam);
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
    ['strata', 'spt', 'atterberg', 'grain_size', 'shear', 'consolidation', 'triaxial', 'cpt'].forEach(type => {
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
            tr.querySelector('.f-depth').value = s.depth_m !== undefined && s.depth_m !== null ? s.depth_m : '';
            const grVal = s.gr !== undefined && s.gr !== null ? s.gr : (s.g !== undefined && s.g !== null ? s.g : (s.specific_gravity !== undefined && s.specific_gravity !== null ? s.specific_gravity : ''));
            tr.querySelector('.f-gr').value = grVal;
            tr.querySelector('.f-wc').value = s.wc !== undefined && s.wc !== null ? s.wc : (s.water_content !== undefined && s.water_content !== null ? s.water_content : '');
            tr.querySelector('.f-ll').value = s.ll !== undefined && s.ll !== null ? s.ll : (s.liquid_limit !== undefined && s.liquid_limit !== null ? s.liquid_limit : '');
            tr.querySelector('.f-pl').value = s.pl !== undefined && s.pl !== null ? s.pl : (s.plastic_limit !== undefined && s.plastic_limit !== null ? s.plastic_limit : '');

            const wc = parseFloat(tr.querySelector('.f-wc').value);
            const ll = parseFloat(tr.querySelector('.f-ll').value);
            const pl = parseFloat(tr.querySelector('.f-pl').value);

            if (!isNaN(ll) && !isNaN(pl)) {
                const pi = ll - pl;
                tr.querySelector('.f-pi').value = pi.toFixed(2);
                if (!isNaN(wc) && pi !== 0) {
                    tr.querySelector('.f-li').value = ((wc - pl) / pi).toFixed(3);
                }
            }
        });
    }

    const grainSizeData = props.grain_size_analysis_data || props.grain_size_analysis;
    if (grainSizeData) {
        grainSizeData.forEach(s => {
            const tr = addRow('grain_size-body');
            const inputs = tr.querySelectorAll('input');
            inputs[0].value = s.depth_m !== undefined ? s.depth_m : '';
            inputs[1].value = s.sand !== undefined ? s.sand : '';
            inputs[2].value = s.silt !== undefined ? s.silt : '';
            inputs[3].value = s.clay !== undefined ? s.clay : '';
        });
    }

    if (props.cpt_data) {
        props.cpt_data.forEach(s => {
            const tr = addRow('cpt-body');
            const inputs = tr.querySelectorAll('input');
            inputs[0].value = s.depth_m !== undefined ? s.depth_m : '';
            inputs[1].value = s.qc_mpa !== undefined ? s.qc_mpa : '';
            inputs[2].value = s.fs_kpa !== undefined ? s.fs_kpa : '';
            inputs[3].value = s.rf_percent !== undefined ? s.rf_percent : '';
            inputs[4].value = s.u2_kpa !== undefined ? s.u2_kpa : '';
        });
    }

    if (props.direct_shear_test_data) {
        props.direct_shear_test_data.forEach(s => {
            const tr = addRow('shear-body');
            const inputs = tr.querySelectorAll('input');
            inputs[0].value = s.depth_m !== undefined ? s.depth_m : '';
            inputs[1].value = s.normal_stress_kpa !== undefined ? s.normal_stress_kpa : '';
            inputs[2].value = s.shear_stress_kpa !== undefined ? s.shear_stress_kpa : '';
            inputs[3].value = s.cohesion_kpa !== undefined ? s.cohesion_kpa : '';
            inputs[4].value = s.friction_angle_deg !== undefined ? s.friction_angle_deg : '';
        });
    }

    if (props.consolidation_test_data) {
        props.consolidation_test_data.forEach(s => {
            const tr = addRow('consolidation-body');
            const inputs = tr.querySelectorAll('input');
            inputs[0].value = s.depth_m !== undefined ? s.depth_m : '';
            inputs[1].value = s.vertical_effective_stress_kpa !== undefined ? s.vertical_effective_stress_kpa : '';
            inputs[2].value = s.constrained_modulus_eoed_mpa !== undefined ? s.constrained_modulus_eoed_mpa : '';
            inputs[3].value = s.compression_index !== undefined ? s.compression_index : '';
            inputs[4].value = s.recompression_index !== undefined ? s.recompression_index : '';
            inputs[5].value = s.preconsolidation_pressure_kpa !== undefined ? s.preconsolidation_pressure_kpa : '';
        });
    }

    if (props.triaxial_test_data) {
        props.triaxial_test_data.forEach(s => {
            const tr = addRow('triaxial-body');
            const selects = tr.querySelectorAll('select');
            const inputs = tr.querySelectorAll('input');
            inputs[0].value = s.depth_m !== undefined ? s.depth_m : '';
            if (selects.length > 0) selects[0].value = s.test_type || 'CD';
            inputs[1].value = s.effective_confining_stress_kpa !== undefined ? s.effective_confining_stress_kpa : '';
            inputs[2].value = s.peak_deviator_stress_kpa !== undefined ? s.peak_deviator_stress_kpa : '';
            inputs[3].value = s.secant_modulus_e50_mpa !== undefined ? s.secant_modulus_e50_mpa : '';
        });
    }

    // Always append one empty row at the end of every table to act as the filler/entry row
    ['strata', 'spt', 'atterberg', 'grain_size', 'shear', 'consolidation', 'triaxial', 'cpt'].forEach(type => {
        const tr = addRow(`${type}-body`);
        const inputs = tr.querySelectorAll('input, select');
        inputs.forEach(i => i.value = '');
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

// Dynamic Calculations & Helper Listeners

// 1. SPT N-Value auto-calculation: N = blows_150_300 + blows_300_450
document.addEventListener('input', function (e) {
    if (e.target.matches('#spt-body .f-b300, #spt-body .f-b450')) {
        const tr = e.target.closest('tr');
        if (tr) {
            const b300 = parseInt(tr.querySelector('.f-b300').value, 10);
            const b450 = parseInt(tr.querySelector('.f-b450').value, 10);
            const nInput = tr.querySelector('.f-nval');
            if (!isNaN(b300) && !isNaN(b450)) {
                if (nInput.value === '' || !isNaN(parseInt(nInput.value, 10))) {
                    nInput.value = b300 + b450;
                }
            }
        }
    }
});

// 2. Atterberg Limits PI and LI auto-calculation
document.addEventListener('input', function (e) {
    if (e.target.matches('#atterberg-body .f-wc, #atterberg-body .f-ll, #atterberg-body .f-pl')) {
        const tr = e.target.closest('tr');
        if (tr) {
            const wc = parseFloat(tr.querySelector('.f-wc').value);
            const llInput = tr.querySelector('.f-ll');
            const plInput = tr.querySelector('.f-pl');
            const ll = parseFloat(llInput.value);
            const pl = parseFloat(plInput.value);

            const piInput = tr.querySelector('.f-pi');
            const liInput = tr.querySelector('.f-li');

            if (!isNaN(ll) && !isNaN(pl)) {
                const pi = ll - pl;
                piInput.value = pi.toFixed(2);

                if (ll <= pl) {
                    llInput.style.borderColor = 'var(--danger, #e41c1c)';
                    plInput.style.borderColor = 'var(--danger, #e41c1c)';
                    llInput.title = 'Liquid Limit must be greater than Plastic Limit';
                    plInput.title = 'Liquid Limit must be greater than Plastic Limit';
                } else {
                    llInput.style.borderColor = '';
                    plInput.style.borderColor = '';
                    llInput.title = '';
                    plInput.title = '';
                }

                if (!isNaN(wc) && pi > 0) {
                    const li = (wc - pl) / pi;
                    liInput.value = li.toFixed(3);
                } else {
                    liInput.value = '';
                }
            } else {
                piInput.value = '';
                liInput.value = '';
                llInput.style.borderColor = '';
                plInput.style.borderColor = '';
            }
        }
    }
});

// 3. CPT Friction Ratio Rf (%) auto-calculation: Rf = fs (kPa) / (10 * qc (MPa))
document.addEventListener('input', function (e) {
    if (e.target.matches('#cpt-body .f-qc, #cpt-body .f-fs')) {
        const tr = e.target.closest('tr');
        if (tr) {
            const qc = parseFloat(tr.querySelector('.f-qc').value);
            const fs = parseFloat(tr.querySelector('.f-fs').value);
            const rfInput = tr.querySelector('.f-rf');
            if (!isNaN(qc) && qc > 0 && !isNaN(fs) && fs >= 0) {
                const rf = fs / (10 * qc);
                rfInput.value = rf.toFixed(2);
            }
        }
    }
});
