import sys
sys.stdout.reconfigure(encoding='utf-8')
from PIL import Image

img = Image.open(r'D:/workclaude/pipe/extracted_p0162_hires.png').convert('RGB')
w, h = img.size

# Based on analysis:
# Graph1 (xi1): col 371~1880, row ~414 (top axis) ~ bottom axis
# Graph2 (xi2): row ~1895~2761

# Let's find the exact axes for graph1
# Top axis row: row 414-420 (darkest)
# Bottom axis row: look for another very dark row below
g1_top = 360
g1_bot = 1580

row_darks = []
for y in range(g1_top, g1_bot):
    dark_count = sum(1 for x in range(371, 1880) if img.getpixel((x,y))[0] < 80)
    row_darks.append((y, dark_count))

# The axis rows
top5 = sorted(row_darks, key=lambda r: -r[1])[:10]
print('Top dark rows in plot area:')
for r,c in top5:
    print(f'  row {r}: {c} dark pixels')

# The plot area x-axis range: col 371 to 1880
# Plot area should have:
#   x_left = col for lambda=0, x_right = col for lambda=500
#   y_top = row for xi=1.2, y_bot = row for xi=0

# Let's scan column 371 for the plot boundary (left axis)
print('\nLeft axis scan (col 371):')
for y in range(400, 900, 10):
    px = img.getpixel((371, y))
    print(f'  y={y}: {px}')
