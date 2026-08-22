with open('frontend/index.html', 'r') as f:
    html = f.read()

scripts = '''    <script src="resources/leaflet.js"></script>
    <script src="resources/proj4.js"></script>
    <script src="resources/georaster.js"></script>
    <script src="resources/georaster-layer-for-leaflet.min.js"></script>'''

html = html.replace('<script src="resources/leaflet.js"></script>', scripts)
with open('frontend/index.html', 'w') as f:
    f.write(html)
print('Added georaster scripts to index.html')
