import re

with open('frontend/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Replace the item.innerHTML generation
html_old = """            item.style.flexDirection = 'column';
            item.style.alignItems = 'stretch';
            item.style.justifyContent = 'flex-start';
            item.style.gap = '6px';
            item.innerHTML = `
                <div class="layer-info" style="width: 100%;">
                    ${checkboxUI}
                    <div class="layer-color-ui" style="display:flex; align-items:center; flex-shrink:0;"><div style="width: 12px; height: 12px; border-radius: 50%; background: #cbd5e1;"></div></div>
                    <span class="layer-name sliding-name" style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${layerInfo.name}">${layerInfo.name}</span>
                    ${creditBtnUI}
                    <div class="toggle-switch" style="margin-left: auto; flex-shrink:0;"></div>
                </div>
                <div class="sub-legend-ui" style="width: 100%; padding-left: 50px; box-sizing: border-box;"></div>
            `;"""

html_new = """            // Restore v6 layout structure
            item.innerHTML = `
                <div class="layer-info-container" style="display: flex; flex-direction: column; gap: 4px; flex: 1; overflow: hidden; margin-right: 12px;">
                    <div class="layer-info" style="display: flex; align-items: center; gap: 10px; overflow: hidden;">
                        ${checkboxUI}
                        <div class="layer-color-ui" style="display:flex; align-items:center; flex-shrink:0;"><div style="width: 12px; height: 12px; border-radius: 50%; background: #cbd5e1;"></div></div>
                        <span class="layer-name sliding-name" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${layerInfo.name}">${layerInfo.name}</span>
                        ${creditBtnUI}
                    </div>
                    <div class="sub-legend-ui" style="display: flex; gap: 6px; align-items: center; margin-left: 50px; width: calc(100% - 50px); font-size: 9px; color: var(--text-dim); font-weight: 600;"></div>
                </div>
                <div class="toggle-switch" style="flex-shrink: 0;"></div>
            `;"""

code = code.replace(html_old, html_new)

# 2. Replace the dynamic legend population
legend_old = """                            let subHTML = `<div class="layer-sub-legend">`;
                            let count = 0;
                            for (const [cName, cColor] of classEntries) {
                                if (count < 3) {
                                    subHTML += `<div class="legend-pill" title="${cName}"><div class="legend-color-dot" style="background: ${cColor};"></div><span class="legend-pill-text">${cName}</span></div>`;
                                }
                                count++;
                            }
                            if (count > 3) {
                                subHTML += `<div class="legend-more-btn">+${count - 3}</div>`;
                            }
                            subHTML += `</div>`;"""

legend_new = """                            let subHTML = `<div style="display: flex; gap: 8px; overflow: hidden; white-space: nowrap; flex: 1;">`;
                            let count = 0;
                            for (const [cName, cColor] of classEntries) {
                                if (count < 3) {
                                    subHTML += `<span style="display: flex; align-items: center; gap: 3px; flex-shrink: 0;" title="${cName}"><div style="width: 6px; height: 6px; border-radius: 50%; background: ${cColor}; flex-shrink: 0;"></div><span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 55px;">${cName}</span></span>`;
                                }
                                count++;
                            }
                            subHTML += `</div>`;
                            if (count > 3) {
                                subHTML += `<div class="legend-more-btn" title="See all classes" style="flex-shrink: 0; width: 14px; height: 14px; border-radius: 50%; background: #e2e8f0; color: var(--text-dim); font-size: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer;">+${count - 3}</div>`;
                            }"""

code = code.replace(legend_old, legend_new)

with open('frontend/app.js', 'w', encoding='utf-8') as f:
    f.write(code)
print("HTML and Legend replaced!")
