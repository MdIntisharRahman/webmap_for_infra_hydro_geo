import re
with open('backend/main.py', 'r') as f:
    code = f.read()
code = re.sub(r'app\.mount\("/credits", StaticFiles\(directory="credits"\), name="credits"\)\n?', '', code)
with open('backend/main.py', 'w') as f:
    f.write(code)
