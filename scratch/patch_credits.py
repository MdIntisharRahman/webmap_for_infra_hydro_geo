with open("backend/main.py", "r") as f:
    code = f.read()

# 1. Mount credits
if 'app.mount("/credits"' not in code:
    code = code.replace(
        'app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")',
        'app.mount("/credits", StaticFiles(directory="credits"), name="credits")\napp.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")'
    )

# 2. Update get_layers parser
old_parser = """                estimate = (parts[6].strip().lower() in ["yes", "y"]) if len(parts) >= 7 else False
                
                layers.append({
                    "name": layer_name, 
                    "table": table_name, 
                    "tab": tab_name, 
                    "show_first": show_first,
                    "type": layer_type,
                    "derive": derive,
                    "estimate": estimate,
                    "filename": parts[0]
                })"""

new_parser = """                estimate = (parts[6].strip().lower() in ["yes", "y"]) if len(parts) >= 7 else False
                credit_page = parts[7].strip() if len(parts) >= 8 else ""
                
                layers.append({
                    "name": layer_name, 
                    "table": table_name, 
                    "tab": tab_name, 
                    "show_first": show_first,
                    "type": layer_type,
                    "derive": derive,
                    "estimate": estimate,
                    "filename": parts[0],
                    "credit_page": credit_page
                })"""

if old_parser in code:
    code = code.replace(old_parser, new_parser)
else:
    print("Warning: Failed to replace get_layers parser")

with open("backend/main.py", "w") as f:
    f.write(code)
print("backend/main.py patched")
