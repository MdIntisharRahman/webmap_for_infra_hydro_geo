import os
from PIL import Image, ImageEnhance

in_dir = 'tmp/reference_images'
out_dir = r'C:\Users\sde01\.gemini\antigravity-cli\brain\0e91c133-d85d-4847-8c68-d0e17251838f'

# Mapping of section to reference image
sections = {
    'atterberg': 'atterberg-test-1.jpg',
    'consolidation': 'general-test-1.jpg', # Fallback
    'shear': 'general-test-1.jpg',         # Fallback
    'spt': 'spt-test-1.jpg',
    'strata': 'general-test-1.jpg',        # Fallback
}

haze_color = (75, 71, 67) # #4b4743
opacity = 0.65

for sec, file in sections.items():
    img_path = os.path.join(in_dir, file)
    if not os.path.exists(img_path):
        continue
    
    img = Image.open(img_path).convert('RGBA')
    
    # Crop to 16:9 (Banner)
    w, h = img.size
    target_h = int(w * (9 / 16))
    if h > target_h:
        # Crop vertically (center crop)
        top = (h - target_h) // 2
        bottom = top + target_h
        img = img.crop((0, top, w, bottom))
    else:
        # Image is too wide, crop horizontally
        target_w = int(h * (16 / 9))
        left = (w - target_w) // 2
        right = left + target_w
        img = img.crop((left, 0, right, h))
        
    # Resize to standard width
    img = img.resize((1280, 720), Image.Resampling.LANCZOS)
    
    # Create brown haze layer
    haze = Image.new('RGBA', img.size, haze_color + (int(255 * opacity),))
    
    # Composite
    banner = Image.alpha_composite(img, haze)
    banner = banner.convert('RGB')
    
    # Optional: reduce contrast a bit for that "subtle" look
    enhancer = ImageEnhance.Contrast(banner)
    banner = enhancer.enhance(0.7)
    
    out_path = os.path.join(out_dir, f'bg_{sec}_v2_tinted.jpg')
    banner.save(out_path, quality=90)
