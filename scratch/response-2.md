##### State the Problem Clearly

The database must capture advanced stress-dependent stiffness parameters required for the Hardening Soil (HS) model used in advanced geotechnical finite element modeling. The previous schema did not isolate the specific reference stiffnesses ($E_{50}^{ref}$, $E_{oed}^{ref}$, $E_{ur}^{ref}$) and the stress-dependency exponent ($m$).

##### Identify Applicable Codes and Standards

* **ASTM D2435 / ISO 17892-5**: Standard Test Methods for One-Dimensional Consolidation Properties of Soils.
* **ASTM D7181 / ISO 17892-9**: Standard Test Method for Consolidated Drained Triaxial Compression Test for Soils.
* **Geotechnical Finite Element Standards**: PLAXIS Material Models Manual (HS Model definitions).

##### Present the Theoretical Basis

To accurately populate the Hardening Soil model, data from *two* distinct laboratory tests must be synthesized.

1. **Triaxial Test (CD/CU):** Provides $E_{50}^{ref}$, which is the secant stiffness in standard drained triaxial test evaluated at 50% of the maximum deviatoric stress, measured at a reference confining pressure (typically $p^{ref} = 100 \text{ kPa}$).
2. **Oedometer Test:** Provides $E_{oed}^{ref}$, which is the tangent stiffness for primary oedometer loading at the reference pressure.
3. **Unloading/Reloading:** Provides $E_{ur}^{ref}$, the unloading/reloading stiffness (often derived from Triaxial, but can be derived from Oedometer; default is often $E_{ur}^{ref} \approx 3E_{50}^{ref}$).
4. **Stress Dependency ($m$):** The power governing how stiffness increases with stress level.

The parameter you noted as "Pressure for 50% compression" refers to $E_{50}^{ref}$, which physically belongs in a Triaxial test record, while $E_{oed}^{ref}$ belongs in the Oedometer record. To maintain structural integrity in the database, we will create a dedicated **Hardening Soil Model Parameters** section that aggregates these advanced values for direct export to finite element software.

##### Verify Against Limits and Checks

By decoupling basic classification indices from advanced constitutive model parameters, the schema remains clean for standard DOT reporting while explicitly supporting automated scripting for numerical modeling.

##### Document Assumptions and Judgments

It is assumed that the reference pressure ($p^{ref}$) is standardized to $100 \text{ kPa}$ across all tests, conforming to standard computational geotechnics practice. It is also assumed that these parameters are interpreted by the geotechnical engineer from the raw stress-strain curves prior to database entry.

###### Provide Actionable Recommendations

**1. JSON Syntax for HS Model Parameters**
Add a dedicated array to your JSON schema to cleanly store constitutive model parameters.

```json
    "hardening_soil_parameters": [
      {
        "depth_m": 12.0,
        "p_ref_kpa": 100.0,
        "e50_ref_mpa": 25.0,
        "eoed_ref_mpa": 25.0,
        "eur_ref_mpa": 75.0,
        "power_m": 0.85,
        "failure_ratio_rf": 0.9,
        "poisson_ur": 0.2
      }
    ]

```

**2. HTML Form Updates (`borelog-entry.html`)**
Add this section to your HTML to capture the HS model parameters directly.

```html
<!-- Hardening Soil (HS) Model Parameters -->
<div class="section">
    <div class="section-header">
        <h2>Hardening Soil (HS) Model Parameters</h2>
        <button type="button" class="btn btn-outline" onclick="addRow('hs-body')">+ Add Sample</button>
    </div>
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Depth (m)</th>
                    <th>p_ref (kPa)</th>
                    <th>E₅₀_ref (MPa)</th>
                    <th>E_oed_ref (MPa)</th>
                    <th>E_ur_ref (MPa)</th>
                    <th>Power (m)</th>
                    <th style="width:50px;"></th>
                </tr>
            </thead>
            <tbody id="hs-body" data-type="hardening_soil"></tbody>
        </table>
    </div>
</div>

```

**3. JavaScript Logic Updates (`borelog-form.js`)**
Add the rendering and harvesting logic for the new parameters.

```javascript
// Add to getRowHTML(type) switch statement
case 'hardening_soil':
    return `
        <td><input type="number" step="0.01" class="f-depth" required></td>
        <td><input type="number" step="0.1" class="f-pref" value="100" required></td>
        <td><input type="number" step="0.1" class="f-e50" placeholder="e.g. 25" required></td>
        <td><input type="number" step="0.1" class="f-eoed" placeholder="e.g. 25" required></td>
        <td><input type="number" step="0.1" class="f-eur" placeholder="e.g. 75" required></td>
        <td><input type="number" step="0.01" class="f-m" placeholder="0.5 to 1.0" required></td>
        <td><button type="button" class="del-btn" onclick="deleteRow(this)" title="Delete Row">𐩃</button></td>
    `;

// Add to gatherBorelogData() object
hardening_soil_parameters: Array.from(document.querySelectorAll('#hs-body tr')).map(row => ({
    depth_m: parseFloat(row.querySelector('.f-depth').value),
    p_ref_kpa: parseFloat(row.querySelector('.f-pref').value),
    e50_ref_mpa: parseFloat(row.querySelector('.f-e50').value),
    eoed_ref_mpa: parseFloat(row.querySelector('.f-eoed').value),
    eur_ref_mpa: parseFloat(row.querySelector('.f-eur').value),
    power_m: parseFloat(row.querySelector('.f-m').value)
})),

// Ensure it initializes in window.onload
window.onload = () => {
    addRow('strata-body');
    addRow('spt-body');
    addRow('cpt-body');
    addRow('hs-body'); // Initialize the new row
};

```