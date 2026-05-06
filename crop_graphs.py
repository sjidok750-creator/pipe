import sys
sys.stdout.reconfigure(encoding='utf-8')
from PIL import Image

img = Image.open(r'D:/workclaude/pipe/extracted_p0162_hires.png').convert('RGB')
w, h = img.size

# Crop graph 1 (xi1): rows 400-1500, full width
g1 = img.crop((300, 400, 1950, 1550))
g1.save(r'D:/workclaude/pipe/graph1_xi1.png')
print(f'Graph1 saved: {g1.size}')

# Crop graph 2 (xi2): rows 1700-2900, full width
g2 = img.crop((300, 1700, 1950, 2900))
g2.save(r'D:/workclaude/pipe/graph2_xi2.png')
print(f'Graph2 saved: {g2.size}')
