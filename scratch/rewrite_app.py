import re

with open('frontend/app.js', 'r') as f:
    js = f.read()

# 1. Add dataset table to item
js = js.replace('item.className = "layer-item";', 'item.className = "layer-item";\n            item.dataset.table = layerInfo.table;')

# 2. Update the Point Data Estimator API call
new_fetch = '''const activeTables = Array.from(document.querySelectorAll('.layer-item.active'))
                                .map(el => el.dataset.table)
                                .filter(Boolean)
                                .join(',');
        const res = await fetch(
            `${API_BASE_URL}/estimate_water_levels?lat=${lat}&lng=${lng}&active_tables=${activeTables}`,
        );'''
js = re.sub(r'const res = await fetch\(\s*`\$\{API_BASE_URL\}/estimate_water_levels\?lat=\$\{lat\}&lng=\$\{lng\}`,\s*\);', new_fetch, js)

with open('frontend/app.js', 'w') as f:
    f.write(js)
print('Patched app.js')
