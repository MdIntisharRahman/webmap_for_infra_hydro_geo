const pastelColors = [
    "#fbcfe8", "#fde047", "#86efac", "#93c5fd", "#d8b4fe", "#fdba74", "#67e8f9", "#fca5a5",
    "#bef264", "#c4b5fd", "#fcd34d", "#7dd3fc", "#f9a8d4", "#f87171", "#6ee7b7", "#a78bfa",
    "#fcd34d", "#38bdf8", "#fb7185", "#a3e635", "#818cf8", "#fbbf24", "#34d399", "#e879f9",
    "#fb923c", "#4ade80", "#60a5fa", "#f472b6", "#c084fc", "#fde047", "#2dd4bf", "#f87171",
    "#a78bfa", "#facc15", "#38bdf8", "#fb7185", "#4ade80", "#818cf8", "#fbbf24", "#2dd4bf",
    "#e879f9", "#fb923c", "#34d399", "#60a5fa", "#f472b6", "#c084fc", "#fde047", "#a3e635"
];

let classColorMap = {};
let colorIndex = 0;

function getColorForClass(cls) {
    if (!cls) return "#e5e7eb";
    const key = cls.trim().toUpperCase();
    if (!classColorMap[key]) {
        classColorMap[key] = pastelColors[colorIndex % pastelColors.length];
        colorIndex++;
    }
    return classColorMap[key];
}

function parseMarkdown(md) {
    if (!md) return "";
    let html = md;
    
    html = html.replace(/^### (.*$)/gim, '<strong>$1</strong><br/>');
    html = html.replace(/^## (.*$)/gim, '<strong style="font-size:1.1em;">$1</strong><br/>');
    html = html.replace(/^# (.*$)/gim, '<strong style="font-size:1.2em;">$1</strong><br/>');
    
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:#2563eb;">$1</a>');
    
    let lines = html.split('\n');
    let inList = false;
    let res = [];
    for(let i=0; i<lines.length; i++) {
        let line = lines[i].trim();
        if(line.startsWith('- ') || line.startsWith('* ')) {
            if(!inList) {
                res.push('<ul style="margin: 4px 0; padding-left: 20px;">');
                inList = true;
            }
            res.push('<li>' + line.substring(2) + '</li>');
        } else {
            if(inList) {
                res.push('</ul>');
                inList = false;
            }
            if(line !== "") res.push(line + '<br/>');
            else res.push('<br/>');
        }
    }
    if(inList) res.push('</ul>');
    return res.join('');
}

window.renderBorelogChart = function(containerId, geoJsonData) {
    const container = document.getElementById(containerId);
    if (!container || !geoJsonData) return;
    
    let properties = geoJsonData.properties || geoJsonData;
    let coords = geoJsonData.geometry && geoJsonData.geometry.coordinates ? geoJsonData.geometry.coordinates : null;
    let coordStr = coords ? `[${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}]` : "";
    
    container.innerHTML = "";
    classColorMap = {};
    colorIndex = 0;
    
    const strata = properties.strata || [];
    const sptData = properties.spt_data || properties.spt_records || [];
    const atterberg = properties.atterberg_test_data || properties.atterberg_limits || [];
    const cpt = properties.cpt_data || [];
    
    let extraTests = Object.keys(properties).filter(k => Array.isArray(properties[k]) && k.endsWith('_test_data') && k !== 'atterberg_test_data');
    extraTests.sort();
    
    let maxDepth = 10;
    if (strata.length > 0) maxDepth = Math.max(maxDepth, ...strata.map(s => parseFloat(s.bottom_m) || 0));
    if (sptData.length > 0) maxDepth = Math.max(maxDepth, ...sptData.map(s => parseFloat(s.depth_m) || 0));
    if (atterberg.length > 0) maxDepth = Math.max(maxDepth, ...atterberg.map(s => parseFloat(s.depth_m) || 0));
    if (cpt.length > 0) maxDepth = Math.max(maxDepth, ...cpt.map(s => parseFloat(s.depth_m) || 0));
    extraTests.forEach(testKey => {
        const arr = properties[testKey] || [];
        if (arr.length > 0) maxDepth = Math.max(maxDepth, ...arr.map(s => parseFloat(s.depth_m) || 0));
    });
    maxDepth = Math.ceil(maxDepth) + 1;
    
    const PIXELS_PER_METER = 60;
    const totalHeight = maxDepth * PIXELS_PER_METER;
    
    const baseWidths = { depth: 60, stratum: 80, desc: 250, sptText: 140, sptGraph: 200, testsGraph: 200, cptGraph: 200 };
    const baseWidth = Object.values(baseWidths).reduce((a,b)=>a+b, 0);
    const extraColWidth = 200;
    const totalWidth = baseWidth + (extraTests.length * extraColWidth);
    
    let gridTemplate = `${baseWidths.depth}px ${baseWidths.stratum}px ${baseWidths.desc}px ${baseWidths.sptText}px ${baseWidths.sptGraph}px ${baseWidths.testsGraph}px ${baseWidths.cptGraph}px`;
    extraTests.forEach(() => { gridTemplate += ` ${extraColWidth}px`; });
    
    container.style.height = "100%";
    container.style.maxHeight = "100%";
    container.style.display = "flex";
    container.style.flexDirection = "column";

    const wrapper = document.createElement('div');
    wrapper.style.fontFamily = "'Outfit', 'SmartGothic', sans-serif";
    wrapper.style.border = "1px solid #e4e4e7";
    wrapper.style.borderRadius = "8px";
    wrapper.style.backgroundColor = "#ffffff";
    wrapper.style.overflow = "auto";
    wrapper.style.width = "100%";
    wrapper.style.height = "100%";
    wrapper.style.maxHeight = "100%";
    
    const innerWrapper = document.createElement('div');
    innerWrapper.style.minWidth = "max-content";
    innerWrapper.style.display = "flex";
    innerWrapper.style.flexDirection = "column";
    
    let dateStr = properties.date_of_starting_boring || properties.date_of_boring || "";
    if (properties.date_of_ending_boring && properties.date_of_ending_boring !== dateStr) {
        dateStr += " - " + properties.date_of_ending_boring;
    }
    const metaDiv = document.createElement('div');
    metaDiv.innerHTML = `
    <div style="padding: 16px 24px; background: white; border-bottom: 2px solid #d4d4d8; font-size: 13px; color: #3f3f46; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div><strong>Borelog ID:</strong> ${properties.borelog_id || properties.borehole_id || properties.Name || ""}</div>
        <div><strong>Project:</strong> ${properties.project || ""}</div>
        <div><strong>Client:</strong> ${properties.client || ""}</div>
        <div><strong>Location (EPSG:4326):</strong> ${properties.location || ""} ${coordStr}</div>
        <div><strong>Date:</strong> ${dateStr}</div>
        <div><strong>RL (m):</strong> ${properties.rl_m !== undefined ? properties.rl_m : ""}</div>
        <div><strong>Water Table (m):</strong> ${properties.water_table_m !== undefined ? properties.water_table_m : ""}</div>
    </div>`;
    innerWrapper.appendChild(metaDiv);
    
    const header = document.createElement('div');
    header.style.display = "grid";
    header.style.gridTemplateColumns = gridTemplate;
    header.style.backgroundColor = "#fafafa";
    header.style.borderBottom = "2px solid #d4d4d8";
    header.style.fontWeight = "600";
    header.style.fontSize = "13px";
    header.style.color = "#3f3f46";
    header.style.textAlign = "center";
    header.style.position = "sticky";
    header.style.top = "0";
    header.style.zIndex = "10";
    header.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
    
    const headers = ["Depth (m)", "Stratum", "Description", "SPT Record", "SPT N-Value", "Atterberg Limits", "CPT qc (MPa)"];
    extraTests.forEach(testKey => {
        let name = testKey.replace('_test_data', '').replace(/_/g, ' ');
        name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        headers.push(name);
    });
    
    headers.forEach(h => {
        const d = document.createElement('div');
        d.style.padding = "10px 4px";
        d.style.borderRight = "1px solid #e4e4e7";
        d.innerText = h;
        header.appendChild(d);
    });
    innerWrapper.appendChild(header);

    const body = document.createElement('div');
    body.style.display = "grid";
    body.style.gridTemplateColumns = gridTemplate;
    body.style.position = "relative";
    body.style.height = `${totalHeight}px`;

    const cols = [];
    const numCols = 7 + extraTests.length;
    for(let i=0; i<numCols; i++) {
        const c = document.createElement('div');
        c.style.position = "relative";
        c.style.borderRight = "1px solid #e4e4e7";
        c.style.height = "100%";
        
        for (let j=0; j<maxDepth; j++) {
            if (j % 2 !== 0) {
                const bg = document.createElement('div');
                bg.style.position = "absolute";
                bg.style.top = `${j * PIXELS_PER_METER}px`;
                bg.style.width = "100%";
                bg.style.height = `${PIXELS_PER_METER}px`;
                bg.style.backgroundColor = "#f4f4f5";
                bg.style.zIndex = "0";
                c.appendChild(bg);
            }
        }
        body.appendChild(c);
        cols.push(c);
    }

    for (let i = 0; i <= maxDepth; i++) {
        const y = i * PIXELS_PER_METER;
        const tick = document.createElement('div');
        tick.style.position = "absolute";
        let textTop = y - 8;
        if (i === 0) textTop = y + 2;
        if (i === maxDepth) textTop = y - 18;
        tick.style.top = `${textTop}px`;
        tick.style.width = "100%";
        tick.style.textAlign = "center";
        tick.style.fontSize = "12px";
        tick.style.color = "#71717a";
        tick.style.zIndex = "1";
        tick.innerText = i.toFixed(1);
        cols[0].appendChild(tick);
    }
    
    strata.forEach(s => {
        const top = parseFloat(s.top_m) || 0;
        const bot = parseFloat(s.bottom_m) || 0;
        const h = (bot - top) * PIXELS_PER_METER;
        const y = top * PIXELS_PER_METER;
        
        const rect = document.createElement('div');
        rect.style.position = "absolute";
        rect.style.top = `${y}px`;
        rect.style.left = "10%";
        rect.style.width = "80%";
        rect.style.height = `${h}px`;
        rect.style.backgroundColor = getColorForClass(s.class || s.uscs_class);
        rect.style.border = "1px solid rgba(0,0,0,0.1)";
        rect.style.display = "flex";
        rect.style.alignItems = "center";
        rect.style.justifyContent = "center";
        rect.style.fontWeight = "bold";
        rect.style.fontSize = "12px";
        rect.style.color = "#333";
        rect.style.zIndex = "1";
        rect.innerText = s.class || s.uscs_class || "";
        cols[1].appendChild(rect);
        
        const desc = document.createElement('div');
        desc.style.position = "absolute";
        desc.style.top = `${y}px`;
        desc.style.left = "0";
        desc.style.width = "100%";
        desc.style.height = `${h}px`;
        desc.style.padding = "4px 8px";
        desc.style.boxSizing = "border-box";
        desc.style.fontSize = "13px";
        desc.style.color = "#3f3f46";
        desc.style.borderBottom = "1px dashed #d4d4d8";
        desc.style.display = "flex";
        desc.style.alignItems = "center";
        desc.style.overflow = "hidden";
        desc.style.zIndex = "1";
        desc.innerText = s.description || "";
        cols[2].appendChild(desc);
    });
    
    sptData.forEach(spt => {
        const y = (parseFloat(spt.depth_m) || 0) * PIXELS_PER_METER;
        const b1 = spt.blows_0_150 ?? spt.blows_150 ?? "";
        const b2 = spt.blows_150_300 ?? spt.blows_300 ?? "";
        const b3 = spt.blows_300_450 ?? spt.blows_450 ?? "";
        const nval = spt.n_value || "-";
        
        let blowsStr = [b1, b2, b3].filter(b => b !== "").join(", ");
        
        const txt = document.createElement('div');
        txt.style.position = "absolute";
        txt.style.top = `${y - 8}px`;
        txt.style.width = "100%";
        txt.style.textAlign = "center";
        txt.style.fontSize = "12px";
        txt.style.color = "#52525b";
        txt.style.zIndex = "1";
        
        txt.innerHTML = `<span style="color:#a1a1aa">${blowsStr}, </span> <strong style="color:#0ea5e9; font-size: 14px;">N=${nval}</strong>`;
        cols[3].appendChild(txt);
    });
    
    const sptSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    sptSvg.setAttribute("width", "100%");
    sptSvg.setAttribute("height", totalHeight);
    sptSvg.style.position = "absolute";
    sptSvg.style.top = "0";
    sptSvg.style.left = "0";
    sptSvg.style.zIndex = "1";
    
    for(let val=0; val<=50; val+=10) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", `${val * 2}%`);
        line.setAttribute("x2", `${val * 2}%`);
        line.setAttribute("y1", "0");
        line.setAttribute("y2", "100%");
        line.setAttribute("stroke", "#e4e4e7");
        line.setAttribute("stroke-dasharray", "4 4");
        sptSvg.appendChild(line);
        
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        let xAttr = `calc(${val * 2}% + 2px)`;
        let anchor = "start";
        if (val === 50) { xAttr = `calc(100% - 2px)`; anchor = "end"; }
        if (val > 0 && val < 50) { xAttr = `${val * 2}%`; anchor = "middle"; }
        label.setAttribute("x", xAttr);
        label.setAttribute("y", "12");
        label.setAttribute("font-size", "10px");
        label.setAttribute("fill", "#a1a1aa");
        label.setAttribute("text-anchor", anchor);
        label.textContent = val;
        sptSvg.appendChild(label);
    }
    
    if (sptData.length > 0) {
        let pts = [];
        sptData.forEach(spt => {
            const y = (parseFloat(spt.depth_m) || 0) * PIXELS_PER_METER;
            let n = String(spt.n_value).includes('/') ? 50 : parseFloat(spt.n_value);
            if (isNaN(n)) n = 0; if (n > 50) n = 50;
            pts.push(`${n * 2}%,${y}`);
            
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", `${n * 2}%`);
            circle.setAttribute("cy", y);
            circle.setAttribute("r", "4");
            circle.setAttribute("fill", "#ffffff");
            circle.setAttribute("stroke", "#0ea5e9");
            circle.setAttribute("stroke-width", "2");
            sptSvg.appendChild(circle);
        });
        if (pts.length > 0) {
            const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
            polyline.setAttribute("points", pts.join(" "));
            polyline.setAttribute("fill", "none");
            polyline.setAttribute("stroke", "#0ea5e9");
            polyline.setAttribute("stroke-width", "2");
            sptSvg.insertBefore(polyline, sptSvg.firstChild);
        }
    }
    cols[4].appendChild(sptSvg);
    
    const labSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    labSvg.setAttribute("width", "100%");
    labSvg.setAttribute("height", totalHeight);
    labSvg.style.position = "absolute";
    labSvg.style.top = "0";
    labSvg.style.left = "0";
    labSvg.style.zIndex = "1";
    
    for(let val=0; val<=100; val+=25) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", `${val}%`);
        line.setAttribute("x2", `${val}%`);
        line.setAttribute("y1", "0");
        line.setAttribute("y2", "100%");
        line.setAttribute("stroke", "#e4e4e7");
        line.setAttribute("stroke-dasharray", "4 4");
        labSvg.appendChild(line);
        
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        let xAttr = `calc(${val}% + 2px)`;
        let anchor = "start";
        if (val === 100) { xAttr = `calc(100% - 2px)`; anchor = "end"; }
        if (val > 0 && val < 100) { xAttr = `${val}%`; anchor = "middle"; }
        label.setAttribute("x", xAttr);
        label.setAttribute("y", "12");
        label.setAttribute("font-size", "10px");
        label.setAttribute("fill", "#a1a1aa");
        label.setAttribute("text-anchor", anchor);
        label.textContent = val;
        labSvg.appendChild(label);
    }
    
    if (atterberg.length > 0) {
        let llPts = [];
        let plPts = [];
        atterberg.forEach(test => {
            const y = (parseFloat(test.depth_m) || 0) * PIXELS_PER_METER;
            const wl = parseFloat(test.wl || test.liquid_limit);
            const wp = parseFloat(test.wp || test.plastic_limit);
            
            if (!isNaN(wl)) llPts.push(`${Math.min(Math.max(wl, 0), 100)}%,${y}`);
            if (!isNaN(wp)) plPts.push(`${Math.min(Math.max(wp, 0), 100)}%,${y}`);
            
            if (!isNaN(wl)) {
                let x = Math.min(Math.max(wl, 0), 100);
                const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                circle.setAttribute("cx", `${x}%`);
                circle.setAttribute("cy", y);
                circle.setAttribute("r", "5");
                circle.setAttribute("fill", "#ef4444");
                labSvg.appendChild(circle);
                
                const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
                label.setAttribute("x", `calc(${x}% + 8px)`);
                label.setAttribute("y", y + 4);
                label.setAttribute("font-size", "10px");
                label.setAttribute("fill", "#ef4444");
                label.textContent = wl.toFixed(1);
                labSvg.appendChild(label);
            }
            if (!isNaN(wp)) {
                let x = Math.min(Math.max(wp, 0), 100);
                const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                rect.setAttribute("x", `calc(${x}% - 4px)`);
                rect.setAttribute("y", y - 4);
                rect.setAttribute("width", "8");
                rect.setAttribute("height", "8");
                rect.setAttribute("fill", "#10b981");
                labSvg.appendChild(rect);
                
                const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
                label.setAttribute("x", `calc(${x}% - 8px)`);
                label.setAttribute("y", y + 4);
                label.setAttribute("font-size", "10px");
                label.setAttribute("fill", "#10b981");
                label.setAttribute("text-anchor", "end");
                label.textContent = wp.toFixed(1);
                labSvg.appendChild(label);
            }
            if (!isNaN(wl) && !isNaN(wp)) {
                let x1 = Math.min(Math.max(wl, 0), 100);
                let x2 = Math.min(Math.max(wp, 0), 100);
                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", `${x1}%`);
                line.setAttribute("x2", `${x2}%`);
                line.setAttribute("y1", y);
                line.setAttribute("y2", y);
                line.setAttribute("stroke", "#52525b");
                line.setAttribute("stroke-width", "1");
                labSvg.insertBefore(line, labSvg.firstChild);
            }
        });
        if (llPts.length > 0) {
            const poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
            poly.setAttribute("points", llPts.join(" "));
            poly.setAttribute("fill", "none");
            poly.setAttribute("stroke", "#ef4444");
            poly.setAttribute("stroke-dasharray", "2 2");
            labSvg.insertBefore(poly, labSvg.firstChild);
        }
        if (plPts.length > 0) {
            const poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
            poly.setAttribute("points", plPts.join(" "));
            poly.setAttribute("fill", "none");
            poly.setAttribute("stroke", "#10b981");
            poly.setAttribute("stroke-dasharray", "2 2");
            labSvg.insertBefore(poly, labSvg.firstChild);
        }
    }
    cols[5].appendChild(labSvg);
    
    const cptSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    cptSvg.setAttribute("width", "100%");
    cptSvg.setAttribute("height", totalHeight);
    cptSvg.style.position = "absolute";
    cptSvg.style.top = "0";
    cptSvg.style.left = "0";
    cptSvg.style.zIndex = "1";
    
    for(let val=0; val<=20; val+=5) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", `${val * 5}%`);
        line.setAttribute("x2", `${val * 5}%`);
        line.setAttribute("y1", "0");
        line.setAttribute("y2", "100%");
        line.setAttribute("stroke", "#e4e4e7");
        line.setAttribute("stroke-dasharray", "4 4");
        cptSvg.appendChild(line);
        
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        let xAttr = `calc(${val * 5}% + 2px)`;
        let anchor = "start";
        if (val === 20) { xAttr = `calc(100% - 2px)`; anchor = "end"; }
        if (val > 0 && val < 20) { xAttr = `${val * 5}%`; anchor = "middle"; }
        label.setAttribute("x", xAttr);
        label.setAttribute("y", "12");
        label.setAttribute("font-size", "10px");
        label.setAttribute("fill", "#a1a1aa");
        label.setAttribute("text-anchor", anchor);
        label.textContent = val;
        cptSvg.appendChild(label);
    }
    
    if (cpt.length > 0) {
        let pts = [];
        cpt.forEach(test => {
            const y = (parseFloat(test.depth_m) || 0) * PIXELS_PER_METER;
            let qc = parseFloat(test.qc_mpa);
            if (!isNaN(qc)) {
                if (qc > 20) qc = 20;
                pts.push(`${qc * 5}%,${y}`);
            }
        });
        if (pts.length > 0) {
            const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
            polyline.setAttribute("points", pts.join(" "));
            polyline.setAttribute("fill", "none");
            polyline.setAttribute("stroke", "#8b5cf6");
            polyline.setAttribute("stroke-width", "2");
            cptSvg.appendChild(polyline);
        }
    }
    cols[6].appendChild(cptSvg);
    
    extraTests.forEach((testKey, idx) => {
        const testData = properties[testKey] || [];
        const colIdx = 7 + idx;
        
        testData.forEach(test => {
            const y = (parseFloat(test.depth_m) || 0) * PIXELS_PER_METER;
            let vals = [];
            for (const [k, v] of Object.entries(test)) {
                if (k !== 'depth_m' && v !== "" && v !== null && v !== undefined) {
                    let shortK = k.split('_')[0];
                    if (shortK.length <= 2) shortK = k.split('_').slice(0,2).join('_');
                    vals.push(`${shortK}: ${v}`);
                }
            }
            if (vals.length > 0) {
                const txt = document.createElement('div');
                txt.style.position = "absolute";
                txt.style.top = `${y - 8}px`;
                txt.style.width = "100%";
                txt.style.textAlign = "center";
                txt.style.fontSize = "11px";
                txt.style.color = "#52525b";
                txt.style.padding = "0 4px";
                txt.style.boxSizing = "border-box";
                txt.style.wordWrap = "break-word";
                txt.innerText = vals.join(', ');
                cols[colIdx].appendChild(txt);
            }
        });
    });
    
    innerWrapper.appendChild(body);
    
    const remarks = properties.comments || properties.remarks || properties.notes || "";
    if (remarks) {
        const remarksDiv = document.createElement('div');
        remarksDiv.style.width = "100%";
        remarksDiv.style.maxWidth = `${totalWidth}px`;
        remarksDiv.style.padding = "16px";
        remarksDiv.style.boxSizing = "border-box";
        remarksDiv.style.backgroundColor = "#fafafa";
        remarksDiv.style.borderTop = "2px solid #d4d4d8";
        remarksDiv.style.fontSize = "13px";
        remarksDiv.style.color = "#3f3f46";
        remarksDiv.style.whiteSpace = "normal";
        remarksDiv.style.wordWrap = "break-word";
        remarksDiv.innerHTML = `<strong>Notes / Remarks:</strong> <br/> ${remarks}`;
        innerWrapper.appendChild(remarksDiv);
    }
    
    wrapper.appendChild(innerWrapper);
    container.appendChild(wrapper);
};


window.downloadBorelogSVG = function(geoJsonData, uid) {
    if (!geoJsonData) return;
    
    let properties = geoJsonData.properties || geoJsonData;
    let coords = geoJsonData.geometry && geoJsonData.geometry.coordinates ? geoJsonData.geometry.coordinates : null;
    let coordStr = coords ? `[${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}]` : "";
    
    const strata = properties.strata || [];
    const sptData = properties.spt_data || properties.spt_records || [];
    const atterberg = properties.atterberg_test_data || properties.atterberg_limits || [];
    const cpt = properties.cpt_data || [];
    
    let extraTests = Object.keys(properties).filter(k => Array.isArray(properties[k]) && k.endsWith('_test_data') && k !== 'atterberg_test_data');
    extraTests.sort();
    
    let maxDepth = 10;
    if (strata.length > 0) maxDepth = Math.max(maxDepth, ...strata.map(s => parseFloat(s.bottom_m) || 0));
    if (sptData.length > 0) maxDepth = Math.max(maxDepth, ...sptData.map(s => parseFloat(s.depth_m) || 0));
    if (atterberg.length > 0) maxDepth = Math.max(maxDepth, ...atterberg.map(s => parseFloat(s.depth_m) || 0));
    if (cpt.length > 0) maxDepth = Math.max(maxDepth, ...cpt.map(s => parseFloat(s.depth_m) || 0));
    extraTests.forEach(testKey => {
        const arr = properties[testKey] || [];
        if (arr.length > 0) maxDepth = Math.max(maxDepth, ...arr.map(s => parseFloat(s.depth_m) || 0));
    });
    maxDepth = Math.ceil(maxDepth) + 1;
    
    const remarksRaw = properties.comments || properties.remarks || properties.notes || "";
    const remarksHtml = parseMarkdown(remarksRaw);
    let remarksHeight = 0;
    if (remarksRaw) {
        const lines = remarksRaw.split('\n').length;
        remarksHeight = Math.max(100, lines * 20 + 60);
    }
    
    let dateStr = properties.date_of_starting_boring || properties.date_of_boring || "";
    if (properties.date_of_ending_boring && properties.date_of_ending_boring !== dateStr) {
        dateStr += " - " + properties.date_of_ending_boring;
    }
    const metaHeight = 120;
    const headerHeight = 40 + metaHeight;
    
    const PIXELS_PER_METER = 60;
    const totalHeight = headerHeight + maxDepth * PIXELS_PER_METER + remarksHeight;
    
    const baseWidth = 60 + 80 + 250 + 140 + 200 + 200 + 200; // 1130
    const extraColWidth = 200;
    const totalWidth = baseWidth + (extraTests.length * extraColWidth);
    
    const colOffsets = [0, 60, 140, 390, 530, 730, 930, 1130];
    let curOff = 1130;
    extraTests.forEach(() => {
        curOff += extraColWidth;
        colOffsets.push(curOff);
    });
    
    const headers = ["Depth (m)", "Stratum", "Description", "SPT Record", "SPT N-Value", "Atterberg Limits", "CPT qc (MPa)"];
    extraTests.forEach(testKey => {
        let name = testKey.replace('_test_data', '').replace(/_/g, ' ');
        name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        headers.push(name);
    });
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" style="background: white; font-family: sans-serif;">`;
    
    svg += `<rect x="0" y="0" width="${totalWidth}" height="${metaHeight}" fill="#ffffff" />`;
    svg += `<text x="24" y="24" font-size="14px" font-weight="bold" fill="#3f3f46">Borelog ID:</text><text x="130" y="24" font-size="14px" fill="#3f3f46">${properties.borelog_id || properties.borehole_id || properties.Name || ""}</text>`;
    svg += `<text x="24" y="44" font-size="14px" font-weight="bold" fill="#3f3f46">Project:</text><text x="130" y="44" font-size="14px" fill="#3f3f46">${properties.project || ""}</text>`;
    svg += `<text x="24" y="64" font-size="14px" font-weight="bold" fill="#3f3f46">Client:</text><text x="130" y="64" font-size="14px" fill="#3f3f46">${properties.client || ""}</text>`;
    svg += `<text x="24" y="84" font-size="14px" font-weight="bold" fill="#3f3f46">Location:</text><text x="130" y="84" font-size="14px" fill="#3f3f46">${properties.location || ""} ${coordStr}</text>`;
    
    svg += `<text x="550" y="24" font-size="14px" font-weight="bold" fill="#3f3f46">Date:</text><text x="660" y="24" font-size="14px" fill="#3f3f46">${dateStr}</text>`;
    svg += `<text x="550" y="44" font-size="14px" font-weight="bold" fill="#3f3f46">RL (m):</text><text x="660" y="44" font-size="14px" fill="#3f3f46">${properties.rl_m !== undefined ? properties.rl_m : ""}</text>`;
    svg += `<text x="550" y="64" font-size="14px" font-weight="bold" fill="#3f3f46">Water Table (m):</text><text x="680" y="64" font-size="14px" fill="#3f3f46">${properties.water_table_m !== undefined ? properties.water_table_m : ""}</text>`;
    
    svg += `<rect x="0" y="${metaHeight}" width="${totalWidth}" height="40" fill="#fafafa" stroke="#d4d4d8" stroke-width="2" />`;
    
    for(let i=0; i<maxDepth; i++) {
        if (i % 2 !== 0) {
            svg += `<rect x="0" y="${headerHeight + i * PIXELS_PER_METER}" width="${totalWidth}" height="${PIXELS_PER_METER}" fill="#f4f4f5" />`;
        }
    }
    
    for(let i=1; i<headers.length; i++) {
        svg += `<line x1="${colOffsets[i]}" y1="${metaHeight}" x2="${colOffsets[i]}" y2="${totalHeight - remarksHeight}" stroke="#e4e4e7" stroke-width="1" />`;
    }
    
    for(let i=0; i<headers.length; i++) {
        const cx = (colOffsets[i] + colOffsets[i+1]) / 2;
        svg += `<text x="${cx}" y="${metaHeight + 25}" font-size="13px" font-weight="bold" fill="#3f3f46" text-anchor="middle">${headers[i]}</text>`;
    }
    
    for (let i = 0; i <= maxDepth; i++) {
        const y = headerHeight + i * PIXELS_PER_METER;
        let textY = y + 4;
        if (i === 0) textY = y + 12;
        if (i === maxDepth) textY = y - 4;
        svg += `<text x="30" y="${textY}" font-size="12px" font-weight="500" fill="#71717a" text-anchor="middle">${i.toFixed(1)}</text>`;
    }
    
    strata.forEach(s => {
        const top = parseFloat(s.top_m) || 0;
        const bot = parseFloat(s.bottom_m) || 0;
        const h = (bot - top) * PIXELS_PER_METER;
        const y = headerHeight + top * PIXELS_PER_METER;
        
        const color = getColorForClass(s.class || s.uscs_class);
        svg += `<rect x="${colOffsets[1] + 8}" y="${y}" width="64" height="${h}" fill="${color}" stroke="rgba(0,0,0,0.1)" stroke-width="1" />`;
        svg += `<text x="${colOffsets[1] + 40}" y="${y + h/2 + 4}" font-size="12px" font-weight="bold" fill="#333" text-anchor="middle">${s.class || s.uscs_class || ""}</text>`;
        
        svg += `<foreignObject x="${colOffsets[2]}" y="${y}" width="250" height="${h}">
            <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%; height:100%; padding: 4px 8px; box-sizing: border-box; font-size: 13px; color: #3f3f46; display: flex; align-items: center; border-bottom: 1px dashed #d4d4d8; overflow: hidden;">
                ${s.description || ""}
            </div>
        </foreignObject>`;
    });
    
    sptData.forEach(spt => {
        const y = headerHeight + (parseFloat(spt.depth_m) || 0) * PIXELS_PER_METER;
        const b1 = spt.blows_0_150 ?? spt.blows_150 ?? "";
        const b2 = spt.blows_150_300 ?? spt.blows_300 ?? "";
        const b3 = spt.blows_300_450 ?? spt.blows_450 ?? "";
        
        let blowsStr = [b1, b2, b3].filter(b => b !== "").join(", ");
        const nval = spt.n_value || "-";
        
        svg += `<text x="${colOffsets[3] + 70}" y="${y + 4}" font-size="12px" fill="#a1a1aa" text-anchor="middle">${blowsStr}, N=${nval}</text>`;
    });
    
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
            const wl = parseFloat(test.wl || test.liquid_limit);
            const wp = parseFloat(test.wp || test.plastic_limit);
            
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
    
    extraTests.forEach((testKey, idx) => {
        const testData = properties[testKey] || [];
        const colIdx = 7 + idx;
        const xCenter = (colOffsets[colIdx] + colOffsets[colIdx+1]) / 2;
        
        testData.forEach(test => {
            const y = headerHeight + (parseFloat(test.depth_m) || 0) * PIXELS_PER_METER;
            let vals = [];
            for (const [k, v] of Object.entries(test)) {
                if (k !== 'depth_m' && v !== "" && v !== null && v !== undefined) {
                    let shortK = k.split('_')[0]; 
                    if (shortK.length <= 2) shortK = k.split('_').slice(0,2).join('_'); 
                    vals.push(`${shortK}: ${v}`);
                }
            }
            if (vals.length > 0) {
                svg += `<text x="${xCenter}" y="${y + 4}" font-size="10px" fill="#52525b" text-anchor="middle">${vals.join(', ')}</text>`;
            }
        });
    });
    
    svg += `<line x1="0" y1="${totalHeight - remarksHeight}" x2="${totalWidth}" y2="${totalHeight - remarksHeight}" stroke="#d4d4d8" stroke-width="2" />`;
    
    if (remarksRaw) {
        const bgY = totalHeight - remarksHeight;
        svg += `<rect x="0" y="${bgY}" width="${totalWidth}" height="${remarksHeight}" fill="#fafafa" />`;
        svg += `<text x="16" y="${bgY + 24}" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#3f3f46">Notes / Remarks:</text>`;
        
        let lineY = bgY + 44;
        const lines = remarksRaw.split('\n');
        lines.forEach(line => {
            svg += `<text x="16" y="${lineY}" font-family="Arial, sans-serif" font-size="13" fill="#3f3f46">${line || ' '}</text>`;
            lineY += 20;
        });
    }
    
    svg += `</svg>`;
    
    const blob = new Blob([svg], {type: "image/svg+xml;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Borelog_${properties.borelog_id || 'Vector'}.svg`;
    link.click();
    URL.revokeObjectURL(url);
};

