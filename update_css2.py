
import re

with open('frontend/borelog-entry.html', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = r'''            .del-btn, .insert-btn {
                min-height: 44px;
                margin-left: 0;
                margin-top: 8px;
            }
            .del-btn {
                background: var(--danger-bg);
            }
            .insert-btn {
                background: #d1fae5;
            }'''

pattern = re.compile(r'            \.del-btn \{.*?background: var\(--danger-bg\);\s*\}', re.DOTALL)
new_content = pattern.sub(replacement, content, count=1)

with open('frontend/borelog-entry.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

