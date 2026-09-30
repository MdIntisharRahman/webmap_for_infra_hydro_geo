import re

with open('frontend/resources/BorelogVisualizer.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacement_svg_headers = """    for(let i=1; i<colOffsets.length-1; i++) {
        if (colOffsets[i] > colOffsets[i-1]) {
            svg += `<line x1="${colOffsets[i]}" y1="${metaHeight}" x2="${colOffsets[i]}" y2="${totalHeight - remarksHeight}" stroke="#e4e4e7" stroke-width="1" />`;
        }
    }
    
    for(let i=0; i<headers.length; i++) {
        if (colOffsets[i+1] > colOffsets[i]) {
            const cx = (colOffsets[i] + colOffsets[i+1]) / 2;
            if (i === 6 && cpt.length > 0) {
                // Draw 3 sub-headers for CPT in SVG
                svg += `<line x1="${colOffsets[i]}" y1="${metaHeight + 20}" x2="${colOffsets[i+1]}" y2="${metaHeight + 20}" stroke="#e4e4e7" stroke-width="1" />`;
                svg += `<text x="${cx}" y="${metaHeight + 14}" font-size="12px" font-weight="bold" fill="#3f3f46" text-anchor="middle">CPT Test Results</text>`;
                svg += `<line x1="${colOffsets[i] + 200}" y1="${metaHeight + 20}" x2="${colOffsets[i] + 200}" y2="${metaHeight + 40}" stroke="#e4e4e7" stroke-width="1" />`;
                svg += `<line x1="${colOffsets[i] + 400}" y1="${metaHeight + 20}" x2="${colOffsets[i] + 400}" y2="${metaHeight + 40}" stroke="#e4e4e7" stroke-width="1" />`;
                svg += `<text x="${colOffsets[i] + 100}" y="${metaHeight + 34}" font-size="11px" fill="#3f3f46" text-anchor="middle">qc (MPa)</text>`;
                svg += `<text x="${colOffsets[i] + 300}" y="${metaHeight + 34}" font-size="11px" fill="#3f3f46" text-anchor="middle">Rf (%)</text>`;
                svg += `<text x="${colOffsets[i] + 500}" y="${metaHeight + 34}" font-size="11px" fill="#3f3f46" text-anchor="middle">u2 (kPa)</text>`;
            } else {
                svg += `<text x="${cx}" y="${metaHeight + 25}" font-size="13px" font-weight="bold" fill="#3f3f46" text-anchor="middle">${headers[i]}</text>`;
            }
        }
    }"""

content = re.sub(r'    for\(let i=1; i<headers\.length; i\+\) \{.*?    \}', replacement_svg_headers, content, flags=re.DOTALL)

with open('frontend/resources/BorelogVisualizer.js', 'w', encoding='utf-8') as f:
    f.write(content)
