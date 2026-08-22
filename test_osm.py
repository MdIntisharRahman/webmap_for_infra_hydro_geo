import requests
q = '''
[out:json][timeout:180];
area["ISO3166-1"="BD"][admin_level="2"]->.searchArea;
(
  way["highway"]["ref"](area.searchArea);
  way["highway"]["network"="Asian Highway"](area.searchArea);
);
out geom;
'''
import json

r = requests.get('https://overpass-api.de/api/interpreter', params={'data': q}, headers={'User-Agent': 'WebmapApp/1.0', 'Accept': '*/*'})
print(f"Status Code: {r.status_code}")
if r.status_code == 200:
    data = r.json()
    elements = data.get('elements', [])
    print(f"Total elements: {len(elements)}")
    if len(elements) > 0:
        print("Sample element:")
        print(json.dumps(elements[0], indent=2))
        
        # Check refs
        refs = [e.get('tags', {}).get('ref', '') for e in elements if 'tags' in e]
        nrz_refs = [ref for ref in refs if ref.startswith(('N', 'R', 'Z'))]
        print(f"Found {len(nrz_refs)} elements starting with N, R, or Z.")
else:
    print(r.text)
