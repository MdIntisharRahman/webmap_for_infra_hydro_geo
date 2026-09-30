import re

with open('frontend/borelog-form.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacement1 = """    if (type === 'strata') {
        const rows = tbody.querySelectorAll('tr');
        if (rows.length > 1) {
            const prevRow = rows[rows.length - 2];
            const prevBottom = prevRow.querySelector('.f-bottom').value;
            if (prevBottom) {
                tr.querySelector('.f-top').value = prevBottom;
            }
            const prevStratum = prevRow.querySelector('.f-stratum').value;
            if (prevStratum) {
                tr.querySelector('.f-stratum').value = parseInt(prevStratum) + 1;
            }
        }
    }"""

content = re.sub(r"    if \(type === 'strata'\) \{\n        const rows = tbody\.querySelectorAll\('tr'\);\n        if \(rows\.length > 1\) \{\n            const prevRow = rows\[rows\.length - 2\];\n            const prevBottom = prevRow\.querySelector\('\.f-bottom'\)\.value;\n            if \(prevBottom\) \{\n                tr\.querySelector\('\.f-top'\)\.value = prevBottom;\n            \}\n        \}\n    \}", replacement1, content)

replacement2 = """    if (type === 'strata') {
        const prevBottom = currentRow.querySelector('.f-bottom').value;
        if (prevBottom) {
            tr.querySelector('.f-top').value = prevBottom;
        }
        const prevStratum = currentRow.querySelector('.f-stratum').value;
        if (prevStratum) {
            tr.querySelector('.f-stratum').value = parseInt(prevStratum) + 1;
        }
    }"""

content = re.sub(r"    if \(type === 'strata'\) \{\n        const prevBottom = currentRow\.querySelector\('\.f-bottom'\)\.value;\n        if \(prevBottom\) \{\n            tr\.querySelector\('\.f-top'\)\.value = prevBottom;\n        \}\n    \}", replacement2, content)

with open('frontend/borelog-form.js', 'w', encoding='utf-8') as f:
    f.write(content)
