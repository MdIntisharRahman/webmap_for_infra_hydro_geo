with open('frontend/app.js', 'r') as f:
    js = f.read()

# Replace the part in fetchAndRenderLayers
# First, remove the fetch of layer data from the loop start.

import re

# Instead of rewriting the whole logic, I will do string replacements carefully.
