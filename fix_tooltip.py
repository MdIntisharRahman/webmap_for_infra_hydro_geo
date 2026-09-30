import re

with open('frontend/borelog-entry.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("            pointer-events: none;\n", "")

with open('frontend/borelog-entry.html', 'w', encoding='utf-8') as f:
    f.write(content)
