import os
with open('backend/main.py', 'r') as f:
    code = f.read()

mount_maps = 'app.mount("/maps", StaticFiles(directory="Maps"), name="maps")\n'
if '"/maps"' not in code:
    code = code.replace('app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")', mount_maps + 'app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")')
    
with open('backend/main.py', 'w') as f:
    f.write(code)
print('Patched mounts')
