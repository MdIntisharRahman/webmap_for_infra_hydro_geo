
import re

with open('frontend/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'const colorGroups = new Map\(\);.*?const classMap = new Map\(\);', re.DOTALL)

replacement = r'''let performClassification = true;
                        let explicitClassifyWith = null;
                        if (layerInfo.classify_with) {
                            let val = layerInfo.classify_with.trim();
                            if (val.toLowerCase() === 'no') {
                                performClassification = false;
                            } else if (val !== '') {
                                explicitClassifyWith = val;
                            }
                        }

                        const colorGroups = new Map();
                        if (performClassification && data.features) {
                            for (const feat of data.features) {
                                if (feat.properties) {
                                    let clr = feat.properties.color || feat.properties.f_class_color || feat.properties.stroke_color || null;
                                    
                                    if (explicitClassifyWith) {
                                        let name = feat.properties[explicitClassifyWith];
                                        if (name !== undefined && name !== null) {
                                            clr = clr || '#9aa5b1';
                                            if (clr && !clr.startsWith('#') && !clr.startsWith('rgb')) clr = '#' + clr;
                                            if (!colorGroups.has(clr)) colorGroups.set(clr, new Set());
                                            colorGroups.get(clr).add(String(name));
                                        }
                                    } else {
                                        if (clr || feat.properties.f_class_name) {
                                            clr = clr || '#9aa5b1';
                                            if (clr && !clr.startsWith('#') && !clr.startsWith('rgb')) clr = '#' + clr;
                                            let name = feat.properties.f_class_name;
                                            if (name === undefined || name === null) {
                                                for (const key in feat.properties) {
                                                    if (!['keys', 'original_id', 'f_class_color', 'color', 'stroke_color', 'fill_color'].includes(key)) {
                                                        name = feat.properties[key];
                                                        break;
                                                    }
                                                }
                                            }
                                            if (name !== undefined && name !== null) {
                                                if (!colorGroups.has(clr)) colorGroups.set(clr, new Set());
                                                colorGroups.get(clr).add(String(name));
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        const classMap = new Map();'''

new_content = pattern.sub(replacement, content, count=1)
with open('frontend/app.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

