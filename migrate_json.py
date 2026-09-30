import os
import json
import glob

def migrate_borelog(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    props = data.get('properties', {})
    modified = False
    
    if 'odeometric_test_data' in props:
        del props['odeometric_test_data']
        modified = True
        
    if 'hardening_soil_parameters' in props:
        del props['hardening_soil_parameters']
        modified = True
        
    if 'triaxial_test_data' not in props:
        props['triaxial_test_data'] = [
            {
                "depth_m": 12.0,
                "test_type": "CD",
                "effective_confining_stress_kpa": 100.0,
                "peak_deviator_stress_kpa": 150.0,
                "secant_modulus_e50_mpa": 25.0
            }
        ]
        modified = True
        
    if 'consolidation_test_data' in props:
        new_cons = []
        for test in props['consolidation_test_data']:
            depth = test.get('depth_m', 10.0)
            new_cons.append({
                "depth_m": depth,
                "vertical_effective_stress_kpa": 100.0,
                "constrained_modulus_eoed_mpa": 25.0,
                "compression_index": 0.20,
                "recompression_index": 0.04,
                "preconsolidation_pressure_kpa": 120.5
            })
        props['consolidation_test_data'] = new_cons
        modified = True
        
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print(f"Migrated: {filepath}")

# Find all JSON files in staged and published
target_dirs = [
    'Maps/borelogs/staged',
    'Maps/borelogs/published'
]

for d in target_dirs:
    for f in glob.glob(os.path.join(d, '*.[jJ][sS][oO][nN]')):
        migrate_borelog(f)

print("Migration complete!")
