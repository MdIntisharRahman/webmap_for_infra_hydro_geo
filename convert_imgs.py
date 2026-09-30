import os
from PIL import Image

d = 'tmp/reference_images'
for f in os.listdir(d):
    if f.endswith('.webp') or f.endswith('.avif'):
        img = Image.open(os.path.join(d, f)).convert('RGB')
        img.save(os.path.join(d, f.split('.')[0] + '.jpg'))
