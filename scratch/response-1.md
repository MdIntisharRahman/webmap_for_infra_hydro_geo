##### State the Problem Clearly

The provided JSON schema, HTML form, and JavaScript logic contain fundamental terminological and structural inaccuracies regarding advanced geotechnical laboratory and field testing. Specifically, "Odeometric" is a typographical error for "Oedometer," and separating the Oedometer test from the Consolidation test implies they are distinct procedures, whereas they are the same laboratory test. Furthermore, the Cone Penetration Test (CPT) parameters lack the corrected cone resistance ($q_t$), which is critical for piezocone (CPTu) data interpretation.

##### Identify Applicable Codes and Standards

* **ASTM D2435 / AASHTO T 216**: Standard Test Methods for One-Dimensional Consolidation Properties of Soils Using Incremental Loading.
* **ASTM D5778**: Standard Test Method for Electronic Friction Cone and Piezocone Penetration Testing of Soils.

##### Present the Theoretical Basis

An Oedometer test is the standard laboratory apparatus used to perform a 1-D Consolidation test. Therefore, the properties listed under `consolidation_test_data` (void ratio, coefficient of consolidation $C_v$) and `odeometric_test_data` (initial void ratio $e_0$, final void ratio $e_f$, compression index $C_c$) are derived from the exact same physical test. Keeping them as separate tables creates redundant data entry and fractures the digital soil profile.

For the Cone Penetration Test (CPT), the provided form captures measured cone resistance ($q_c$), sleeve friction ($f_s$), friction ratio ($R_f$), and pore pressure ($u_2$). Because $u_2$ is being measured, this is explicitly a Piezocone test (CPTu). In piezocone testing, the measured cone resistance ($q_c$) must be corrected for unequal pore pressure effects acting on the cone shoulder to yield the corrected cone resistance ($q_t$), governed by the equation $q_t = q_c + u_2(1 - a)$, where $a$ is the net area ratio of the cone. Standard JSON schemas for CPTu should explicitly store $q_t$.

##### Verify Against Limits and Checks

* **JSON File (`PL-11-SQTRS-13-22092026-Mx8y9WZO.JSON`)**: Contains separate arrays for `consolidation_test_data` and `odeometric_test_data`.


* **HTML File (`borelog-entry.html`)**: Features two distinct form sections ("Consolidation Test" and "Odeometric Test").


* **JS File (`borelog-form.js`)**: Maps data to separate JSON arrays and UI tables, calculating variables inefficiently. The CPT mapping does not account for corrected $q_t$.



##### Document Assumptions and Judgments

I assume the goal is to build a modern, unified relational database for the RHD. To achieve this, the consolidation parameters must be unified into a single coherent test record. Furthermore, it is assumed that Preconsolidation Pressure ($\sigma'_p$) and Recompression Index ($C_r$) are standard deliverables from your laboratory and should be included to make the consolidation data actually useful for settlement calculations.

##### Provide Actionable Recommendations

**1. Unified JSON Syntax Correction**
Replace the separate `consolidation_test_data` and `odeometric_test_data` arrays with this single, standardized schema block. Update your CPT array to include `qt_mpa`.

```json
    "consolidation_test_data": [
      {
        "depth_m": 12.0,
        "initial_void_ratio": 0.80,
        "compression_index": 0.20,
        "recompression_index": 0.04,
        "preconsolidation_pressure_kpa": 120.5,
        "coefficient_of_consolidation_m2_per_year": 0.2
      }
    ],
    "cpt_data": [
      {
        "depth_m": 1.5,
        "qc_mpa": 2.5,
        "qt_mpa": 2.55,
        "fs_kpa": 15.0,
        "rf_percent": 0.6,
        "u2_kpa": 12.0
      }
    ]

```

**2. HTML Form Updates (`borelog-entry.html`)**
Delete the "Odeometric Test" section entirely. Replace the "Consolidation Test" section and update the CPT headers with the following standard markup:

```html
<!-- 1-D Consolidation (Oedometer) Test -->
<div class="section">
    <div class="section-header">
        <h2>1-D Consolidation (Oedometer) Test</h2>
        <button type="button" class="btn btn-outline" onclick="addRow('consolidation-body')">+ Add Sample</button>
    </div>
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Depth (m)</th>
                    <th>Initial Void Ratio (e₀)</th>
                    <th>Comp. Index (C_c)</th>
                    <th>Recomp. Index (C_r)</th>
                    <th>Precons. Pressure (kPa)</th>
                    <th>Coeff. Cons. (m²/yr)</th>
                    <th style="width:50px;"></th>
                </tr>
            </thead>
            <tbody id="consolidation-body" data-type="consolidation"></tbody>
        </table>
    </div>
</div>

<!-- Cone Penetration Test (CPTu) -->
<div class="section">
    <div class="section-header">
        <h2>Piezocone Penetration Test (CPTu)</h2>
        <button type="button" class="btn btn-outline" onclick="addRow('cpt-body')">+ Add Reading</button>
    </div>
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Depth (m)</th>
                    <th>Measured qc (MPa)</th>
                    <th>Corrected qt (MPa)</th>
                    <th>Sleeve fs (kPa)</th>
                    <th>Friction Ratio Rf (%)</th>
                    <th>Pore Pressure u2 (kPa)</th>
                    <th style="width:50px;"></th>
                </tr>
            </thead>
            <tbody id="cpt-body" data-type="cpt"></tbody>
        </table>
    </div>
</div>

```

**3. JavaScript Logic Updates (`borelog-form.js`)**
Update `getRowHTML` and `gatherBorelogData` to handle the unified Consolidation properties and the new CPT `qt` parameter, effectively replacing the old mappings.

```javascript
// Inside getRowHTML(type)
case 'consolidation':
    return `
        <td><input type="number" step="0.001" class="f-depth" required></td>
        <td><input type="number" step="0.001" class="f-ivoid" required></td>
        <td><input type="number" step="0.001" class="f-cc" required></td>
        <td><input type="number" step="0.001" class="f-cr" required></td>
        <td><input type="number" step="0.1" class="f-pc" required></td>
        <td><input type="number" step="0.001" class="f-coeff" required></td>
        <td><button type="button" class="del-btn" onclick="deleteRow(this)" title="Delete Row">𐩃</button></td>
    `;
case 'cpt':
    return `
        <td><input type="number" step="0.001" class="f-depth" required></td>
        <td><input type="number" step="0.001" class="f-qc" required></td>
        <td><input type="number" step="0.001" class="f-qt" required></td>
        <td><input type="number" step="0.001" class="f-fs" required></td>
        <td><input type="number" step="0.001" class="f-rf" required></td>
        <td><input type="number" step="0.001" class="f-u2"></td>
        <td><button type="button" class="del-btn" onclick="deleteRow(this)" title="Delete Row">𐩃</button></td>
    `;
// Remove case 'odeometric' entirely

// Inside gatherBorelogData()
consolidation_test_data: Array.from(document.querySelectorAll('#consolidation-body tr')).map(row => ({
    depth_m: parseFloat(row.querySelector('.f-depth').value),
    initial_void_ratio: parseFloat(row.querySelector('.f-ivoid').value),
    compression_index: parseFloat(row.querySelector('.f-cc').value),
    recompression_index: parseFloat(row.querySelector('.f-cr').value),
    preconsolidation_pressure_kpa: parseFloat(row.querySelector('.f-pc').value),
    coefficient_of_consolidation_m2_per_year: parseFloat(row.querySelector('.f-coeff').value)
})),

cpt_data: Array.from(document.querySelectorAll('#cpt-body tr')).map(row => ({
    depth_m: parseFloat(row.querySelector('.f-depth').value),
    qc_mpa: parseFloat(row.querySelector('.f-qc').value),
    qt_mpa: parseFloat(row.querySelector('.f-qt').value),
    fs_kpa: parseFloat(row.querySelector('.f-fs').value),
    rf_percent: parseFloat(row.querySelector('.f-rf').value),
    u2_kpa: row.querySelector('.f-u2').value ? parseFloat(row.querySelector('.f-u2').value) : null
})),
// Remove odeometric_test_data parsing entirely

```