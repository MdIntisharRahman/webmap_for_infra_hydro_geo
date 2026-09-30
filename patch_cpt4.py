import re

with open('frontend/resources/BorelogVisualizer.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacement_svg_cols = """    const baseWidths = { depth: 60, stratum: 80, desc: 250, sptText: 140, sptGraph: 200, testsGraph: 200, cptGraph: 600 };
    if (strata.length === 0) { baseWidths.stratum = 0; baseWidths.desc = 0; }
    if (sptData.length === 0) { baseWidths.sptText = 0; baseWidths.sptGraph = 0; }
    if (atterberg.length === 0) { baseWidths.testsGraph = 0; }
    if (cpt.length === 0) { baseWidths.cptGraph = 0; }
    
    const baseWidth = Object.values(baseWidths).reduce((a,b)=>a+b, 0);
    const extraColWidth = 200;
    
    const activeExtraTests = extraTests.filter(testKey => (properties[testKey] || []).length > 0);
    const totalWidth = baseWidth + (activeExtraTests.length * extraColWidth);
    
    const colOffsets = [0];
    const widths = [baseWidths.depth, baseWidths.stratum, baseWidths.desc, baseWidths.sptText, baseWidths.sptGraph, baseWidths.testsGraph, baseWidths.cptGraph];
    let curOff = 0;
    widths.forEach(w => { curOff += w; colOffsets.push(curOff); });
    
    activeExtraTests.forEach(() => {
        curOff += extraColWidth;
        colOffsets.push(curOff);
    });
    
    const headers = ["Depth (m)", "Stratum", "Description", "SPT Record", "SPT N-Value", "Atterberg Limits"];
    if (cpt.length > 0) headers.push("CPT (qc, Rf, u2)"); else headers.push("");
    activeExtraTests.forEach(testKey => {
        let name = testKey.replace('_test_data', '').replace(/_/g, ' ');
        name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        headers.push(name);
    });"""

content = re.sub(r'    const baseWidth = 60 \+ 80 \+ 250 \+ 140 \+ 200 \+ 200 \+ 200; // 1130.*?    \}\);', replacement_svg_cols, content, flags=re.DOTALL)

with open('frontend/resources/BorelogVisualizer.js', 'w', encoding='utf-8') as f:
    f.write(content)
