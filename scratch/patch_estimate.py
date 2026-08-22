with open('backend/main.py', 'r') as f:
    code = f.read()

code = code.replace(
    'async def get_estimate(lat: float, lng: float, db: AsyncSession = Depends(get_db)):',
    'async def get_estimate(lat: float, lng: float, active_tables: str = "", db: AsyncSession = Depends(get_db)):\n    active_tables_list = active_tables.split(",") if active_tables else []'
)

code = code.replace(
    'for lyr in layers:\n            derive_str = lyr.get("derive", "")',
    'for lyr in layers:\n            if active_tables_list and lyr["table"] not in active_tables_list:\n                continue\n            derive_str = lyr.get("derive", "")'
)

with open('backend/main.py', 'w') as f:
    f.write(code)
print('Patched get_estimate')
