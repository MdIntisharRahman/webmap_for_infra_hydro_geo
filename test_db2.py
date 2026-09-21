import asyncio
from backend.main import get_layer_data, async_session_maker

async def test():
    async with async_session_maker() as db:
        try:
            res = await get_layer_data("borelog_map", db)
            print("borelog_map keys:", res.keys() if isinstance(res, dict) else res)
        except Exception as e:
            print("Error borelog_map:", e)

asyncio.run(test())
