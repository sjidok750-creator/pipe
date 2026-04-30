import sys
sys.stdout.reconfigure(encoding='utf-8')
from PIL import Image

img = Image.open(r'D:/workclaude/pipe/extracted_p0162_hires.png').convert('RGB')
w, h = img.size

# Graph 1 (xi1): rows ~360 to 1580
g1_top = 360
g1_bot = 1580

# Find left/right axis columns
col_darks = []
for x in range(w):
    dark_count = sum(1 for y in range(g1_top, g1_bot) if img.getpixel((x,y))[0] < 80)
    col_darks.append(dark_count)

threshold = 20
left_cols = [x for x in range(w) if col_darks[x] > threshold]
if left_cols:
    print(f'Graph1 - left axis col: {left_cols[0]}, right axis col: {left_cols[-1]}')

# Find top/bottom axis rows
row_darks = []
for y in range(g1_top, g1_bot):
    dark_count = sum(1 for x in range(w) if img.getpixel((x,y))[0] < 80)
    row_darks.append((y, dark_count))

sorted_rows = sorted(row_darks, key=lambda r: -r[1])
print('Darkest rows in graph1:', sorted_rows[:5])
