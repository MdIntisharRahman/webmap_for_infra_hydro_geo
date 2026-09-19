window.downloadBorelogSVG = function(properties) {
    if (!properties) return;
    const strata = properties.strata || [];
    const sptData = properties.spt_data || properties.spt_records || [];
    const atterberg = properties.atterberg_test_data || [];
    const cpt = properties.cpt_data || [];
    
    let maxDepth = 10;
    if (strata.length > 0) maxDepth = Math.max(maxDepth, ...strata.map(s => parseFloat(s.bottom_m) || 0));
    if (sptData.length > 0) maxDepth = Math.max(maxDepth, ...sptData.map(s => parseFloat(s.depth_m) || 0));
    if (atterberg.length > 0) maxDepth = Math.max(maxDepth, ...atterberg.map(s => parseFloat(s.depth_m) || 0));
    if (cpt.length > 0) maxDepth = Math.max(maxDepth, ...cpt.map(s => parseFloat(s.depth_m) || 0));
    maxDepth = Math.ceil(maxDepth) + 1;
    
    // Check if there are notes/remarks
    const remarks = properties.remarks || properties.notes || "";
    let remarksHeight = 0;
    if (remarks) {
        remarksHeight = 100;
    }
    
    const PIXELS_PER_METER = 60;
    const headerHeight = 40;
    const totalHeight = headerHeight + maxDepth * PIXELS_PER_METER + remarksHeight;
    const totalWidth = 60 + 80 + 250 + 160 + 200 + 200 + 200; // 1150
    
    const colOffsets = [0, 60, 140, 390, 550, 750, 950, 1150];
    const headers = ["Depth (m)", "Stratum", "Description", "SPT Record", "SPT N-Value", "Atterberg Limits", "CPT qc (MPa)"];
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" style="background: white; font-family: sans-serif;">`;
    
    // Header background
    svg += `<rect x="0" y="0" width="${totalWidth}" height="${headerHeight}" fill="#fafafa" stroke="#d4d4d8" stroke-width="2" />`;
    
    // Grid backgrounds
    for(let i=0; i<maxDepth; i++) {
        if (i % 2 !== 0) {
            svg += `<rect x="0" y="${headerHeight + i * PIXELS_PER_METER}" width="${totalWidth}" height="${PIXELS_PER_METER}" fill="#f4f4f5" />`;
        }
    }
    
    // Column dividers
    for(let i=1; i<7; i++) {
        svg += `<line x1="${colOffsets[i]}" y1="0" x2="${colOffsets[i]}" y2="${totalHeight - remarksHeight}" stroke="#e4e4e7" stroke-width="1" />`;
    }
    
    // Headers text
    for(let i=0; i<7; i++) {
        const cx = (colOffsets[i] + colOffsets[i+1]) / 2;
        svg += `<text x="${cx}" y="25" font-size="13px" font-weight="bold" fill="#3f3f46" text-anchor="middle">${headers[i]}</text>`;
    }
    
    // 1. Depth Ticks
    for (let i = 0; i <= maxDepth; i++) {
        const y = headerHeight + i * PIXELS_PER_METER;
        svg += `<text x="30" y="${y + 4}" font-size="12px" font-weight="500" fill="#71717a" text-anchor="middle">${i.toFixed(1)}</text>`;
    }
    
    // 2 & 3. Stratum and Description
    strata.forEach(s => {
        const top = parseFloat(s.top_m) || 0;
        const bot = parseFloat(s.bottom_m) || 0;
        const h = (bot - top) * PIXELS_PER_METER;
        const y = headerHeight + top * PIXELS_PER_METER;
        
        const color = getColorForClass(s.class);
        svg += `<rect x="${colOffsets[1] + 8}" y="${y}" width="64" height="${h}" fill="${color}" stroke="rgba(0,0,0,0.1)" stroke-width="1" />`;
        svg += `<text x="${colOffsets[1] + 40}" y="${y + h/2 + 4}" font-size="12px" font-weight="bold" fill="#333" text-anchor="middle">${s.class || ""}</text>`;
        
        // Use a foreignObject for wrapping text in description
        svg += `<foreignObject x="${colOffsets[2]}" y="${y}" width="250" height="${h}">
            <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%; height:100%; padding: 4px 8px; box-sizing: border-box; font-size: 13px; color: #3f3f46; display: flex; align-items: center; border-bottom: 1px dashed #d4d4d8; overflow: hidden;">
                ${s.description || ""}
            </div>
        </foreignObject>`;
    });
    
    // 4. SPT Text
    sptData.forEach(spt => {
        const y = headerHeight + (parseFloat(spt.depth_m) || 0) * PIXELS_PER_METER;
        const b1 = spt.blows_0_150 || "";
        const b2 = spt.blows_150_300 || "";
        const b3 = spt.blows_300_450 || "";
        
        // Build "3, 5, 8, N=13"
        let blowsStr = [b1, b2, b3].filter(b => b !== "").join(", ");
        const nval = spt.n_value || "-";
        
        svg += `<text x="${colOffsets[3] + 80}" y="${y + 4}" font-size="12px" fill="#a1a1aa" text-anchor="middle">${blowsStr}, N=${nval}</text>`;
    });
    
    // 5. SPT Graph
    for(let val=0; val<=50; val+=10) {
        const xPos = colOffsets[4] + (val / 50) * 200;
        if(val !== 0) svg += `<line x1="${xPos}" y1="${headerHeight}" x2="${xPos}" y2="${totalHeight - remarksHeight}" stroke="#e4e4e7" stroke-width="1" stroke-dasharray="4 4" />`;
        let textX = xPos;
        let anchor = "middle";
        if(val === 0) { textX = xPos + 2; anchor = "start"; }
        if(val === 50) { textX = xPos - 2; anchor = "end"; }
        svg += `<text x="${textX}" y="${headerHeight + 12}" font-size="10px" fill="#a1a1aa" text-anchor="${anchor}">${val}</text>`;
    }
    if (sptData.length > 0) {
        let pts = [];
        sptData.forEach(spt => {
            const y = headerHeight + (parseFloat(spt.depth_m) || 0) * PIXELS_PER_METER;
            let n = String(spt.n_value).includes('/') ? 50 : parseFloat(spt.n_value);
            if (isNaN(n)) n = 0; if (n > 50) n = 50;
            const x = colOffsets[4] + (n / 50) * 200;
            pts.push(`${x},${y}`);
        });
        svg += `<polyline points="${pts.join(" ")}" fill="none" stroke="#0ea5e9" stroke-width="2" />`;
        pts.forEach(p => {
            const [x,y] = p.split(",");
            svg += `<circle cx="${x}" cy="${y}" r="4" fill="#ffffff" stroke="#0ea5e9" stroke-width="2" />`;
        });
    }
    
    // 6. Atterberg Graph
    for(let val=0; val<=100; val+=25) {
        const xPos = colOffsets[5] + (val / 100) * 200;
        if(val !== 0) svg += `<line x1="${xPos}" y1="${headerHeight}" x2="${xPos}" y2="${totalHeight - remarksHeight}" stroke="#e4e4e7" stroke-width="1" stroke-dasharray="4 4" />`;
        let textX = xPos;
        let anchor = "middle";
        if(val === 0) { textX = xPos + 2; anchor = "start"; }
        if(val === 100) { textX = xPos - 2; anchor = "end"; }
        svg += `<text x="${textX}" y="${headerHeight + 12}" font-size="10px" fill="#a1a1aa" text-anchor="${anchor}">${val}</text>`;
    }
    if (atterberg.length > 0) {
        let llPts = [];
        let plPts = [];
        atterberg.forEach(test => {
            const y = headerHeight + (parseFloat(test.depth_m) || 0) * PIXELS_PER_METER;
            const wl = parseFloat(test.wl);
            const wp = parseFloat(test.wp);
            
            if (!isNaN(wl)) {
                let x = colOffsets[5] + Math.min(Math.max(wl, 0), 100) / 100 * 200;
                llPts.push(`${x},${y}`);
                svg += `<circle cx="${x}" cy="${y}" r="5" fill="#ef4444" />`;
                svg += `<text x="${x + 8}" y="${y + 4}" font-size="10px" fill="#ef4444">${wl.toFixed(1)}</text>`;
            }
            if (!isNaN(wp)) {
                let x = colOffsets[5] + Math.min(Math.max(wp, 0), 100) / 100 * 200;
                plPts.push(`${x},${y}`);
                svg += `<rect x="${x - 4}" y="${y - 4}" width="8" height="8" fill="#10b981" />`;
                svg += `<text x="${x - 8}" y="${y + 4}" font-size="10px" fill="#10b981" text-anchor="end">${wp.toFixed(1)}</text>`;
            }
            if (!isNaN(wl) && !isNaN(wp)) {
                let x1 = colOffsets[5] + Math.min(Math.max(wl, 0), 100) / 100 * 200;
                let x2 = colOffsets[5] + Math.min(Math.max(wp, 0), 100) / 100 * 200;
                svg += `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#52525b" stroke-width="1" />`;
            }
        });
        if (llPts.length > 0) svg += `<polyline points="${llPts.join(" ")}" fill="none" stroke="#ef4444" stroke-width="1" stroke-dasharray="2 2" />`;
        if (plPts.length > 0) svg += `<polyline points="${plPts.join(" ")}" fill="none" stroke="#10b981" stroke-width="1" stroke-dasharray="2 2" />`;
        
        svg += `<rect x="${colOffsets[6] - 60}" y="${totalHeight - remarksHeight - 20}" width="50" height="15" fill="white" stroke="#e4e4e7" />`;
        svg += `<text x="${colOffsets[6] - 35}" y="${totalHeight - remarksHeight - 9}" font-size="10px" fill="#ef4444" text-anchor="middle">LL / PL</text>`;
    }
    
    // 7. CPT Graph
    for(let val=0; val<=20; val+=5) {
        const xPos = colOffsets[6] + (val / 20) * 200;
        if(val !== 0) svg += `<line x1="${xPos}" y1="${headerHeight}" x2="${xPos}" y2="${totalHeight - remarksHeight}" stroke="#e4e4e7" stroke-width="1" stroke-dasharray="4 4" />`;
        let textX = xPos;
        let anchor = "middle";
        if(val === 0) { textX = xPos + 2; anchor = "start"; }
        if(val === 20) { textX = xPos - 2; anchor = "end"; }
        svg += `<text x="${textX}" y="${headerHeight + 12}" font-size="10px" fill="#a1a1aa" text-anchor="${anchor}">${val}</text>`;
    }
    if (cpt.length > 0) {
        let pts = [];
        cpt.forEach(test => {
            const y = headerHeight + (parseFloat(test.depth_m) || 0) * PIXELS_PER_METER;
            let qc = parseFloat(test.qc_mpa);
            if (!isNaN(qc)) {
                if (qc > 20) qc = 20;
                const x = colOffsets[6] + (qc / 20) * 200;
                pts.push(`${x},${y}`);
            }
        });
        if (pts.length > 0) {
            svg += `<polyline points="${pts.join(" ")}" fill="none" stroke="#8b5cf6" stroke-width="2" />`;
        }
    }
    
    // Bottom border
    svg += `<line x1="0" y1="${totalHeight - remarksHeight}" x2="${totalWidth}" y2="${totalHeight - remarksHeight}" stroke="#d4d4d8" stroke-width="2" />`;
    
    // Notes / Remarks
    if (remarks) {
        svg += `<foreignObject x="0" y="${totalHeight - remarksHeight}" width="${totalWidth}" height="${remarksHeight}">
            <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%; height:100%; padding: 16px; box-sizing: border-box; font-size: 13px; color: #3f3f46; background: #fafafa;">
                <strong>Notes / Remarks:</strong> <br/>
                ${remarks}
            </div>
        </foreignObject>`;
    }
    
    svg += `</svg>`;
    
    const blob = new Blob([svg], {type: "image/svg+xml;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Borelog_${properties.borehole_id || 'Vector'}.svg`;
    link.click();
    URL.revokeObjectURL(url);
};
