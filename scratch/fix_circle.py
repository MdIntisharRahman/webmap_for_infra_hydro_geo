with open('frontend/app.js', 'r') as f:
    js = f.read()

default_circle = '<div style="width: 12px; height: 12px; border-radius: 50%; background: #cbd5e1; margin-right: 6px; flex-shrink:0;"></div>'

# 1. Update the template
old_template = '<div class="layer-color-ui" style="display:flex; align-items:center; flex-shrink:0;"></div>'
new_template = f'<div class="layer-color-ui" style="display:flex; align-items:center; flex-shrink:0;">{default_circle}</div>'
js = js.replace(old_template, new_template)

# 2. Update line 521 (raster)
js = js.replace('colorUI.innerHTML = `<div class="legend-color-dot" style="background: #9aa5b1; margin-right: 6px;"></div>`;',
                f'colorUI.innerHTML = `<div style="width: 12px; height: 12px; border-radius: 50%; background: #9aa5b1; margin-right: 6px; flex-shrink:0;"></div>`;')

# 3. Update line 582 (vector single color)
js = js.replace('colorUI.innerHTML = `<div class="legend-color-dot" style="background: ${color}; margin-right: 6px;"></div>`;',
                'colorUI.innerHTML = `<div style="width: 12px; height: 12px; border-radius: 50%; background: ${color}; margin-right: 6px; flex-shrink:0;"></div>`;')

# 4. Update line 720 (unload)
js = js.replace("colorUI.innerHTML = '';", f"colorUI.innerHTML = `{default_circle}`;")

with open('frontend/app.js', 'w') as f:
    f.write(js)

with open('frontend/index.html', 'r') as f:
    html = f.read()
html = html.replace('v=34', 'v=35')
with open('frontend/index.html', 'w') as f:
    f.write(html)
