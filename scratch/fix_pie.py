with open('frontend/app.js', 'r') as f:
    js = f.read()

old_logic = r'''                        const classMap = new Map();
                        if (data.features) {
                            for (const feat of data.features) {
                                if (feat.properties && feat.properties.f_class_name && feat.properties.color) {
                                    classMap.set(feat.properties.f_class_name, feat.properties.color);
                                }
                            }
                        }
                        const hasClasses = classMap.size > 0;
                        if (hasClasses) {
                            colorUI.innerHTML = `<div style="width: 12px; height: 12px; margin-right: 6px;"></div>`;
                            let subHTML = `<div class="layer-sub-legend">`;'''

new_logic = r'''                        const classMap = new Map();
                        if (data.features) {
                            for (const feat of data.features) {
                                if (feat.properties && feat.properties.f_class_name) {
                                    let clr = feat.properties.color || feat.properties.f_class_color;
                                    if (clr) {
                                        if (!clr.startsWith('#')) clr = '#' + clr;
                                        classMap.set(feat.properties.f_class_name, clr);
                                    }
                                }
                            }
                        }
                        const hasClasses = classMap.size > 0;
                        if (hasClasses) {
                            const classEntries = Array.from(classMap.entries());
                            let gradientParts = [];
                            let pct = 100 / classEntries.length;
                            for (let i = 0; i < classEntries.length; i++) {
                                let c = classEntries[i][1];
                                gradientParts.push(`${c} ${i*pct}% ${(i+1)*pct}%`);
                            }
                            let bg = `conic-gradient(${gradientParts.join(', ')})`;
                            colorUI.innerHTML = `<div style="width: 12px; height: 12px; border-radius: 50%; background: ${bg}; margin-right: 6px; flex-shrink:0;"></div>`;
                            let subHTML = `<div class="layer-sub-legend">`;'''

if old_logic in js:
    print('Match found, replacing...')
    js = js.replace(old_logic, new_logic)
    with open('frontend/app.js', 'w') as f:
        f.write(js)
else:
    print('Match not found!')

with open('frontend/index.html', 'r') as f:
    html = f.read()
html = html.replace('v=33', 'v=34')
with open('frontend/index.html', 'w') as f:
    f.write(html)
