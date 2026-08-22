import re

with open('frontend/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

styles_funcs = """
const getHighlightStyle = (feature, color) => {
    const isPolygon = feature.geometry.type.includes("Polygon");
    return {
        weight: isPolygon ? 1.5 : 2.5,
        color: "#4a5568",
        fillOpacity: isPolygon ? 0.6 : 1,
        opacity: 1,
    };
};

const getFeatureStyle = (feature, defaultColor) => {
    let color = defaultColor;
    let weight = 1.5;

    if (feature.properties && feature.properties.f_class_color) {
        color = feature.properties.f_class_color;
    }

    const geomType = feature.geometry.type;
    const isPolygon = geomType.includes("Polygon");

    if (
        feature.properties &&
        feature.properties.f_class_weight !== undefined &&
        feature.properties.f_class_weight !== null
    ) {
        let pct = parseFloat(feature.properties.f_class_weight);
        if (pct === 0) {
            return { weight: 0, opacity: 0, fillOpacity: 0, color: "transparent" };
        }
        weight = isPolygon ? (0.75 * pct) / 100 : (1.5 * pct) / 100;
    } else {
        weight = isPolygon ? 0.75 : 1.5;
    }

    let finalOpacity = 0.8;
    let finalFillOpacity = isPolygon ? 0.3 : 1;

    if (
        feature.properties &&
        feature.properties.f_class_transparency !== undefined &&
        feature.properties.f_class_transparency !== null &&
        feature.properties.f_class_transparency !== ""
    ) {
        const t = parseFloat(feature.properties.f_class_transparency);
        if (!isNaN(t)) {
            finalOpacity = (100 - t) / 100;
            finalFillOpacity = isPolygon ? Math.min(0.3, finalOpacity) : finalOpacity;
        }
    }

    return {
        color: color,
        fillColor: color,
        weight: weight,
        fillOpacity: finalFillOpacity,
        opacity: finalOpacity,
        lineCap: "round",
    };
};
"""

# Insert it before `// TOOLTIP RENDERING` or `// ============================================================================`
if "// TOOLTIP RENDERING" not in code:
    print("Warning: Tooltip rendering not found")
else:
    code = code.replace("// TOOLTIP RENDERING", styles_funcs + "\n// TOOLTIP RENDERING")

with open('frontend/app.js', 'w', encoding='utf-8') as f:
    f.write(code)
print("Style funcs injected!")
