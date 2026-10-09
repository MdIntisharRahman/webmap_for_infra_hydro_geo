import json
import os
import glob

def update_borelogs():
    files = glob.glob("Maps/borelogs/staged/*.json") + glob.glob("Maps/borelogs/staged/*.JSON") + \
            glob.glob("Maps/borelogs/published/*.json") + glob.glob("Maps/borelogs/published/*.JSON")
    
    for file in files:
        with open(file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        modified = False
        props = data.get('properties', {})
        
        # Check if Atterberg limits need updating
        if 'atterberg_limits' in props and 'atterberg_test_data' not in props:
            props['atterberg_test_data'] = props.pop('atterberg_limits')
            modified = True
            
        if 'atterberg_test_data' in props:
            for test in props['atterberg_test_data']:
                if 'wl' in test:
                    test['ll'] = test.pop('wl')
                    modified = True
                if 'wp' in test:
                    test['pl'] = test.pop('wp')
                    modified = True
                if 'wc' not in test:
                    # Give it a generic default or leave blank?
                    # The user said: "to conform to the new scheme. Update them as necessary."
                    # If wc is not there, we can just leave it or set it to NaN or don't set it (BorelogVisualizer handles !isNaN(wc))
                    # But wait, maybe the user wants the keys changed from wl/wp to ll/pl
                    pass
                if 'pi' in test:
                    test.pop('pi')
                    modified = True
                if 'li' in test:
                    test.pop('li')
                    modified = True

        if modified:
            with open(file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            print(f"Updated {file}")

if __name__ == "__main__":
    update_borelogs()
