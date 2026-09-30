import re

with open('frontend/borelog-entry.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix desktop CSS
replacement_desktop = r'''        .del-btn, .insert-btn {
            background: transparent;
            color: var(--text-muted);
            border: none;
            cursor: pointer;  
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.2s;
            font-size: 16px;
            width: 24px;
            height: 24px;
        }'''
pattern_desktop = re.compile(r'        \.del-btn, \.insert-btn \{.*?font-size: 16px;\s*\}', re.DOTALL)
content = pattern_desktop.sub(replacement_desktop, content)

# Fix mobile CSS
replacement_mobile = r'''            .action-pill {
                height: 44px !important;
                padding: 4px 12px !important;
                margin-top: 8px;
            }
            .del-btn, .insert-btn {
                width: 32px !important;
                height: 32px !important;
                font-size: 20px !important;
            }
            /* Remove old mobile overrides */'''
pattern_mobile = re.compile(r'            \.del-btn, \.insert-btn \{.*?background: #d1fae5;\s*\}', re.DOTALL)
content = pattern_mobile.sub(replacement_mobile, content)

with open('frontend/borelog-entry.html', 'w', encoding='utf-8') as f:
    f.write(content)
