with open('frontend/app.js', 'r') as f:
    js = f.read()

old_html = r'''            item.innerHTML = `
                <div class="layer-info-container" style="display: flex; flex-direction: column; gap: 4px; flex: 1; overflow: hidden; margin-right: 12px;">
                    <div class="layer-info" style="display: flex; align-items: center; justify-content: space-between; overflow: hidden; width: 100%;">
                        <div style="display: flex; align-items: center; overflow: hidden; position: relative; flex: 1;">
                            <div style="display:flex; align-items:center; justify-content:center; width:18px; height:18px; margin-right:4px;"><input id="${checkboxId}" class="layer-load-cb" type="checkbox" style="transform: scale(0.63); margin:0; cursor:pointer;" ${isLoaded ? 'checked' : ''}></div>
                            <div class="layer-color-ui" style="display:flex; align-items:center;"></div>
                            <div class="sliding-name-container" style="overflow: hidden; white-space: nowrap; position: relative; flex: 1; margin-left: 6px;">
                                <span class="layer-name sliding-name" style="display: inline-block; transition: transform 2s ease-in-out;">${layerInfo.name}</span>
                            </div>
                        </div>
                        ${creditBtnUI}
                    </div>
                    <div class="sub-legend-ui"></div>
                </div>
                <div class="toggle-switch"></div>
            `;'''

new_html = r'''            item.style.flexDirection = 'column';
            item.style.alignItems = 'stretch';
            item.style.justifyContent = 'flex-start';
            item.style.gap = '6px';
            item.innerHTML = `
                <div class="layer-info" style="display: flex; align-items: center; justify-content: space-between; overflow: hidden; width: 100%;">
                    <div style="display: flex; align-items: center; overflow: hidden; position: relative; flex: 1;">
                        <div style="display:flex; align-items:center; justify-content:center; width:18px; height:18px; margin-right:4px; flex-shrink:0;"><input id="${checkboxId}" class="layer-load-cb" type="checkbox" style="transform: scale(0.63); margin:0; cursor:pointer;" ${isLoaded ? 'checked' : ''}></div>
                        <div class="layer-color-ui" style="display:flex; align-items:center; flex-shrink:0;"></div>
                        <div class="sliding-name-container" style="overflow: hidden; white-space: nowrap; position: relative; flex: 1; margin-left: 6px;">
                            <span class="layer-name sliding-name" style="display: inline-block; transition: transform 2s ease-in-out;">${layerInfo.name}</span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; flex-shrink:0; margin-left:8px;">
                        ${creditBtnUI}
                        <div class="toggle-switch"></div>
                    </div>
                </div>
                <div class="sub-legend-ui"></div>
            `;'''

if old_html in js:
    print('Match found, replacing...')
    js = js.replace(old_html, new_html)
    with open('frontend/app.js', 'w') as f:
        f.write(js)
else:
    print('Match NOT found')
