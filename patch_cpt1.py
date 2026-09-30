import re

with open('frontend/resources/BorelogVisualizer.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update baseWidths & dynamically hide
replacement1 = """    const baseWidths = { depth: 60, stratum: 80, desc: 250, sptText: 140, sptGraph: 200, testsGraph: 200, cptGraph: 600 };
    if (strata.length === 0) { baseWidths.stratum = 0; baseWidths.desc = 0; }
    if (sptData.length === 0) { baseWidths.sptText = 0; baseWidths.sptGraph = 0; }
    if (atterberg.length === 0) { baseWidths.testsGraph = 0; }
    if (cpt.length === 0) { baseWidths.cptGraph = 0; }
    const baseWidth = Object.values(baseWidths).reduce((a,b)=>a+b, 0);"""

content = re.sub(r'    const baseWidths = \{ depth: 60, stratum: 80, desc: 250, sptText: 140, sptGraph: 200, testsGraph: 200, cptGraph: 200 \};\n    const baseWidth = Object\.values\(baseWidths\)\.reduce\(\(a,b\)=>a\+b, 0\);', replacement1, content)


# 2. Update Headers mapping
replacement2 = """    const headers = ["Depth (m)", "Stratum", "Description", "SPT Record", "SPT N-Value", "Atterberg Limits", "CPT (qc, Rf, u2)"];
    extraTests.forEach(testKey => {
        let name = testKey.replace('_test_data', '').replace(/_/g, ' ');
        name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        headers.push(name);
    });
    
    // We add grid template to the header container so it matches the columns perfectly
    header.style.gridTemplateColumns = gridTemplate;
    
    headers.forEach((h, i) => {
        const d = document.createElement('div');
        d.style.padding = "10px 4px";
        d.style.borderRight = "1px solid #e4e4e7";
        d.style.textAlign = "center";
        
        // Render 3 sub-headers for CPT if it's the CPT column
        if (i === 6 && cpt.length > 0) {
            d.style.padding = "0";
            d.innerHTML = `
                <div style="border-bottom: 1px solid #e4e4e7; padding: 4px;">CPT Test Results</div>
                <div style="display: flex;">
                    <div style="flex: 1; padding: 4px; border-right: 1px solid #e4e4e7;">qc (MPa)</div>
                    <div style="flex: 1; padding: 4px; border-right: 1px solid #e4e4e7;">Rf (%)</div>
                    <div style="flex: 1; padding: 4px;">u2 (kPa)</div>
                </div>
            `;
        } else {
            d.innerText = h;
        }

        if (i === 1 && strata.length === 0) d.style.display = 'none';
        if (i === 2 && strata.length === 0) d.style.display = 'none';
        if (i === 3 && sptData.length === 0) d.style.display = 'none';
        if (i === 4 && sptData.length === 0) d.style.display = 'none';
        if (i === 5 && atterberg.length === 0) d.style.display = 'none';
        if (i === 6 && cpt.length === 0) d.style.display = 'none';
        if (i > 6) {
            const arr = properties[extraTests[i - 7]] || [];
            if (arr.length === 0) d.style.display = 'none';
        }
        
        header.appendChild(d);
    });"""

content = re.sub(r'    const headers = \["Depth \(m\)", "Stratum", "Description", "SPT Record", "SPT N-Value", "Atterberg Limits", "CPT qc \(MPa\)"\];.*?header\.appendChild\(d\);\n    \}\);', replacement2, content, flags=re.DOTALL)


# 3. Update cols initialization
replacement3 = """        if (i === 1 && strata.length === 0) c.style.display = 'none';
        if (i === 2 && strata.length === 0) c.style.display = 'none';
        if (i === 3 && sptData.length === 0) c.style.display = 'none';
        if (i === 4 && sptData.length === 0) c.style.display = 'none';
        if (i === 5 && atterberg.length === 0) c.style.display = 'none';
        if (i === 6 && cpt.length === 0) c.style.display = 'none';
        if (i > 6) {
            const arr = properties[extraTests[i - 7]] || [];
            if (arr.length === 0) c.style.display = 'none';
        }
        
        for (let j=0; j<maxDepth; j++) {"""

content = content.replace('        for (let j=0; j<maxDepth; j++) {', replacement3, 1)

with open('frontend/resources/BorelogVisualizer.js', 'w', encoding='utf-8') as f:
    f.write(content)
