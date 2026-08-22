with open('frontend/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    'style: (feature) => getFeatureStyle(feature, color),',
    'style: (feature) => getFeatureStyle(feature, color, layerInfo.transparency),'
)

code = code.replace(
    'layer.setStyle(getHighlightStyle(feature, color));',
    'layer.setStyle(getHighlightStyle(feature, color, layerInfo.transparency));'
)

with open('frontend/app.js', 'w', encoding='utf-8') as f:
    f.write(code)
print("done")
