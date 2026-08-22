with open("frontend/styles.css", "a") as f:
    f.write("""
/* Credit Button */
.credit-btn {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #e2e8f0;
    color: var(--text-dim);
    font-size: 10px;
    font-weight: 700;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    border: 1px solid #cbd5e1;
    transition: all 0.2s;
    flex-shrink: 0;
    margin-left: 4px;
}
.credit-btn:hover {
    background: var(--accent-blue);
    color: white;
    border-color: var(--accent-blue);
}
""")

import re

with open("frontend/app.js", "r") as f:
    app_js = f.read()

old_item_html = """            item.innerHTML = `
                <div class="layer-info-container" style="display: flex; flex-direction: column; gap: 4px; flex: 1; overflow: hidden; margin-right: 12px;">
                    <div class="layer-info">
                        ${layerColorUI}
                        <span class="layer-name">${layerInfo.name}</span>
                    </div>
                    ${subLegendUI}
                </div>
                <div class="toggle-switch"></div>
            `;"""

new_item_html = """            let creditBtnUI = "";
            if (layerInfo.credit_page) {
                creditBtnUI = `<div class="credit-btn" data-url="/credits/${layerInfo.credit_page}" title="View Credits">Cr</div>`;
            }

            item.innerHTML = `
                <div class="layer-info-container" style="display: flex; flex-direction: column; gap: 4px; flex: 1; overflow: hidden; margin-right: 12px;">
                    <div class="layer-info" style="display: flex; align-items: center; justify-content: space-between; overflow: hidden; width: 100%;">
                        <div style="display: flex; align-items: center; overflow: hidden; position: relative; flex: 1;">
                            ${layerColorUI}
                            <div class="sliding-name-container" style="overflow: hidden; white-space: nowrap; position: relative; flex: 1; margin-left: 10px;">
                                <span class="layer-name sliding-name" style="display: inline-block; transition: transform 2s ease-in-out;">${layerInfo.name}</span>
                            </div>
                        </div>
                        ${creditBtnUI}
                    </div>
                    ${subLegendUI}
                </div>
                <div class="toggle-switch"></div>
            `;
            
            const crBtn = item.querySelector(".credit-btn");
            if (crBtn) {
                crBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    window.open(crBtn.dataset.url, '_blank');
                });
            }

            const container = item.querySelector('.sliding-name-container');
            const nameEl = item.querySelector('.sliding-name');
            item.addEventListener('mouseenter', () => {
                const diff = nameEl.scrollWidth - container.clientWidth;
                if (diff > 0) {
                    nameEl.style.transform = `translateX(-${diff + 5}px)`;
                }
            });
            item.addEventListener('mouseleave', () => {
                nameEl.style.transform = 'translateX(0)';
            });"""

if old_item_html in app_js:
    app_js = app_js.replace(old_item_html, new_item_html)
    with open("frontend/app.js", "w") as f:
        f.write(app_js)
    print("frontend/app.js patched successfully")
else:
    print("Warning: old_item_html not found in frontend/app.js")
