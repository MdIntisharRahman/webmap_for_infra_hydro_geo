
import os
import json
import glob

dirs_to_process = ['Maps/borelogs/staged', 'Maps/borelogs/published']

for d in dirs_to_process:
    if not os.path.exists(d):
        continue
    for filepath in glob.glob(os.path.join(d, '*.json')):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Check if it's a GeoJSON feature or just properties
        props = data.get('properties', data)
        modified = False

        if 'odeometric_test_data' in props:
            del props['odeometric_test_data']
            modified = True
            
        if 'hardening_soil_parameters' in props:
            del props['hardening_soil_parameters']
            modified = True
            
        if 'consolidation_test_data' in props:
            new_cons_data = []
            for item in props['consolidation_test_data']:
                new_item = {
                    'depth_m': item.get('depth_m', 0.0),
                    'vertical_effective_stress_kpa': 100.0,
                    'constrained_modulus_eoed_mpa': 25.0,
                    'compression_index': 0.20,
                    'recompression_index': 0.04,
                    'preconsolidation_pressure_kpa': 120.5
                }
                new_cons_data.append(new_item)
            props['consolidation_test_data'] = new_cons_data
            modified = True
            
        # Add triaxial if not exists
        if 'triaxial_test_data' not in props:
            props['triaxial_test_data'] = [
                {
                    'depth_m': 12.0,
                    'test_type': 'CD',
                    'effective_confining_stress_kpa': 100.0,
                    'peak_deviator_stress_kpa': 150.0,
                    'secant_modulus_e50_mpa': 25.0
                }
            ]
            modified = True

        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            print(f'Migrated: {filepath}')

