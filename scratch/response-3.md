##### State the Problem Clearly

You are absolutely correct. Storing derived constitutive model parameters (like those specific to the Hardening Soil model) in a factual geotechnical database mixes raw laboratory results with interpreted engineering judgments. A standard borelog and laboratory database must capture the direct test results (Factual Data Report) from which any constitutive model parameters can later be derived (Geotechnical Design Report).

##### Identify Applicable Codes and Standards

* **ASTM D7181**: Standard Test Method for Consolidated Drained Triaxial Compression Test for Soils.
* **ASTM D4767**: Standard Test Method for Consolidated Undrained Triaxial Compression Test for Cohesive Soils.
* **ASTM D2435 / AASHTO T 216**: Standard Test Methods for One-Dimensional Consolidation Properties of Soils.

##### Present the Theoretical Basis

To capture the factual laboratory data necessary for advanced finite element modeling without asking for interpreted model parameters, we must record the specific moduli at their respective stress states directly from the tests:

1. **Triaxial Compression Test ($E_{50}$):** The secant modulus $E_{50}$ is extracted directly from the stress-strain curve of a Triaxial test at 50% of the peak deviator stress ($q_f$). It is strictly tied to the effective confining stress ($\sigma'_3$) applied during that specific test stage.
2. **1-D Consolidation / Oedometer Test ($E_{oed}$):** The oedometer stiffness (or constrained modulus, $M$) is the tangent modulus obtained from the 1-D Consolidation stress-strain curve. It must be recorded alongside the specific vertical effective stress ($\sigma'_v$) at which it was measured.

By capturing $E_{50}$ alongside $\sigma'_3$, and $E_{oed}$ alongside $\sigma'_v$, the finite element software or scripting tools can automatically calculate the reference stiffnesses ($E_{50}^{ref}$, $E_{oed}^{ref}$) and the stress-dependency exponent ($m$).

##### Show Calculations Step-by-Step

From the raw laboratory curves, the reported moduli are calculated as:

* $E_{50} = \frac{q_{50}}{\epsilon_{50}}$ (Evaluated from the Triaxial curve at $\sigma'_3$)
* $E_{oed} = \frac{\Delta \sigma'_v}{\Delta \epsilon_v}$ (Evaluated from the Oedometer curve at a specific $\sigma'_v$)

##### Verify Against Limits and Checks

This approach ensures the JSON schema and HTML form remain true to factual laboratory reporting standards. We will replace the previously suggested HS Model table with a Triaxial Test table, and add the stress-dependent constrained modulus to the Consolidation table.

##### Document Assumptions and Judgments

I assume the laboratory provides the secant modulus ($E_{50}$) and tangent constrained modulus ($E_{oed}$) evaluated at specific testing stresses in their standard reports.

###### Provide Actionable Recommendations

**1. JSON Syntax for Raw Test Results**
Remove the `hardening_soil_parameters` array and implement `triaxial_test_data`. Update `consolidation_test_data` to include the specific effective stress and the constrained modulus.

```json
    "triaxial_test_data": [
      {
        "depth_m": 12.0,
        "test_type": "CD",
        "effective_confining_stress_kpa": 100.0,
        "peak_deviator_stress_kpa": 150.0,
        "secant_modulus_e50_mpa": 25.0
      }
    ],
    "consolidation_test_data": [
      {
        "depth_m": 12.0,
        "vertical_effective_stress_kpa": 100.0,
        "constrained_modulus_eoed_mpa": 25.0,
        "compression_index": 0.20,
        "recompression_index": 0.04,
        "preconsolidation_pressure_kpa": 120.5
      }
    ]

```

**2. HTML Form Updates (`borelog-entry.html`)**
Replace the HS Model section with the Triaxial Test section, and update the Consolidation table headers.

```html
<!-- Consolidated Triaxial Test (CU/CD) -->
<div class="section">
    <div class="section-header">
        <h2>Consolidated Triaxial Test (CU/CD)</h2>
        <button type="button" class="btn btn-outline" onclick="addRow('triaxial-body')">+ Add Sample</button>
    </div>
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Depth (m)</th>
                    <th>Type (CU/CD)</th>
                    <th>Confining Stress σ'₃ (kPa)</th>
                    <th>Peak Deviator Stress q_f (kPa)</th>
                    <th>Secant Modulus E₅₀ (MPa)</th>
                    <th style="width:50px;"></th>
                </tr>
            </thead>
            <tbody id="triaxial-body" data-type="triaxial"></tbody>
        </table>
    </div>
</div>

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
                    <th>Vert. Eff. Stress σ'v (kPa)</th>
                    <th>Constrained Modulus E_oed (MPa)</th>
                    <th>Comp. Index (C_c)</th>
                    <th>Recomp. Index (C_r)</th>
                    <th>Precons. Pressure (kPa)</th>
                    <th style="width:50px;"></th>
                </tr>
            </thead>
            <tbody id="consolidation-body" data-type="consolidation"></tbody>
        </table>
    </div>
</div>

```

**3. JavaScript Logic Updates (`borelog-form.js`)**
Update the row generation and JSON mapping logic.

```javascript
// Inside getRowHTML(type)
case 'triaxial':
    return `
        <td><input type="number" step="0.001" class="f-depth" required></td>
        <td>
            <select class="f-type" style="padding: 11px; border: 1px solid var(--border-color); width: 100%;">
                <option value="CD">CD</option>
                <option value="CU">CU</option>
            </select>
        </td>
        <td><input type="number" step="0.1" class="f-confining" required></td>
        <td><input type="number" step="0.1" class="f-deviator" required></td>
        <td><input type="number" step="0.1" class="f-e50" required></td>
        <td><button type="button" class="del-btn" onclick="deleteRow(this)" title="Delete Row">𐩃</button></td>
    `;
case 'consolidation':
    return `
        <td><input type="number" step="0.001" class="f-depth" required></td>
        <td><input type="number" step="0.1" class="f-stress" required></td>
        <td><input type="number" step="0.1" class="f-eoed" required></td>
        <td><input type="number" step="0.001" class="f-cc" required></td>
        <td><input type="number" step="0.001" class="f-cr" required></td>
        <td><input type="number" step="0.1" class="f-pc" required></td>
        <td><button type="button" class="del-btn" onclick="deleteRow(this)" title="Delete Row">𐩃</button></td>
    `;

// Inside gatherBorelogData()
triaxial_test_data: Array.from(document.querySelectorAll('#triaxial-body tr')).map(row => ({
    depth_m: parseFloat(row.querySelector('.f-depth').value),
    test_type: row.querySelector('.f-type').value,
    effective_confining_stress_kpa: parseFloat(row.querySelector('.f-confining').value),
    peak_deviator_stress_kpa: parseFloat(row.querySelector('.f-deviator').value),
    secant_modulus_e50_mpa: parseFloat(row.querySelector('.f-e50').value)
})),

consolidation_test_data: Array.from(document.querySelectorAll('#consolidation-body tr')).map(row => ({
    depth_m: parseFloat(row.querySelector('.f-depth').value),
    vertical_effective_stress_kpa: parseFloat(row.querySelector('.f-stress').value),
    constrained_modulus_eoed_mpa: parseFloat(row.querySelector('.f-eoed').value),
    compression_index: parseFloat(row.querySelector('.f-cc').value),
    recompression_index: parseFloat(row.querySelector('.f-cr').value),
    preconsolidation_pressure_kpa: parseFloat(row.querySelector('.f-pc').value)
})),

```