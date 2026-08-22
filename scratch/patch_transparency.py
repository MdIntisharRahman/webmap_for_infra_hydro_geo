import re

with open('frontend/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add window.allLayerConfigs
if 'window.allLayerConfigs =' not in code:
    code = code.replace('const tabsContainerEl', 'window.allLayerConfigs = [];\nconst tabsContainerEl')

if 'window.allLayerConfigs = layers;' not in code:
    code = code.replace('const layers = await response.json();', 'const layers = await response.json();\n        window.allLayerConfigs = layers;')

# 2. Update getFeatureStyle signature and logic
old_style_sig = "const getFeatureStyle = (feature, defaultColor) => {"
new_style_sig = "const getFeatureStyle = (feature, defaultColor, layerTransparency = null) => {"
code = code.replace(old_style_sig, new_style_sig)

old_opacity_logic = """    let finalOpacity = 0.8;
    let finalFillOpacity = isPolygon ? 0.3 : 1;

    if (
        feature.properties &&
        feature.properties.f_class_transparency !== undefined &&
        feature.properties.f_class_transparency !== null &&
        feature.properties.f_class_transparency !== ""
    ) {
        const t = parseFloat(feature.properties.f_class_transparency);
        if (!isNaN(t)) {
            // Convert transparency percentage to opacity (e.g., 20% transparent = 80% opaque = 0.8)
            finalOpacity = (100 - t) / 100;
            // Scale fill opacity proportionally if it is a polygon
            finalFillOpacity = isPolygon ? Math.min(0.3, finalOpacity) : finalOpacity;
        }
    }"""

new_opacity_logic = """    if (layerTransparency !== null && layerTransparency < 0) {
        return { weight: 0, opacity: 0, fillOpacity: 0, color: "transparent", interactive: false };
    }

    let finalOpacity = 0.8;
    let finalFillOpacity = isPolygon ? 0.3 : 1;

    let t = null;
    if (layerTransparency !== null && layerTransparency > 0) {
        t = parseFloat(layerTransparency);
    } else if (
        feature.properties &&
        feature.properties.f_class_transparency !== undefined &&
        feature.properties.f_class_transparency !== null &&
        feature.properties.f_class_transparency !== ""
    ) {
        t = parseFloat(feature.properties.f_class_transparency);
    }
    
    if (t !== null && !isNaN(t)) {
        finalOpacity = (100 - t) / 100;
        finalFillOpacity = isPolygon ? Math.min(0.3, finalOpacity) : finalOpacity;
    }"""
code = code.replace(old_opacity_logic, new_opacity_logic)

# 3. Update getHighlightStyle to handle hidden layers
old_hl_sig = "const getHighlightStyle = (feature, defaultColor) => {"
new_hl_sig = "const getHighlightStyle = (feature, defaultColor, layerTransparency = null) => {"
code = code.replace(old_hl_sig, new_hl_sig)

old_hl_opacity = """    let finalOpacity = 1;
    let finalFillOpacity = isPolygon ? 0.5 : 1;"""

new_hl_opacity = """    if (layerTransparency !== null && layerTransparency < 0) {
        return { weight: 0, opacity: 0, fillOpacity: 0, color: "transparent", interactive: false };
    }
    let finalOpacity = 1;
    let finalFillOpacity = isPolygon ? 0.5 : 1;"""
code = code.replace(old_hl_opacity, new_hl_opacity)

with open('frontend/app.js', 'w', encoding='utf-8') as f:
    f.write(code)
print("done")
