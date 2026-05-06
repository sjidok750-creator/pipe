import re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

file_path = 'C:/Users/ahj02/Downloads/01 _ Pulse.html'
output_path = 'D:/workclaude/pipe/extracted_cover.html'

with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

print(f"Total size: {len(content)} chars")

# Find all keyword positions
keywords = {
    'STRUCTURAL SAFETY REPORT': content.find('STRUCTURAL SAFETY REPORT'),
    'STRUCTURAL SAFETY': content.find('STRUCTURAL SAFETY'),
    'Pipeline Inspection': content.lower().find('pipeline inspection'),
    'PIPER': content.find('PIPER'),
}
for k, v in keywords.items():
    print(f"  '{k}' at index: {v}")

# Extract text from PIPER cover region (3300000 ~ 3450000)
print("\n=== 겉표지 영역 (PIPER 주변 3.3M~3.45M) 텍스트 ===")
cover_chunk = content[3300000:3450000]
spans = re.findall(r'>([^<]{2,300})</', cover_chunk)
exclude_starts = ('auto', 'none', 'rgb', '0px', 'normal', 'visible', 'scroll',
                  'border', 'padding', 'margin', 'font-', 'text-', 'align',
                  'block', 'flex', 'grid', 'color', 'overflow', 'position',
                  'transform', 'transition', 'animation', 'background', 'display')
spans_clean = []
for s in spans:
    s = s.strip()
    if s and not any(s.startswith(e) for e in exclude_starts) and len(s) > 1:
        spans_clean.append(s)
for t in spans_clean[:80]:
    print(f"  [{t}]")

# Extract text from STRUCTURAL SAFETY REPORT region
print("\n=== STRUCTURAL SAFETY REPORT 영역 (6.18M~6.28M) 텍스트 ===")
cover_chunk2 = content[6180000:6280000]
spans2 = re.findall(r'>([^<]{2,300})</', cover_chunk2)
spans2_clean = []
for s in spans2:
    s = s.strip()
    if s and not any(s.startswith(e) for e in exclude_starts) and len(s) > 1:
        spans2_clean.append(s)
for t in spans2_clean[:80]:
    print(f"  [{t}]")

# Now create a clean HTML extraction with simplified styles
print("\n=== 정리된 HTML 저장 중... ===")

def extract_section_clean(chunk, label):
    """Remove inline styles but keep structure"""
    # Remove long inline styles (keep short ones)
    cleaned = re.sub(r' style="[^"]{200,}"', ' style="[inline-style-removed]"', chunk)
    return f'<!-- === {label} === -->\n{cleaned}\n\n'

parts = ['<!-- ===== EXTRACTED COVER SECTIONS ===== -->\n<meta charset="utf-8">\n\n']

# Section 1: STRUCTURAL SAFETY REPORT (앞뒤 5000자)
idx1 = content.find('STRUCTURAL SAFETY REPORT')
if idx1 >= 0:
    start1 = max(0, idx1 - 5000)
    end1 = min(len(content), idx1 + 5000)
    chunk1 = content[start1:end1]
    chunk1_clean = re.sub(r' style="[^"]{200,}"', ' style="[...]"', chunk1)
    parts.append(f'<!-- === SECTION 1: STRUCTURAL SAFETY REPORT at {idx1}, [{start1}:{end1}] === -->\n')
    parts.append(chunk1_clean)
    parts.append('\n\n')

# Section 2: Pipeline Inspection (앞뒤 3000자)
idx2 = content.lower().find('pipeline inspection')
if idx2 >= 0:
    start2 = max(0, idx2 - 3000)
    end2 = min(len(content), idx2 + 3000)
    chunk2 = content[start2:end2]
    chunk2_clean = re.sub(r' style="[^"]{200,}"', ' style="[...]"', chunk2)
    parts.append(f'<!-- === SECTION 2: Pipeline Inspection at {idx2}, [{start2}:{end2}] === -->\n')
    parts.append(chunk2_clean)
    parts.append('\n\n')

# Section 3: PIPER (앞뒤 3000자)
idx3 = content.find('PIPER')
if idx3 >= 0:
    start3 = max(0, idx3 - 3000)
    end3 = min(len(content), idx3 + 3000)
    chunk3 = content[start3:end3]
    chunk3_clean = re.sub(r' style="[^"]{200,}"', ' style="[...]"', chunk3)
    parts.append(f'<!-- === SECTION 3: PIPER at {idx3}, [{start3}:{end3}] === -->\n')
    parts.append(chunk3_clean)
    parts.append('\n\n')

result = ''.join(parts)

with open(output_path, 'w', encoding='utf-8') as f:
    f.write(result)

import os
file_size = os.path.getsize(output_path)
print(f"Saved: {output_path}")
print(f"File size: {file_size} bytes ({file_size/1024:.1f} KB)")
print(f"\nFirst 200 chars of output:")
print(result[:200])
