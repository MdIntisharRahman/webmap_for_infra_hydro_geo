import re
with open('frontend/index.html', 'r') as f:
    html = f.read()

modal_pattern = r'(\s*<!-- Iframe Modal -->.*?</div>\s*</div>\s*)</body>'
match = re.search(modal_pattern, html, re.DOTALL)
if match:
    modal_str = match.group(1)
    html = html.replace(modal_str, '')
    html = html.replace('<script src="resources/leaflet.js"></script>', modal_str + '\n    <script src="resources/leaflet.js"></script>')
    
    # bump cache buster
    html = html.replace('app.js?v=26', 'app.js?v=27')
    
    with open('frontend/index.html', 'w') as f:
        f.write(html)
    print('Moved modal HTML before scripts')
else:
    print('Could not find modal HTML')
