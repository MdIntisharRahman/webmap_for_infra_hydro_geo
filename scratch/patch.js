const fs = require('fs');
let code = fs.readFileSync('frontend/app.js', 'utf8');

const regex = /let subHTML = \<div style="display: flex; gap: 8px; overflow: hidden; white-space: nowrap; flex: 1;">\;[\s\S]*?(?=map\.on\('layeradd')/;

let newLogic = \
                            subLegendUI.innerHTML = "";
                            const renderLegends = () => {
                                const containerWidth = subLegendUI.clientWidth || 200;
                                let available = containerWidth - 30; // 30px for +X button
                                let subHTML = \\\<div style="display: flex; gap: 8px; overflow: hidden; white-space: nowrap; flex: 1;">\\\;
                                let count = 0;
                                let rendered = 0;
                                for (const [cName, cColor] of classEntries) {
                                    // Estimate width: 15px for dot/gap + ~6.5px per char + 10px padding
                                    let estWidth = 15 + (cName.length * 6.5);
                                    if (estWidth > 75) estWidth = 75; // max-width is 55px + 20px
                                    
                                    if (available - estWidth > 0) {
                                        subHTML += \\\<span style="display: flex; align-items: center; gap: 3px; flex-shrink: 0;" title="\\\"><div style="width: 6px; height: 6px; border-radius: 50%; background: \\\; flex-shrink: 0;"></div><span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 55px;">\\\</span></span>\\\;
                                        available -= (estWidth + 8); // gap
                                        rendered++;
                                    } else {
                                        break;
                                    }
                                    count++;
                                }
                                subHTML += \\\</div>\\\;
                                
                                const remaining = classEntries.length - rendered;
                                if (remaining > 0) {
                                    subHTML += \\\<div class="legend-more-btn" title="See all classes" style="flex-shrink: 0; width: 24px; height: 18px; border-radius: 10px; background: #e2e8f0; color: var(--text-dim); font-size: 10px; font-weight: bold; display: flex; align-items: center; justify-content: center; cursor: pointer;">+\\\</div>\\\;
                                }
                                subLegendUI.innerHTML = subHTML;
                                
                                const moreBtn = subLegendUI.querySelector('.legend-more-btn');
                                if (moreBtn) {
                                    moreBtn.addEventListener("click", (e) => {
                                        e.stopPropagation();
                                        const rightPanelTitle = document.getElementById("right-panel-title");
                                        const rightPanelContent = document.getElementById("right-panel-content");
                                        const rightPanelContainer = document.getElementById("right-panel-container");
                                        if (rightPanelTitle) rightPanelTitle.textContent = layerInfo.name;
                                        if (rightPanelContent) {
                                            rightPanelContent.innerHTML = "";
                                            for (const [cName, cData] of classEntries) {
                                                rightPanelContent.innerHTML += \\\<div class="right-legend-item"><div class="right-legend-color" style="background: \\\;"></div><span>\\\</span></div>\\\;
                                            }
                                        }
                                        if (rightPanelContainer) rightPanelContainer.classList.add("pinned");
                                    });
                                }
                            };
                            
                            // Initial render (might have 0 clientWidth if display is none, so setTimeout)
                            setTimeout(renderLegends, 50);
                            
                            // Re-render on resize
                            const ro = new ResizeObserver(() => {
                                // Only re-render if width changed significantly to avoid infinite loops
                                if (subLegendUI.clientWidth > 0 && Math.abs(subLegendUI.clientWidth - (subLegendUI._lastWidth || 0)) > 10) {
                                    subLegendUI._lastWidth = subLegendUI.clientWidth;
                                    renderLegends();
                                }
                            });
                            ro.observe(subLegendUI);
                            
                            // Cleanup observer when item is removed or unchecked
                            item._ro = ro;
\ + "\n                            ";

code = code.replace(regex, newLogic);
fs.writeFileSync('frontend/app.js', code);
