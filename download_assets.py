import urllib.request
import os
import re

res_dir = "frontend/resources"
os.makedirs(res_dir, exist_ok=True)

# 1. Download Leaflet JS
urllib.request.urlretrieve("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", os.path.join(res_dir, "leaflet.js"))

# 2. Download Leaflet CSS
urllib.request.urlretrieve("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", os.path.join(res_dir, "leaflet.css"))

# Download Leaflet Images (required for default marker if needed)
img_dir = os.path.join(res_dir, "images")
os.makedirs(img_dir, exist_ok=True)
images = ["marker-icon.png", "marker-icon-2x.png", "marker-shadow.png", "layers.png", "layers-2x.png"]
for img in images:
    urllib.request.urlretrieve(f"https://unpkg.com/leaflet@1.9.4/dist/images/{img}", os.path.join(img_dir, img))

# 3. Download Google Fonts
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
req = urllib.request.Request("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&family=Outfit:wght@500;600;700&display=swap", headers=headers)
with urllib.request.urlopen(req) as response:
    css_content = response.read().decode("utf-8")

urls = re.findall(r"url\((https://fonts.gstatic.com/s/[^\)]+)\)", css_content)
for url in urls:
    filename = url.split("/")[-1]
    urllib.request.urlretrieve(url, os.path.join(res_dir, filename))
    css_content = css_content.replace(url, f"resources/{filename}")

with open(os.path.join(res_dir, "fonts.css"), "w", encoding="utf-8") as f:
    f.write(css_content)

print("All assets downloaded successfully.")

