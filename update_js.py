import re

with open('frontend/borelog-form.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """<td style="display: flex; gap: 4px; justify-content: flex-end; align-items: center; border: none; padding-right: 0; min-width: 60px;">
                    <button type="button" class="insert-btn" onclick="insertRowAfter(this)" title="Insert Row Below">🞣</button>
                    <button type="button" class="del-btn" onclick="deleteRow(this)" title="Delete Row">𐩃</button>
                </td>"""

new_content = content.replace('<td><button type="button" class="del-btn" onclick="deleteRow(this)" title="Delete Row">𐩃</button></td>', replacement)

insert_logic = """window.deleteRow = (btn) => {
    btn.closest('tr').remove();
};

window.insertRowAfter = (btn) => {
    const currentRow = btn.closest('tr');
    const tbody = currentRow.closest('tbody');
    const type = tbody.dataset.type;
    const tr = document.createElement('tr');
    tr.innerHTML = getRowHTML(type);
    currentRow.insertAdjacentElement('afterend', tr);
    return tr;
};"""

new_content = new_content.replace("""window.deleteRow = (btn) => {
    btn.closest('tr').remove();
};""", insert_logic)

with open('frontend/borelog-form.js', 'w', encoding='utf-8') as f:
    f.write(new_content)
