import asyncio
from backend.main import get_layer_data, async_session_maker

async def test():
    async with async_session_maker() as db:
        try:
            res1 = await get_layer_data("awaiting_borelogs", db)
            print("Awaiting keys:", res1.keys() if isinstance(res1, dict) else res1)
        except Exception as e:
            print("Error awaiting:", e)
            
        try:
            res2 = await get_layer_data("appended_borelogs", db)
            print("Appended keys:", res2.keys() if isinstance(res2, dict) else res2)
        except Exception as e:
            print("Error appended:", e)

asyncio.run(test())
