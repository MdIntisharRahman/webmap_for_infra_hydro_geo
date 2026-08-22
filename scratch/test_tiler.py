from rio_tiler.io import Reader

filepath = "Maps/BGD SRTM30 Opentopography Clipped to the Map.0.tif"
with Reader(filepath) as src:
    print(src.info())
    print("Tile 10, 755, 439") # approx BD
    img = src.tile(755, 439, 10)
    img.rescale(in_range=((0, 100),))
    img_bytes = img.render(img_format="PNG", cmap="terrain")
    print("Rendered bytes length:", len(img_bytes))
