import re

with open('frontend/borelog-form.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """<td style="border: none; padding-right: 0; vertical-align: middle; width: 90px; text-align: right;">
                    <div class="action-pill" style="display: inline-flex; align-items: center; justify-content: center; gap: 5px; border: 1px solid #000; border-radius: 50px; padding: 2px 8px; height: 32px; background: #fff;">
                        <button type="button" class="insert-btn" onclick="insertRowAfter(this)" title="Insert Row Below" style="margin:0; padding:0;">🞣</button>
                        <div style="width: 1px; height: 16px; background: #ccc;"></div>
                        <button type="button" class="del-btn" onclick="deleteRow(this)" title="Delete Row" style="margin:0; padding:0;">𐩃</button>
                    </div>
                </td>"""

pattern = re.compile(r'<td style=\"border: none; padding-right: 0; vertical-align: middle; width: 90px; text-align: right;\">.*?</td>', re.DOTALL)
new_content = pattern.sub(replacement, content)

with open('frontend/borelog-form.js', 'w', encoding='utf-8') as f:
    f.write(new_content)
