with open('frontend/app.js', 'r') as f:
    js = f.read()

bad = '''let subHTML = `<div class="layer-sub-legend">`;
                            let count = 0;
                            const classEntries = Array.from(classMap.entries());'''

good = '''let subHTML = `<div class="layer-sub-legend">`;
                            let count = 0;'''

js = js.replace(bad, good)

with open('frontend/app.js', 'w') as f:
    f.write(js)
