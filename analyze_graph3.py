import sys
sys.stdout.reconfigure(encoding='utf-8')
from PIL import Image

img = Image.open(r'D:/workclaude/pipe/extracted_p0162_hires.png').convert('RGB')
w, h = img.size

# The whole image is 2380x3364
# Graph 1 (xi1) region: roughly top half
# From the 2x image, the plot area for xi1 appears to be:
# Let's scan each column from y=400 to 1400 and count dark pixels

print("=== GRAPH 1 (xi1) - Finding plot boundaries ===")
print("Scanning columns for dark pixel count (y=400-1400):")
for x in range(200, 2200, 50):
    dark = sum(1 for y in range(400, 1400) if img.getpixel((x,y))[0] < 100)
    if dark > 5:
        print(f"  col {x}: {dark} dark pixels")

print("\nScanning rows for dark pixel count (x=200-2200):")
for y in range(400, 1500, 20):
    dark = sum(1 for x in range(200, 2200) if img.getpixel((x,y))[0] < 100)
    if dark > 5:
        print(f"  row {y}: {dark} dark pixels")
