import os
import re

files = [
    'frontend/credits/SRTM-Credit.html',
    'frontend/credits/USGS-GLG-Credit.html'
]

css_content = None

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract style block if it hasn't been extracted yet
    if not css_content:
        match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
        if match:
            css_content = match.group(1).strip()
    
    # Replace style block with link
    new_content = re.sub(r'<style>.*?</style>', '<link rel="stylesheet" href="credits-style.css">', content, flags=re.DOTALL)
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Updated {file}")

if css_content:
    with open('frontend/credits/credits-style.css', 'w', encoding='utf-8') as f:
        f.write(css_content)
    print("Created credits-style.css")
else:
    print("Could not find style block")
