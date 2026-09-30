import json

file_path = 'E:/Webmap/Maps/borelogs/samples/JSON/BORELOG-JSON-FILE-SAMPLE-20092026.json'
with open(file_path, 'r') as f:
    data = json.load(f)

cpt_mock = [
    {"depth_m": 1.0, "qc_mpa": 4.5, "fs_kpa": 45, "rf_percent": 1.0, "u2_kpa": 10},
    {"depth_m": 2.5, "qc_mpa": 8.0, "fs_kpa": 120, "rf_percent": 1.5, "u2_kpa": 20},
    {"depth_m": 4.0, "qc_mpa": 15.0, "fs_kpa": 300, "rf_percent": 2.0, "u2_kpa": 15},
    {"depth_m": 5.5, "qc_mpa": 12.5, "fs_kpa": 250, "rf_percent": 2.0, "u2_kpa": 18},
    {"depth_m": 7.0, "qc_mpa": 16.0, "fs_kpa": 288, "rf_percent": 1.8, "u2_kpa": 22},
    {"depth_m": 8.5, "qc_mpa": 14.0, "fs_kpa": 294, "rf_percent": 2.1, "u2_kpa": 25},
    {"depth_m": 10.0, "qc_mpa": 8.0, "fs_kpa": 280, "rf_percent": 3.5, "u2_kpa": 80},
    {"depth_m": 11.5, "qc_mpa": 3.0, "fs_kpa": 144, "rf_percent": 4.8, "u2_kpa": 250},
    {"depth_m": 13.0, "qc_mpa": 2.5, "fs_kpa": 137, "rf_percent": 5.5, "u2_kpa": 320},
    {"depth_m": 14.5, "qc_mpa": 2.0, "fs_kpa": 120, "rf_percent": 6.0, "u2_kpa": 350},
    {"depth_m": 16.0, "qc_mpa": 3.5, "fs_kpa": 157, "rf_percent": 4.5, "u2_kpa": 280},
    {"depth_m": 17.5, "qc_mpa": 4.0, "fs_kpa": 168, "rf_percent": 4.2, "u2_kpa": 210},
    {"depth_m": 19.0, "qc_mpa": 8.5, "fs_kpa": 221, "rf_percent": 2.6, "u2_kpa": 120},
    {"depth_m": 20.5, "qc_mpa": 18.0, "fs_kpa": 270, "rf_percent": 1.5, "u2_kpa": 40},
    {"depth_m": 22.0, "qc_mpa": 22.0, "fs_kpa": 264, "rf_percent": 1.2, "u2_kpa": 35},
    {"depth_m": 23.5, "qc_mpa": 25.0, "fs_kpa": 250, "rf_percent": 1.0, "u2_kpa": 30},
    {"depth_m": 25.0, "qc_mpa": 28.0, "fs_kpa": 252, "rf_percent": 0.9, "u2_kpa": 25},
]

data['properties']['cpt_data'] = cpt_mock

with open(file_path, 'w') as f:
    json.dump(data, f, indent=2)

print("Injected CPT data successfully.")
