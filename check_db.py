
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def check():
    engine = create_async_engine('postgresql+asyncpg://postgres:postgres@localhost:5432/webmap_db')
    async with engine.connect() as conn:
        res = await conn.execute(text(\
SELECT
table_name
FROM
information_schema.tables
WHERE
table_schema=public\))
        tables = [r[0] for r in res]
        for t in tables[:5]:
            try:
                res = await conn.execute(text(f'SELECT * FROM \
t
\ LIMIT 1'))
                print(f'Table: {t}, Columns: {res.keys()}')
            except Exception as e:
                print(e)

asyncio.run(check())

