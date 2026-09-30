import re

with open('frontend/resources/BorelogVisualizer.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacement_cpt_svg = """    const drawCptPlotSvg = (xOffset, key, maxVal, color) => {
        let localSvg = "";
        for(let val=0; val<=maxVal; val+=maxVal/4) {
            const xPos = xOffset + (val / maxVal) * 200;
            if(val !== 0) localSvg += `<line x1="${xPos}" y1="${headerHeight}" x2="${xPos}" y2="${totalHeight - remarksHeight}" stroke="#e4e4e7" stroke-width="1" stroke-dasharray="4 4" />`;
            let textX = xPos;
            let anchor = "middle";
            if(val === 0) { textX = xPos + 2; anchor = "start"; }
            if(val === maxVal) { textX = xPos - 2; anchor = "end"; }
            localSvg += `<text x="${textX}" y="${headerHeight + 12}" font-size="10px" fill="#a1a1aa" text-anchor="${anchor}">${val}</text>`;
        }
        
        if (cpt.length > 0) {
            let pts = [];
            cpt.forEach(test => {
                const y = headerHeight + (parseFloat(test.depth_m) || 0) * PIXELS_PER_METER;
                let v = parseFloat(test[key]);
                if (!isNaN(v)) {
                    if (v > maxVal) v = maxVal;
                    const x = xOffset + (v / maxVal) * 200;
                    pts.push(`${x},${y}`);
                }
            });
            if (pts.length > 0) {
                localSvg += `<polyline points="${pts.join(" ")}" fill="none" stroke="${color}" stroke-width="2" />`;
            }
        }
        return localSvg;
    };
    
    if (cpt.length > 0) {
        svg += `<line x1="${colOffsets[6] + 200}" y1="${headerHeight}" x2="${colOffsets[6] + 200}" y2="${totalHeight - remarksHeight}" stroke="#e4e4e7" stroke-width="1" />`;
        svg += `<line x1="${colOffsets[6] + 400}" y1="${headerHeight}" x2="${colOffsets[6] + 400}" y2="${totalHeight - remarksHeight}" stroke="#e4e4e7" stroke-width="1" />`;
        
        svg += drawCptPlotSvg(colOffsets[6], 'qc_mpa', 20, '#8b5cf6');
        svg += drawCptPlotSvg(colOffsets[6] + 200, 'rf_percent', 10, '#ec4899');
        svg += drawCptPlotSvg(colOffsets[6] + 400, 'u2_kpa', 500, '#06b6d4');
    }"""

content = re.sub(r'    for\(let val=0; val<=20; val\+=5\) \{.*?        \}\n    \}', replacement_cpt_svg, content, flags=re.DOTALL)

with open('frontend/resources/BorelogVisualizer.js', 'w', encoding='utf-8') as f:
    f.write(content)
