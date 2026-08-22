with open('backend/main.py', 'r') as f:
    code = f.read()

old_dict = '''                layers.append({
                    "name": layer_name, 
                    "table": table_name, 
                    "tab": tab_name, 
                    "show_first": show_first, 
                    "type": layer_type, 
                    "derive": derive, 
                    "estimate": estimate,
                    "credit_page": credit_page
                })'''

new_dict = '''                layers.append({
                    "name": layer_name, 
                    "table": table_name, 
                    "tab": tab_name, 
                    "filename": parts[0],
                    "show_first": show_first, 
                    "type": layer_type, 
                    "derive": derive, 
                    "estimate": estimate,
                    "credit_page": credit_page
                })'''

code = code.replace(old_dict, new_dict)
with open('backend/main.py', 'w') as f:
    f.write(code)
print('Patched filename')
