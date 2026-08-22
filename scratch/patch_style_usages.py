import re

with open('frontend/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the style block
new_style = "style: (feature) => getFeatureStyle(feature, color)"
code = re.sub(r'style:\s*\(feature\)\s*=>\s*\{.*?\}(?=\s*,\s*onEachFeature)', new_style, code, flags=re.DOTALL)

# Replace the mouseover setStyle
old_mouseover = r"layer\.setStyle\(\{ weight: 5, color: '#38bdf8', fillOpacity: 0\.8 \}\);"
new_mouseover = r"layer.setStyle(getHighlightStyle(feature, color));"
code = re.sub(old_mouseover, new_mouseover, code)

# Note: there is also one in `click:`
old_click = r"layer\.setStyle\(\{ weight: 5, color: '#38bdf8', fillOpacity: 0\.8 \}\);"
code = re.sub(old_click, new_mouseover, code)

with open('frontend/app.js', 'w', encoding='utf-8') as f:
    f.write(code)
print("Style usages replaced!")
