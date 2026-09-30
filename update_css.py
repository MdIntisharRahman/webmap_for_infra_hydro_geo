
import re

with open('frontend/borelog-entry.html', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = r'''        .del-btn, .insert-btn {
            background: transparent;
            color: var(--text-muted);
            border: none;
            /* padding: 9px; */
            cursor: pointer;  
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.2s;
            font-size: 16px;
        }
        .del-btn:hover {
            color: var(--danger);
            /* background: var(--danger-bg); */
        }
        .insert-btn:hover {
            color: #10b981; /* Green color for add */
        }'''

pattern = re.compile(r'        \.del-btn \{.*?\.del-btn:hover \{.*?\}', re.DOTALL)
new_content = pattern.sub(replacement, content, count=1)

with open('frontend/borelog-entry.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

