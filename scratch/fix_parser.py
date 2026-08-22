with open("backend/main.py", "r") as f:
    code = f.read()

code = code.replace('or line.startswith("|-")', 'or line.startswith("|-") or "---" in line')

with open("backend/main.py", "w") as f:
    f.write(code)
