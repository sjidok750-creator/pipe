#!/usr/bin/env python3
"""Extract SVG icon, font-face blocks, and splash CSS from 01 _ Pulse.html"""

import re
import os
import sys
import html as html_module
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

HTML_PATH = r"C:\Users\ahj02\Downloads\01 _ Pulse.html"
OUT_DIR = r"D:\workclaude\pipe"

print("Reading HTML file...")
with open(HTML_PATH, encoding='utf-8') as f:
    html = f.read()

print(f"File size: {len(html):,} chars")
print(f"Is single line: {html.count(chr(10)) < 10}")
print()

# ─────────────────────────────────────────────────────────────
# 1. SVG: viewBox="0 0 100 100" — pick shortest
# ─────────────────────────────────────────────────────────────
print("=" * 60)
print("1. Extracting SVG (viewBox='0 0 100 100')")
svg_pattern = re.compile(r'<svg\b[^>]*\bviewBox="0 0 100 100"[^>]*>.*?</svg>', re.DOTALL | re.IGNORECASE)
svg_matches = svg_pattern.findall(html)
print(f"   Found {len(svg_matches)} SVG(s) with viewBox='0 0 100 100'")
for i, m in enumerate(svg_matches):
    print(f"   [{i}] length={len(m):,}  first80: {m[:80].replace(chr(10),' ')!r}")

if svg_matches:
    shortest_svg = min(svg_matches, key=len)
    print(f"   Shortest: length={len(shortest_svg):,}")
    svg_out = os.path.join(OUT_DIR, "extracted_icon.svg")
    with open(svg_out, 'w', encoding='utf-8') as f:
        f.write(shortest_svg)
    fsize = os.path.getsize(svg_out)
    print(f"\n   Saved: {svg_out}")
    print(f"   File size: {fsize:,} bytes")
    print(f"   First 500 chars:\n{'-'*40}")
    print(shortest_svg[:500])
    print('-'*40)
else:
    print("   WARNING: No SVG found!")

# ─────────────────────────────────────────────────────────────
# 2+3. @font-face — Fraunces and Inter
# ─────────────────────────────────────────────────────────────
print()
print("=" * 60)
print("2+3. Extracting @font-face blocks")

fontface_pattern = re.compile(r'@font-face\s*\{[^}]*\}', re.DOTALL)
all_fontfaces = fontface_pattern.findall(html)
print(f"   Total @font-face blocks found: {len(all_fontfaces)}")

family_pattern = re.compile(r"font-family:\s*['\"]?([^;'\"]+)['\"]?\s*;", re.IGNORECASE)

fraunces_blocks = []
inter_blocks = []
other_families = set()

for block in all_fontfaces:
    m = family_pattern.search(block)
    if m:
        family = m.group(1).strip().strip("'\"")
        if 'Fraunces' in family:
            fraunces_blocks.append(block)
        elif 'Inter' in family:
            inter_blocks.append(block)
        else:
            other_families.add(family)

print(f"   Fraunces blocks: {len(fraunces_blocks)}")
print(f"   Inter blocks:    {len(inter_blocks)}")
print(f"   Other families:  {other_families}")

fonts_out = os.path.join(OUT_DIR, "extracted_fonts.css")
with open(fonts_out, 'w', encoding='utf-8') as f:
    f.write("/* =========================================================\n")
    f.write(f"   font-family: 'Fraunces'  ({len(fraunces_blocks)} blocks)\n")
    f.write("   ========================================================= */\n\n")
    for block in fraunces_blocks:
        f.write(block)
        f.write("\n\n")
    f.write("\n/* =========================================================\n")
    f.write(f"   font-family: 'Inter'  ({len(inter_blocks)} blocks)\n")
    f.write("   ========================================================= */\n\n")
    for block in inter_blocks:
        f.write(block)
        f.write("\n\n")

fsize = os.path.getsize(fonts_out)
print(f"\n   Saved: {fonts_out}")
print(f"   File size: {fsize:,} bytes")
print(f"   First 500 chars:\n{'-'*40}")
with open(fonts_out, encoding='utf-8') as f:
    first500 = f.read(500)
print(first500)
print('-'*40)
print(f"   (base64 woff2 data is expected to look like gibberish)")

# ─────────────────────────────────────────────────────────────
# 4. Splash CSS — HTML uses 100% inline styles (no class-based CSS)
#    Extract inline style attrs from splash text elements + parents
# ─────────────────────────────────────────────────────────────
print()
print("=" * 60)
print("4. Extracting splash/landing CSS (inline style attributes)")

def find_element_tag(html, text_search):
    """Find the opening tag of the element immediately containing text_search."""
    text_idx = html.find(text_search)
    if text_idx < 0:
        return None, -1
    # Walk backward to the nearest < that opens (not closes) a tag
    for i in range(text_idx - 1, max(0, text_idx - 20000), -1):
        if html[i] == '<' and (i + 1 < len(html)) and html[i+1] != '/':
            tag_start = i
            # The tag ends at the > just before the text
            tag_end = text_idx
            while tag_end > tag_start and html[tag_end] != '>':
                tag_end -= 1
            return html[tag_start:tag_end + 1], tag_start
    return None, -1

def extract_style_value(tag_str):
    """Extract the value of the style= attribute from a tag string, with HTML entity decoding."""
    pos = tag_str.find(' style="')
    if pos < 0:
        return ''
    start = pos + 8
    end = start
    while end < len(tag_str) and tag_str[end] != '"':
        end += 1
    raw = tag_str[start:end]
    # Decode HTML entities (e.g. &quot; -> ", &amp; -> &) so font names parse correctly
    return html_module.unescape(raw)

def style_to_css_props(style_val):
    """Parse inline style string into a list of (property, value) pairs."""
    pairs = []
    for part in style_val.split(';'):
        colon = part.find(':')
        if colon > 0:
            k = part[:colon].strip()
            v = part[colon+1:].strip()
            if k:
                pairs.append((k, v))
    return pairs

def format_as_css_rule(selector, style_val, filter_trivial=True):
    """Format inline style as a CSS rule block."""
    pairs = style_to_css_props(style_val)
    if filter_trivial:
        # Skip properties that are 'normal', 'auto', 'none', '0' (trivial defaults)
        trivial_vals = {'normal', 'auto', 'none', '0', '0px', 'initial', 'inherit',
                        'unset', 'revert', 'visible', 'static', 'relative',
                        'rgba(0, 0, 0, 0)', 'transparent', 'nowrap', 'solid',
                        'content-box', 'border-box', 'inset'}
        skip_props = {'accent-color', 'align-content', 'align-self', 'alignment-baseline',
                      'anchor-name', 'anchor-scope', 'animation-composition',
                      'animation-delay', 'animation-direction', 'animation-duration',
                      'animation-fill-mode', 'animation-iteration-count',
                      'animation-name', 'animation-play-state', 'animation-range',
                      'animation-timeline', 'animation-timing-function',
                      'appearance', 'aspect-ratio', 'backface-visibility',
                      'baseline-shift', 'baseline-source', 'block-size',
                      'border-block', 'border-collapse', 'border-image',
                      'border-inline', 'border-spacing', 'box-decoration-break',
                      'box-shadow', 'box-sizing', 'break-after', 'break-before',
                      'break-inside', 'caption-side', 'caret-color', 'clip',
                      'clip-path', 'clip-rule', 'color-interpolation',
                      'color-interpolation-filters', 'color-rendering', 'color-scheme',
                      'column-count', 'column-fill', 'column-gap', 'column-rule',
                      'column-span', 'column-width', 'columns', 'contain',
                      'contain-intrinsic', 'container', 'content', 'content-visibility',
                      'counter-increment', 'counter-reset', 'counter-set',
                      'cx', 'cy', 'd', 'direction', 'dominant-baseline',
                      'empty-cells', 'field-sizing', 'fill', 'fill-opacity', 'fill-rule',
                      'filter', 'flex', 'flex-wrap', 'float', 'flood-color',
                      'flood-opacity', 'font-feature-settings', 'font-kerning',
                      'font-language-override', 'font-optical-sizing',
                      'font-palette', 'font-size-adjust', 'font-stretch',
                      'font-synthesis', 'font-variant', 'forced-color-adjust',
                      'grid', 'hyphenate-character', 'hyphens', 'image-orientation',
                      'image-rendering', 'inline-size', 'input-security',
                      'interpolate-size', 'isolation', 'lighting-color',
                      'list-style', 'marker', 'mask', 'math-depth', 'math-shift',
                      'math-style', 'max-block-size', 'max-inline-size',
                      'min-block-size', 'min-inline-size', 'mix-blend-mode',
                      'object-fit', 'object-position', 'offset', 'opacity',
                      'order', 'outline', 'overflow-anchor', 'overflow-block',
                      'overflow-clip-margin', 'overflow-inline', 'overflow-wrap',
                      'overflow-x', 'overflow-y', 'overscroll-behavior',
                      'page', 'paint-order', 'perspective', 'perspective-origin',
                      'pointer-events', 'print-color-adjust', 'quotes',
                      'resize', 'rotate', 'row-gap', 'ruby-align', 'ruby-position',
                      'rx', 'ry', 'scale', 'scroll-behavior', 'scroll-margin',
                      'scroll-padding', 'scroll-snap-align', 'scroll-snap-stop',
                      'scroll-snap-type', 'scrollbar-color', 'scrollbar-gutter',
                      'scrollbar-width', 'shape-image-threshold', 'shape-margin',
                      'shape-outside', 'shape-rendering', 'speak', 'stop-color',
                      'stop-opacity', 'stroke', 'stroke-dasharray', 'stroke-dashoffset',
                      'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit',
                      'stroke-opacity', 'stroke-width', 'tab-size', 'table-layout',
                      'text-align-last', 'text-anchor', 'text-combine-upright',
                      'text-decoration-skip', 'text-emphasis', 'text-indent',
                      'text-justify', 'text-orientation', 'text-overflow',
                      'text-rendering', 'text-shadow', 'text-size-adjust',
                      'text-underline-offset', 'text-underline-position',
                      'timeline-scope', 'touch-action', 'transform',
                      'transform-box', 'transform-origin', 'transform-style',
                      'transition', 'unicode-bidi', 'user-select', 'vector-effect',
                      'vertical-align', 'view-timeline', 'view-transition-class',
                      'view-transition-name', 'visibility', 'white-space',
                      'will-change', 'word-break', 'word-spacing', 'writing-mode',
                      'x', 'y', 'z-index', 'zoom'}
        pairs = [(k, v) for k, v in pairs
                 if v not in trivial_vals and k not in skip_props]
    lines = [f"  {k}: {v};" for k, v in pairs]
    return f"{selector} {{\n" + "\n".join(lines) + "\n}"

SPLASH_ITEMS = [
    ("PIPER title text", ">PIPER<", ".piper-title"),
    ("Pipeline Inspection subtitle", ">Pipeline Inspection", ".pipeline-subtitle"),
    ("시작하기 button text", ">시작하기<", ".start-button-text"),
]

all_splash_blocks = []

for desc, search, css_sel in SPLASH_ITEMS:
    tag_str, tag_pos = find_element_tag(html, search)
    if tag_str is None:
        print(f"   WARNING: '{search}' not found")
        continue

    tag_name_m = re.match(r'<([a-zA-Z][a-zA-Z0-9-]*)', tag_str)
    tag_name = tag_name_m.group(1) if tag_name_m else '?'
    class_m = re.search(r'class="([^"]*)"', tag_str)
    classes = class_m.group(1) if class_m else ''
    style_val = extract_style_value(tag_str)
    props = style_to_css_props(style_val)

    print(f"   {desc}: <{tag_name} class='{classes}'>, {len(props)} style props, tag len={len(tag_str)}")

    # Key visual properties to highlight
    key_props = ['font-family', 'font-size', 'font-weight', 'color',
                 'letter-spacing', 'line-height', 'text-transform',
                 'display', 'width', 'height', 'background-color',
                 'justify-content', 'align-items', 'flex-direction',
                 'padding', 'border-radius', 'position', 'gap']
    highlight = {k: v for k, v in props if k in key_props}
    for k, v in list(highlight.items())[:8]:
        print(f"     {k}: {v[:60]}")

    css_block = format_as_css_rule(css_sel, style_val, filter_trivial=True)
    comment = f"/* {desc} — <{tag_name}> at char {tag_pos:,} in source */\n"
    all_splash_blocks.append(comment + css_block)

# Also extract CSS custom properties (design tokens) from first splash element
print("\n   Extracting CSS custom properties (design tokens)...")
first_tag, _ = find_element_tag(html, ">PIPER<")
if first_tag:
    style_val = extract_style_value(first_tag)
    cv_pairs = [(k, v) for k, v in style_to_css_props(style_val) if k.startswith('--')]
    print(f"   Found {len(cv_pairs)} CSS custom properties")
    if cv_pairs:
        token_block = ":root {\n" + "\n".join(f"  {k}: {v};" for k, v in cv_pairs) + "\n}"
        all_splash_blocks.insert(0, "/* Design tokens (CSS custom properties) from splash elements */\n" + token_block)

splash_out = os.path.join(OUT_DIR, "extracted_splash_css.txt")
with open(splash_out, 'w', encoding='utf-8') as f:
    f.write("/* ============================================================\n")
    f.write("   Splash/Landing Screen CSS — 01 _ Pulse.html\n")
    f.write("   NOTE: This app uses inline styles (no class-based CSS rules).\n")
    f.write("   Styles below are extracted from elements containing key texts.\n")
    f.write("   Trivial/default CSS properties are filtered out.\n")
    f.write("   ============================================================ */\n\n")
    for block in all_splash_blocks:
        f.write(block)
        f.write("\n\n")

fsize = os.path.getsize(splash_out)
print(f"\n   Saved: {splash_out}")
print(f"   File size: {fsize:,} bytes")
print(f"   First 500 chars:\n{'-'*40}")
with open(splash_out, encoding='utf-8') as f:
    first500 = f.read(500)
print(first500)
print('-'*40)

print()
print("=" * 60)
print("DONE. Summary:")
for fname in ["extracted_icon.svg", "extracted_fonts.css", "extracted_splash_css.txt"]:
    fpath = os.path.join(OUT_DIR, fname)
    if os.path.exists(fpath):
        print(f"  {fname}: {os.path.getsize(fpath):,} bytes")
