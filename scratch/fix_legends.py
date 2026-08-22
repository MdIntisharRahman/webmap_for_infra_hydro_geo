with open('frontend/app.js', 'r') as f:
    js = f.read()

js = js.replace('<div class="layer-sub-legend" style="display:flex; flex-wrap:wrap; gap:6px;">', '<div class="layer-sub-legend">')
with open('frontend/app.js', 'w') as f:
    f.write(js)

with open('frontend/index.html', 'r') as f:
    html = f.read()
html = html.replace('v=29', 'v=30')
with open('frontend/index.html', 'w') as f:
    f.write(html)
