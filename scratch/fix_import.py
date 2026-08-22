with open('import_local_maps.py', 'r') as f:
    py = f.read()
py = py.replace('or line.startswith("|-")', 'or line.startswith("|-")\n            or "---" in line')
with open('import_local_maps.py', 'w') as f:
    f.write(py)
print('Fixed import_local_maps.py')
