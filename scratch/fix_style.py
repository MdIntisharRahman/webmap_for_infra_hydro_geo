with open('frontend/app.js', 'r') as f:
    js = f.read()

old_style = r'''                            style: (feature) => {
                                if (feature.properties && feature.properties.color) {
                                    let c = feature.properties.color;
                                    if (!c.startsWith("#")) c = "#" + c;
                                    return { color: c, weight: 2, fillOpacity: 0.6 };
                                }
                                return { color: color, weight: 2, fillOpacity: 0.6 };
                            },'''

new_style = r'''                            style: (feature) => {
                                let c = color;
                                let w = 2; // base weight
                                let opacity = 0.6; // base opacity

                                if (feature.properties) {
                                    if (feature.properties.color) {
                                        c = feature.properties.color;
                                    } else if (feature.properties.f_class_color) {
                                        c = feature.properties.f_class_color;
                                    }
                                    if (c && !c.startsWith('#')) c = '#' + c;
                                    
                                    if (feature.properties.f_class_weight !== undefined && feature.properties.f_class_weight !== null) {
                                        let fw = parseFloat(feature.properties.f_class_weight);
                                        if (fw === 0) {
                                            w = 0;
                                            opacity = 0;
                                        } else {
                                            w = 2 * (fw / 100);
                                        }
                                    }
                                }
                                return { color: c, weight: w, fillOpacity: opacity, opacity: opacity };
                            },'''

if old_style in js:
    print('Match found, replacing...')
    js = js.replace(old_style, new_style)
    with open('frontend/app.js', 'w') as f:
        f.write(js)
else:
    print('Match not found!')

with open('frontend/index.html', 'r') as f:
    html = f.read()
html = html.replace('v=32', 'v=33')
with open('frontend/index.html', 'w') as f:
    f.write(html)
