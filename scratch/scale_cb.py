with open('frontend/app.js', 'r') as f:
    js = f.read()

old_style = 'style="margin-right: 8px; flex-shrink: 0; width: 14px; height: 14px; margin-top: 1px;"'
new_style = 'style="margin-right: 2px; flex-shrink: 0; transform: scale(0.63); margin-top: 1px;"'
js = js.replace(old_style, new_style)

with open('frontend/app.js', 'w') as f:
    f.write(js)
print('Scaled checkbox')
