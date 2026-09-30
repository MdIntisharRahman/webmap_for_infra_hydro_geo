import re

with open('frontend/resources/BorelogVisualizer.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacement_cpt = """    if (cpt.length > 0) {
        cols[6].style.display = "flex";
        cols[6].style.flexDirection = "row";
        
        const drawCptPlot = (key, maxVal, color) => {
            const wrapper = document.createElement('div');
            wrapper.style.flex = "1";
            wrapper.style.position = "relative";
            wrapper.style.borderRight = "1px solid #e4e4e7";
            
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("width", "100%");
            svg.setAttribute("height", totalHeight);
            svg.style.position = "absolute";
            svg.style.top = "0";
            svg.style.left = "0";
            svg.style.zIndex = "1";
            
            for(let val=0; val<=maxVal; val+=maxVal/4) {
                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", `${(val/maxVal)*100}%`);
                line.setAttribute("x2", `${(val/maxVal)*100}%`);
                line.setAttribute("y1", "0");
                line.setAttribute("y2", "100%");
                line.setAttribute("stroke", "#e4e4e7");
                line.setAttribute("stroke-dasharray", "4 4");
                svg.appendChild(line);
                
                const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
                let xAttr = `calc(${(val/maxVal)*100}% + 2px)`;
                let anchor = "start";
                if (val === maxVal) { xAttr = `calc(100% - 2px)`; anchor = "end"; }
                if (val > 0 && val < maxVal) { xAttr = `${(val/maxVal)*100}%`; anchor = "middle"; }
                label.setAttribute("x", xAttr);
                label.setAttribute("y", "12");
                label.setAttribute("font-size", "10px");
                label.setAttribute("fill", "#a1a1aa");
                label.textContent = val;
                svg.appendChild(label);
            }
            
            let pts = [];
            cpt.forEach(test => {
                const y = (parseFloat(test.depth_m) || 0) * PIXELS_PER_METER;
                let v = parseFloat(test[key]);
                if (!isNaN(v)) {
                    if (v > maxVal) v = maxVal;
                    pts.push(`${(v/maxVal)*100}%,${y}`);
                }
            });
            if (pts.length > 0) {
                const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
                polyline.setAttribute("points", pts.join(" "));
                polyline.setAttribute("fill", "none");
                polyline.setAttribute("stroke", color);
                polyline.setAttribute("stroke-width", "2");
                svg.appendChild(polyline);
            }
            wrapper.appendChild(svg);
            return wrapper;
        };

        cols[6].appendChild(drawCptPlot('qc_mpa', 20, '#8b5cf6'));
        cols[6].appendChild(drawCptPlot('rf_percent', 10, '#ec4899'));
        
        const u2Wrapper = drawCptPlot('u2_kpa', 500, '#06b6d4');
        u2Wrapper.style.borderRight = "none";
        cols[6].appendChild(u2Wrapper);
    }"""

content = re.sub(r'    const cptSvg = document\.createElementNS\("http://www\.w3\.org/2000/svg", "svg"\).*?cols\[6\]\.appendChild\(cptSvg\);', replacement_cpt, content, flags=re.DOTALL)

with open('frontend/resources/BorelogVisualizer.js', 'w', encoding='utf-8') as f:
    f.write(content)
