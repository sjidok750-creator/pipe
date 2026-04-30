import sys
sys.stdout.reconfigure(encoding='utf-8')
from PIL import Image
import math

img = Image.open(r'D:/workclaude/pipe/extracted_p0162_hires.png').convert('RGB')
w, h = img.size

# From analysis:
# Graph 1 (xi1):
#   Plot area: col_left~col_right, row_top~row_bot
#   row 420 = top axis (xi=1.2)
#   row 1340 = bottom axis (xi=0)
#   Need to find col_left (lambda=0) and col_right (lambda=500)
#
# The high-dark row at 420 spans 1757 pixels → that's the top border
# col 600 has 20 dark pixels (left axis candidate)
# col 1800 has 49 dark pixels (right side)

# Let's look more carefully at cols
print("Fine column scan (graph1, y=420-1340):")
for x in range(560, 680, 5):
    dark = sum(1 for y in range(420, 1340) if img.getpixel((x,y))[0] < 100)
    print(f"  col {x}: {dark}")

print("\nRight side:")
for x in range(1750, 1900, 5):
    dark = sum(1 for y in range(420, 1340) if img.getpixel((x,y))[0] < 100)
    print(f"  col {x}: {dark}")
