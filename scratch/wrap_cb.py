import re

with open('frontend/app.js', 'r') as f:
    js = f.read()

# Replace old checkbox UI
old_str = r'<input id="\$\{checkboxId\}" class="layer-load-cb" type="checkbox" style="margin-right: 2px; flex-shrink: 0; transform: scale\(0.63\); margin-top: 1px;" \$\{isLoaded \? \'checked\' : \'\'\}>'
new_str = r'<div style="display:flex; align-items:center; justify-content:center; width:18px; height:18px; margin-right:4px;"><input id="${checkboxId}" class="layer-load-cb" type="checkbox" style="transform: scale(0.63); margin:0; cursor:pointer;" ${isLoaded ? \'checked\' : \'\'}></div>'

js = re.sub(old_str, new_str, js)

with open('frontend/app.js', 'w') as f:
    f.write(js)
print('Wrapped checkbox')
