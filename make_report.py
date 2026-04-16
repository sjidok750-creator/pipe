"""
엑셀 vs PipeCheck KDS 앱 비교 분석 보고서 PDF 생성
"""
import sys, io, math
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
import os

# ── 폰트 등록 (Windows 맑은 고딕) ──────────────────────────────
FONT_PATH = r'C:\Windows\Fonts\malgun.ttf'
FONT_BOLD  = r'C:\Windows\Fonts\malgunbd.ttf'

pdfmetrics.registerFont(TTFont('Malgun', FONT_PATH))
pdfmetrics.registerFont(TTFont('MalgunBd', FONT_BOLD))

# ── 색상 ─────────────────────────────────────────────────────────
NAVY    = colors.HexColor('#003366')
RED     = colors.HexColor('#c0392b')
GREEN   = colors.HexColor('#1a7a3c')
ORANGE  = colors.HexColor('#e67e22')
YELLOW  = colors.HexColor('#fffbf0')
LGRAY   = colors.HexColor('#f5f5f5')
MGRAY   = colors.HexColor('#cccccc')
DGRAY   = colors.HexColor('#555555')
WHITE   = colors.white
BLACK   = colors.black

# ── 스타일 ───────────────────────────────────────────────────────
def S(name, **kw):
    base = dict(fontName='Malgun', fontSize=10, leading=16,
                textColor=BLACK, spaceAfter=4)
    base.update(kw)
    return ParagraphStyle(name, **base)

s_title   = S('title',  fontName='MalgunBd', fontSize=22, leading=30,
               textColor=WHITE, alignment=TA_CENTER, spaceAfter=0)
s_sub     = S('sub',    fontName='Malgun',   fontSize=12, leading=18,
               textColor=colors.HexColor('#aaccee'), alignment=TA_CENTER)
s_h1      = S('h1',     fontName='MalgunBd', fontSize=14, leading=20,
               textColor=WHITE, spaceAfter=6)
s_h2      = S('h2',     fontName='MalgunBd', fontSize=11, leading=17,
               textColor=NAVY, spaceAfter=4)
s_body    = S('body',   fontSize=9.5, leading=16, spaceAfter=3)
s_small   = S('small',  fontSize=8.5, leading=14, textColor=DGRAY)
s_ok      = S('ok',     fontName='MalgunBd', fontSize=9.5, textColor=GREEN)
s_ng      = S('ng',     fontName='MalgunBd', fontSize=9.5, textColor=RED)
s_warn    = S('warn',   fontName='MalgunBd', fontSize=9.5, textColor=ORANGE)
s_center  = S('center', fontSize=9.5, leading=15, alignment=TA_CENTER)
s_right   = S('right',  fontSize=9.5, leading=15, alignment=TA_RIGHT)

def P(text, style=None):
    return Paragraph(text, style or s_body)

def HR():
    return HRFlowable(width='100%', thickness=0.5, color=MGRAY, spaceAfter=6, spaceBefore=4)

# ── 섹션 헤더 블록 ────────────────────────────────────────────────
def section_header(text, color=NAVY):
    data = [[Paragraph(text, s_h1)]]
    t = Table(data, colWidths=[170*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), color),
        ('TOPPADDING',    (0,0),(-1,-1), 8),
        ('BOTTOMPADDING', (0,0),(-1,-1), 8),
        ('LEFTPADDING',   (0,0),(-1,-1), 12),
        ('RIGHTPADDING',  (0,0),(-1,-1), 6),
        ('ROUNDEDCORNERS', [4]),
    ]))
    return t

# ── 표 스타일 헬퍼 ───────────────────────────────────────────────
def base_table_style(header_rows=1):
    cmds = [
        ('FONTNAME',   (0,0),(-1,-1), 'Malgun'),
        ('FONTSIZE',   (0,0),(-1,-1), 9),
        ('LEADING',    (0,0),(-1,-1), 14),
        ('GRID',       (0,0),(-1,-1), 0.4, MGRAY),
        ('TOPPADDING', (0,0),(-1,-1), 5),
        ('BOTTOMPADDING',(0,0),(-1,-1), 5),
        ('LEFTPADDING',(0,0),(-1,-1), 6),
        ('RIGHTPADDING',(0,0),(-1,-1), 6),
        ('VALIGN',     (0,0),(-1,-1), 'MIDDLE'),
    ]
    for i in range(header_rows):
        cmds += [
            ('BACKGROUND', (0,i),(-1,i), NAVY),
            ('FONTNAME',   (0,i),(-1,i), 'MalgunBd'),
            ('TEXTCOLOR',  (0,i),(-1,i), WHITE),
            ('ALIGN',      (0,i),(-1,i), 'CENTER'),
        ]
    return TableStyle(cmds)

def alt_rows(style, start=1, end=50, color=LGRAY):
    cmds = []
    for i in range(start, end, 2):
        cmds.append(('BACKGROUND', (0,i),(-1,i), color))
    style.add(*cmds) if hasattr(style,'add') else None
    return cmds

# ─────────────────────────────────────────────────────────────────
# 문서 생성
# ─────────────────────────────────────────────────────────────────
OUT = r'D:\workclaude\pipe\엑셀_앱_비교분석_보고서.pdf'
doc = SimpleDocTemplate(
    OUT, pagesize=A4,
    leftMargin=20*mm, rightMargin=20*mm,
    topMargin=18*mm, bottomMargin=18*mm,
)

story = []

# ══════════════════════════════════════════════════════════════════
# 표지
# ══════════════════════════════════════════════════════════════════
cover_data = [[Paragraph('엑셀 계산서 vs PipeCheck KDS<br/>비교 분석 보고서', s_title)]]
cover = Table(cover_data, colWidths=[170*mm], rowHeights=[60*mm])
cover.setStyle(TableStyle([
    ('BACKGROUND', (0,0),(-1,-1), NAVY),
    ('VALIGN',     (0,0),(-1,-1), 'MIDDLE'),
    ('TOPPADDING', (0,0),(-1,-1), 20),
    ('BOTTOMPADDING',(0,0),(-1,-1), 20),
    ('LEFTPADDING', (0,0),(-1,-1), 10),
    ('ROUNDEDCORNERS', [6]),
]))
story.append(cover)
story.append(Spacer(1, 8*mm))

sub_data = [[
    P('대상 파일: 02-1. 구조적 안전성 검토.xlsx', s_small),
    P('작성일: 2026-04-15', s_small),
], [
    P('대상 관로: 하안 송수 강관(SP) DN1000, t=8mm', s_small),
    P('작성: PipeCheck KDS 검증팀', s_small),
]]
sub_t = Table(sub_data, colWidths=[110*mm, 60*mm])
sub_t.setStyle(TableStyle([
    ('FONTNAME', (0,0),(-1,-1), 'Malgun'),
    ('FONTSIZE', (0,0),(-1,-1), 9),
    ('TEXTCOLOR',(0,0),(-1,-1), DGRAY),
    ('TOPPADDING',(0,0),(-1,-1), 2),
    ('BOTTOMPADDING',(0,0),(-1,-1), 2),
]))
story.append(sub_t)
story.append(Spacer(1, 6*mm))

# ══════════════════════════════════════════════════════════════════
# 1. 개요
# ══════════════════════════════════════════════════════════════════
story.append(section_header('1. 검토 개요'))
story.append(Spacer(1, 3*mm))

story.append(P('본 보고서는 실무에서 사용 중인 강관 구조안전성 검토 엑셀 계산서(02-1. 구조적 안전성 검토.xlsx)와 '
               'PipeCheck KDS 앱의 계산 방법론 및 결과를 항목별로 비교·검증한 것입니다.'))
story.append(Spacer(1, 3*mm))

# 공통 입력값 표
story.append(P('<b>▶ 공통 입력값</b>', s_h2))
inp_data = [
    ['항목', '값', '단위', '비고'],
    ['관종',        '강관(SP)', '-', 'KS D 3565'],
    ['관경 DN',     '1,000',  'mm', '-'],
    ['관두께 t',    '8',      'mm', '엑셀 직접 입력'],
    ['내경 Di',     '984',    'mm', 'Do - 2t'],
    ['설계수압 P',  '0.70',   'MPa', '최대 정수압'],
    ['매설깊이 H',  '1.7 ~ 4.0', 'm', '구간별 상이'],
    ['흙 단위중량 γ', '1,800', 'kgf/m³', '18 kN/m³'],
    ['흙 반력계수 E\'', '70', 'kgf/cm²\n(≈6,865 kPa)', 'AWWA M11 조립토 중간다짐'],
    ['기초계수 Kb', '0.157', '-', '기초지지각 90°, DIPRA Type 4'],
    ['처짐계수 Kx', '0.096', '-', 'AWWA M11'],
    ['좌굴 안전율 FS', '2.5', '-', 'AWWA M11'],
    ['부력계수 Rw', '1.0', '-', '지하수위 관저 이하'],
    ['기초계수 B\'', '0.2525', '-', '엑셀 직접 입력'],
]
inp_t = Table(inp_data, colWidths=[45*mm, 35*mm, 40*mm, 50*mm])
ts = base_table_style(1)
for i in range(2, len(inp_data), 2):
    ts.add('BACKGROUND', (0,i), (-1,i), LGRAY)
inp_t.setStyle(ts)
story.append(inp_t)
story.append(Spacer(1, 5*mm))

# ══════════════════════════════════════════════════════════════════
# 2. 엑셀 계산 결과 요약
# ══════════════════════════════════════════════════════════════════
story.append(section_header('2. 엑셀 계산서 결과 요약'))
story.append(Spacer(1, 3*mm))

story.append(P('아래는 엑셀 각 시트에서 추출한 주요 계산 결과입니다. (H=4m 구간 기준)'))
story.append(Spacer(1, 2*mm))

res_data = [
    ['검토 항목', '계산값', '허용값', '안전율', '판정'],
    ['내압 원주방향 응력 σ_hoop\n(Barlow, 외경 기준)', '43.75 MPa', '140 MPa', '3.20', 'OK'],
    ['토압 We (Marston, H=4m)', '0.437 kgf/cm²\n(42.8 kPa)', '-', '-', '-'],
    ['차량하중 Wt (8대, H=4m)', '0.079 kgf/cm²\n(7.8 kPa)', '-', '-', '-'],
    ['외압 링 휨응력 σ_b', '72.95 MPa', '140 MPa', '1.92', 'OK'],
    ['관체 변형율 δ', '0.987 %', '3.0 %', '3.04', 'OK'],
    ['허용 좌굴하중 Pcr', '2.848 kgf/cm²\n(279.3 kPa)', '-', '-', '-'],
    ['총 연직하중 (We+Wt)', '0.516 kgf/cm²\n(50.6 kPa)', '-', '-', '-'],
    ['좌굴 안전율', '-', '-', '5.52', 'OK'],
]
res_t = Table(res_data, colWidths=[55*mm, 38*mm, 28*mm, 22*mm, 22*mm])
ts2 = base_table_style(1)
for i in range(2, len(res_data), 2):
    ts2.add('BACKGROUND', (0,i), (-1,i), LGRAY)
# 판정 열 색상
for i, row in enumerate(res_data[1:], 1):
    if row[-1] == 'OK':
        ts2.add('TEXTCOLOR', (4,i), (4,i), GREEN)
        ts2.add('FONTNAME',  (4,i), (4,i), 'MalgunBd')
res_t.setStyle(ts2)
story.append(res_t)
story.append(Spacer(1, 5*mm))

# ══════════════════════════════════════════════════════════════════
# 3. 항목별 비교 분석
# ══════════════════════════════════════════════════════════════════
story.append(section_header('3. 항목별 상세 비교 분석'))
story.append(Spacer(1, 4*mm))

# ── 3-1 내압 검토 ─────────────────────────────────────────────────
story.append(P('3-1. 내압 원주방향 응력 (Barlow 공식)', s_h2))
cmp1 = [
    ['구분', '엑셀', 'PipeCheck KDS 앱', '비고'],
    ['적용 공식',
     'σ = P × Do / (2t)\n(외경 기준)',
     'σ = P × Di / (2t)\n(내경 기준)',
     'AWWA M11 §3.1 권장: 내경'],
    ['계산값',
     '0.7 × 1,000 / (2×8)\n= 43.75 MPa',
     '0.7 × 984 / (2×8)\n= 43.05 MPa',
     '차이: 0.70 MPa (1.6%)'],
    ['허용응력',
     '140 MPa\n(근거 불명확)',
     '117.5 MPa\n(fy × 0.5, KDS 57)',
     '엑셀이 19% 높은 허용값'],
    ['안전율 SF', '3.20', '2.73', '-'],
    ['판정', 'OK', 'OK', '-'],
]
t1 = Table(cmp1, colWidths=[30*mm, 45*mm, 48*mm, 47*mm])
ts3 = base_table_style(1)
for i in range(2, len(cmp1), 2):
    ts3.add('BACKGROUND', (0,i), (-1,i), LGRAY)
t1.setStyle(ts3)
story.append(t1)
story.append(Spacer(1, 2*mm))
story.append(P('⚠ <b>엑셀 문제점</b>: 허용응력 140 MPa의 기준 출처가 불명확합니다. SS400 규격 fy=235 MPa 기준 '
               'KDS 57 상시 허용응력은 fy×0.5 = 117.5 MPa이며, 엑셀 적용값 140 MPa은 fy×0.596으로 '
               '근거가 불분명합니다. 일부 구판 기준(KS D 3565 구 규격)을 준용한 것으로 추정됩니다.', s_warn))
story.append(Spacer(1, 4*mm))

# ── 3-2 토압 ──────────────────────────────────────────────────────
story.append(P('3-2. 토압 산정 방법', s_h2))
cmp2 = [
    ['구분', '엑셀', 'PipeCheck KDS 앱', '비고'],
    ['적용 방법',
     'Marston 공식\nWe = Cd × γ × B²',
     'Prism Load\nWe = γ × H × Do',
     'AWWA M11 §5.1:\nPrism Load 권장'],
    ['계산 조건',
     'Cd=1.733 (H=4m)\nB=1.4m (굴착폭)',
     'γ=18 kN/m³\nH=4.0m',
     '엑셀: B 근거 미제시'],
    ['계산 결과\n(H=4m)',
     'We = 0.437 kgf/cm²\n≈ 42.8 kPa',
     'We = 70.6 kPa\n(kN/m 기준)',
     '앱이 1.65배 보수적'],
    ['단위 선하중\n(H=4m)',
     '≈ 42.8 kN/m',
     '70.6 kN/m',
     '-'],
]
t2 = Table(cmp2, colWidths=[30*mm, 45*mm, 48*mm, 47*mm])
ts4 = base_table_style(1)
for i in range(2, len(cmp2), 2):
    ts4.add('BACKGROUND', (0,i), (-1,i), LGRAY)
t2.setStyle(ts4)
story.append(t2)
story.append(Spacer(1, 2*mm))
story.append(P('⚠ <b>엑셀 문제점</b>: Marston 공식은 강성관(콘크리트관 등)에 적합하며, 연성관(강관)에는 '
               'Prism Load 적용이 AWWA M11 및 KDS 57의 권장 방법입니다. '
               '또한 굴착폭 B=1.4m는 DN1000 강관 설치 시 일반적 굴착폭(최소 Do+600mm ≈ 1.6m)보다 좁아 '
               '근거 제시가 필요합니다.', s_warn))
story.append(Spacer(1, 4*mm))

# ── 3-3 차량하중 ──────────────────────────────────────────────────
story.append(P('3-3. 차량하중 (DB-24)', s_h2))
cmp3 = [
    ['구분', '엑셀', 'PipeCheck KDS 앱', '비고'],
    ['적용 방법',
     'Marston법 + 충격계수\n(후륜하중 9,600 kgf)',
     'DB-24 Boussinesq 테이블\n(KDS 24 12 20)',
     '앱: KDS 표준 준거'],
    ['차량 대수',
     '8대 동시 재하',
     '1대 (DB-24 기준)',
     '엑셀 근거 불명확'],
    ['충격계수 IF',
     '0.25 (H=4m)',
     '1.00 (H≥1.8m)',
     '엑셀 IF 기준 불명확'],
    ['결과 (H=4m)',
     'Wt = 7.79 kN/m\n(0.079 kgf/cm²)',
     'WL = 1.80 kN/m\n(PL=1.8 kPa)',
     '엑셀이 4.3배 큰 하중'],
    ['H=2.6m 결과',
     'Wt ≈ 9.51 kN/m',
     'WL ≈ 2.60 kN/m',
     '엑셀이 3.7배 큰 하중'],
]
t3 = Table(cmp3, colWidths=[30*mm, 45*mm, 48*mm, 47*mm])
ts5 = base_table_style(1)
for i in range(2, len(cmp3), 2):
    ts5.add('BACKGROUND', (0,i), (-1,i), LGRAY)
t3.setStyle(ts5)
story.append(t3)
story.append(Spacer(1, 2*mm))
story.append(P('⚠ <b>엑셀 문제점</b>: 차량 8대 동시 재하는 왕복 4차선 도로 양방향 동시 통행을 가정한 것으로 추정되나, '
               '설계 조건 및 적용 근거가 명시되어 있지 않습니다. '
               'KDS 24 12 20 DB-24 표준하중(1대)과 Boussinesq 분산 적분을 사용하는 앱 방식이 표준 부합합니다.', s_warn))
story.append(Spacer(1, 4*mm))

# ── 3-4 외압 휨응력 ───────────────────────────────────────────────
story.append(P('3-4. 외압 링 휨응력 (σ_b)', s_h2))
cmp4 = [
    ['구분', '엑셀', 'PipeCheck KDS 앱', '비고'],
    ['구현 여부', '○ 구현\n(핵심 검토항목)', '✕ <b>미구현</b>', '앱에 누락된 검토항목'],
    ['적용 공식',
     'σ_b = Kb × (We+Wt) × R² / Z\nZ = t²/6',
     '-\n(steelPipe.js 미구현)',
     'AWWA M11 §5.3 / DIPRA'],
    ['계산값 (H=4m)',
     '72.95 MPa\n(743.9 kgf/cm²)',
     '-',
     '-'],
    ['허용응력', '140 MPa', '-', '-'],
    ['안전율 SF', '1.92', '-', '-'],
    ['판정', 'OK', '-', '앱 추가 구현 필요'],
]
t4 = Table(cmp4, colWidths=[30*mm, 52*mm, 44*mm, 44*mm])
ts6 = base_table_style(1)
for i in range(2, len(cmp4), 2):
    ts6.add('BACKGROUND', (0,i), (-1,i), LGRAY)
ts6.add('TEXTCOLOR', (2,1), (2,1), RED)
ts6.add('FONTNAME',  (2,1), (2,1), 'MalgunBd')
t4.setStyle(ts6)
story.append(t4)
story.append(Spacer(1, 2*mm))
story.append(P('❌ <b>앱 문제점</b>: 강관 외압 링 휨응력(σ_b) 검토가 누락되어 있습니다. '
               '엑셀에서는 이 항목이 외압 안전성의 핵심 검토 결과로 제시됩니다. '
               '추가 구현이 필요합니다.', s_ng))
story.append(Spacer(1, 4*mm))

# ── 3-5 처짐 ──────────────────────────────────────────────────────
story.append(P('3-5. 관체 변형율 (Modified Iowa 방정식)', s_h2))
cmp5 = [
    ['구분', '엑셀', 'PipeCheck KDS 앱', '비고'],
    ['적용 공식',
     'δ = 2Kx(We+Wt)R⁴\n   / (EI + 0.061×E\'×R³)',
     'δ = DL·K·P_total\n   / (EI/r³ + 0.061·E\')',
     '수학적으로 동일'],
    ['처짐계수',
     '2×Kx = 2×0.096 = 0.192',
     'DL×K = 1.5×0.10 = 0.150',
     '계수 출처 상이\n(AWWA 개정판 차이)'],
    ['E\' 사용값',
     '70 kgf/cm² = 6,865 kPa',
     '6,865 kPa (동일)',
     '단위 환산 일치'],
    ['결과 (H=4m)',
     '0.987 %\n(We=0.437 kgf/cm² 사용)',
     '1.417 %\n(Prism Load 기반)',
     '하중 방법 차이로 다름'],
    ['허용 변형율', '3.0 %', '3.0 %', '일치'],
    ['판정', 'OK (SF=3.04)', 'OK (SF=2.12)', '모두 만족'],
]
t5 = Table(cmp5, colWidths=[28*mm, 48*mm, 52*mm, 42*mm])
ts7 = base_table_style(1)
for i in range(2, len(cmp5), 2):
    ts7.add('BACKGROUND', (0,i), (-1,i), LGRAY)
t5.setStyle(ts7)
story.append(t5)
story.append(Spacer(1, 2*mm))
story.append(P('ℹ <b>참고</b>: 처짐 결과 차이(0.987% vs 1.417%)는 공식 오류가 아닌 '
               '토압·차량하중 산정 방법 차이에서 기인합니다. 두 결과 모두 허용값(3.0%) 이내입니다.', s_small))
story.append(Spacer(1, 4*mm))

# ── 3-6 좌굴 ──────────────────────────────────────────────────────
story.append(P('3-6. 외압 좌굴하중 검토 (AWWA M11 Eq. 5-5)', s_h2))
cmp6 = [
    ['구분', '엑셀', 'PipeCheck KDS 앱', '비고'],
    ['적용 공식',
     'Pcr = (1/FS)√(32·Rw·B\'·E\'·EI/Do³)',
     '동일',
     '공식 완전 일치'],
    ['E\' 단위',
     '70 kgf/cm²\n(kgf/cm² 단위계)',
     '6,865 kPa\n(SI 단위계)',
     '동일값, 단위 다름'],
    ['E·I',
     '2,100,000 × 0.04267\n= 89,600 kgf·cm²/cm',
     '206,000 × 10³ × I(m⁴)\n(N·m²/m 단위계)',
     '탄성계수 상이\n(엑셀: 2.1×10⁶, 앱: 206,000 MPa)'],
    ['Pcr 결과',
     '2.848 kgf/cm²\n= 279.3 kPa',
     '279.3 kPa',
     '✓ 완전 일치'],
    ['연직하중 (We+Wt)',
     '0.516 kgf/cm²\n= 50.6 kPa',
     '72.4 kPa\n(Prism+DB24)',
     '하중 산정 방법 차이'],
    ['좌굴 안전율',
     '279.3 / 50.6 = 5.52',
     '279.3 / 72.4 = 3.86',
     '앱이 더 보수적'],
    ['판정', 'OK (SF=5.52)', 'OK (SF=3.86)', '모두 만족'],
]
t6 = Table(cmp6, colWidths=[28*mm, 46*mm, 50*mm, 46*mm])
ts8 = base_table_style(1)
for i in range(2, len(cmp6), 2):
    ts8.add('BACKGROUND', (0,i), (-1,i), LGRAY)
t6.setStyle(ts8)
story.append(t6)
story.append(Spacer(1, 2*mm))
story.append(P('⚠ <b>엑셀 참고</b>: 강관 탄성계수로 2,100,000 kgf/cm² (≈ 205,940 MPa) 사용 — '
               'KS D 3565 및 AWWA M11 기준값 206,000 MPa과 실질적으로 동일합니다.', s_small))
story.append(Spacer(1, 5*mm))

# ══════════════════════════════════════════════════════════════════
# 4. 종합 문제점 정리
# ══════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(section_header('4. 종합 문제점 정리'))
story.append(Spacer(1, 4*mm))

# 4-1 엑셀 문제점
story.append(P('4-1. 엑셀 계산서 문제점', s_h2))
excel_issues = [
    ['번호', '항목', '문제 내용', '심각도'],
    ['①', '내압 허용응력\n기준 불명확',
     '140 MPa 적용 근거 미제시\nKDS 57 기준 상시 허용응력은 fy×0.5=117.5 MPa\n→ 엑셀이 19% 완화된 허용값 사용',
     '중'],
    ['②', '토압 산정 방법\n(Marston 공식)',
     '연성관(강관)에 Marston 공식 적용은 비표준\nAWWA M11·KDS 57: Prism Load 권장\n굴착폭 B=1.4m 근거 미제시 (DN1000 협소)',
     '중'],
    ['③', '차량하중\n(8대 동시 재하)',
     'DB-24 차량 8대 동시 적용 근거 불명확\n도로 차선수·중첩 조건 미명시\n표준: KDS 24 12 20 DB-24 1대 기준',
     '중'],
    ['④', '외압 휨응력\n단위 혼용 의심',
     '처짐(0.987%)과 휨응력(72.95 MPa) 계산에\n서로 다른 하중값이 사용된 정황\n역산 결과 W_total 값이 불일치',
     '고'],
    ['⑤', '다수 #REF! 오류',
     '시트 참조 오류(#REF!)로 동수두 계산 불가\n계산조건 시트에서 연결 참조 단절',
     '고'],
]
t_excel = Table(excel_issues, colWidths=[12*mm, 32*mm, 90*mm, 16*mm])
ts_e = base_table_style(1)
for i in range(2, len(excel_issues), 2):
    ts_e.add('BACKGROUND', (0,i), (-1,i), LGRAY)
# 심각도 색상
severity_colors = {'고': RED, '중': ORANGE, '저': GREEN}
for i, row in enumerate(excel_issues[1:], 1):
    sev = row[-1]
    if sev in severity_colors:
        ts_e.add('TEXTCOLOR', (3,i), (3,i), severity_colors[sev])
        ts_e.add('FONTNAME',  (3,i), (3,i), 'MalgunBd')
        ts_e.add('ALIGN',     (3,i), (3,i), 'CENTER')
t_excel.setStyle(ts_e)
story.append(t_excel)
story.append(Spacer(1, 5*mm))

# 4-2 앱 문제점
story.append(P('4-2. PipeCheck KDS 앱 문제점 및 개선사항', s_h2))
app_issues = [
    ['번호', '항목', '내용', '우선순위'],
    ['①', '강관 외압 링 휨응력\n(σ_b) 미구현',
     'steelPipe.js에 링 휨응력 검토 스텝 누락\n공식: σ_b = Kb × (We+Wt) × R² / Z\nZ = t²/6, Kb = DIPRA 기초계수\n→ 추가 구현 권장',
     '높음'],
    ['②', '차량 동시 재하\n옵션 부재',
     '현재 DB-24 1대 기준만 지원\n다차선 도로 설계 시 차량 대수 입력 옵션 필요\n(향후 기능 확장 검토)',
     '중간'],
    ['③', 'B\' 자동 계산\nvs 직접 입력',
     '앱은 B\'=1/(1+4×e^(-0.065H/Do)) 자동 계산\n엑셀은 B\'=0.2525 직접 입력\n→ H=4m, Do=1m 시 계산값: 0.250 (엑셀: 0.2525)\n자동 계산 방식이 표준 부합',
     '낮음'],
    ['④', 'Marston 토압\n옵션 미지원',
     '일부 관련 기준에서 Marston 공식 허용\n→ 향후 토압 방법 선택 옵션 추가 검토',
     '낮음'],
]
t_app = Table(app_issues, colWidths=[12*mm, 38*mm, 86*mm, 16*mm])
ts_a = base_table_style(1)
for i in range(2, len(app_issues), 2):
    ts_a.add('BACKGROUND', (0,i), (-1,i), LGRAY)
pri_colors = {'높음': RED, '중간': ORANGE, '낮음': GREEN}
for i, row in enumerate(app_issues[1:], 1):
    pri = row[-1]
    if pri in pri_colors:
        ts_a.add('TEXTCOLOR', (3,i), (3,i), pri_colors[pri])
        ts_a.add('FONTNAME',  (3,i), (3,i), 'MalgunBd')
        ts_a.add('ALIGN',     (3,i), (3,i), 'CENTER')
t_app.setStyle(ts_a)
story.append(t_app)
story.append(Spacer(1, 5*mm))

# ══════════════════════════════════════════════════════════════════
# 5. 수치 비교 요약표
# ══════════════════════════════════════════════════════════════════
story.append(section_header('5. 수치 비교 요약 (H=4m 구간 기준)'))
story.append(Spacer(1, 4*mm))

summary = [
    ['검토 항목', '엑셀 계산값', '앱 계산값', '차이', '일치 여부'],
    ['내압 σ_hoop',
     '43.75 MPa\n(허용: 140)',
     '43.05 MPa\n(허용: 117.5)',
     '0.70 MPa\n(1.6%)',
     '▲ 공식 동일\n허용값 상이'],
    ['토압 We',
     '42.8 kPa\n(Marston)',
     '70.6 kPa\n(Prism)',
     '+27.8 kPa\n(앱 65% 큼)',
     '✕ 방법론 상이'],
    ['차량하중 Wt',
     '7.8 kPa\n(8대)',
     '1.8 kPa\n(DB24 1대)',
     '+6.0 kPa\n(엑셀 4.3배)',
     '✕ 방법론 상이'],
    ['외압 링 휨응력 σ_b',
     '72.95 MPa',
     '미구현',
     '-',
     '✕ 앱 누락'],
    ['관체 변형율 δ',
     '0.987 %',
     '1.417 %',
     '+0.430 %',
     '▲ 하중 차이\n(공식 동일)'],
    ['허용 좌굴하중 Pcr',
     '279.3 kPa',
     '279.3 kPa',
     '0.0 kPa',
     '✓ 완전 일치'],
    ['좌굴 안전율',
     '5.52',
     '3.86',
     '-1.66',
     '▲ 하중 차이'],
    ['최소관두께 기준',
     '5.02 mm (기재)',
     '자동 계산',
     '-',
     '확인 필요'],
]
t_sum = Table(summary, colWidths=[35*mm, 35*mm, 35*mm, 30*mm, 35*mm])
ts_s = base_table_style(1)
for i in range(2, len(summary), 2):
    ts_s.add('BACKGROUND', (0,i), (-1,i), LGRAY)
# 일치 여부 색상
match_map = {
    '✓ 완전 일치': GREEN,
    '▲ 공식 동일\n허용값 상이': ORANGE,
    '▲ 하중 차이\n(공식 동일)': ORANGE,
    '▲ 하중 차이': ORANGE,
    '✕ 방법론 상이': RED,
    '✕ 앱 누락': RED,
    '확인 필요': ORANGE,
}
for i, row in enumerate(summary[1:], 1):
    val = row[-1]
    for k, c in match_map.items():
        if k in val:
            ts_s.add('TEXTCOLOR', (4,i), (4,i), c)
            ts_s.add('FONTNAME',  (4,i), (4,i), 'MalgunBd')
t_sum.setStyle(ts_s)
story.append(t_sum)
story.append(Spacer(1, 5*mm))

# ══════════════════════════════════════════════════════════════════
# 6. 결론 및 권고사항
# ══════════════════════════════════════════════════════════════════
story.append(section_header('6. 결론 및 권고사항'))
story.append(Spacer(1, 4*mm))

concl = [
    ['구분', '권고사항', '조치 주체'],
    ['엑셀\n계산서',
     '① 내압 허용응력을 KDS 57 기준(117.5 MPa)으로 명확히 기재\n'
     '② 토압 산정을 Prism Load 방식으로 전환(연성관 표준)\n'
     '③ 차량하중 차량 대수 적용 근거 명시 또는 DB-24 1대 기준 적용\n'
     '④ #REF! 오류 수정(참조 시트 연결 복구)\n'
     '⑤ 외압 휨응력 계산에 사용된 하중값 일관성 검토',
     '계산서\n작성자'],
    ['PipeCheck\nKDS 앱',
     '① 강관 외압 링 휨응력(σ_b) 검토 스텝 추가 구현 [최우선]\n'
     '   - 공식: σ_b = Kb × W_total × R² / (t²/6)\n'
     '   - Kb 값: 기초지지각에 따른 DIPRA 계수 선택 UI 추가\n'
     '② 좌굴 B\' 계산 방식 자동/수동 선택 옵션 추가(선택)\n'
     '③ 현행 Prism Load + DB-24 1대 방식은 AWWA M11·KDS 57 표준 부합 — 유지',
     '앱\n개발팀'],
]
t_c = Table(concl, colWidths=[18*mm, 120*mm, 18*mm])
ts_c = base_table_style(1)
ts_c.add('BACKGROUND', (0,1), (-1,1), colors.HexColor('#fff3e0'))
ts_c.add('BACKGROUND', (0,2), (-1,2), colors.HexColor('#e8f5e9'))
ts_c.add('VALIGN', (0,0), (-1,-1), 'TOP')
t_c.setStyle(ts_c)
story.append(t_c)
story.append(Spacer(1, 4*mm))

story.append(HR())
story.append(P('본 보고서는 PipeCheck KDS 앱 검증 과정에서 작성되었으며, '
               'KDS 57 00 00 : 2022 / AWWA M11 / KS D 3565 기준에 근거합니다.', s_small))
story.append(P('작성일: 2026-04-15  |  생성: PipeCheck KDS 검증 시스템', s_small))

# ── 빌드 ─────────────────────────────────────────────────────────
doc.build(story)
print(f'PDF 생성 완료: {OUT}')
