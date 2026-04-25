// ============================================================
// STEP-PIPE Design System v3 — Claude 색감
// 따뜻한 크림 배경 · 테라코타 코랄 액센트 · 다크 챠콜 헤더
// ============================================================

const warm = {
  950: '#1A1512',
  900: '#1C1917',  // 앱 헤더
  850: '#252119',  // 모듈 탭바
  800: '#2D2520',
  50:  '#F5F3EF',
}
const coral = {
  700: '#A84A22',
  600: '#B85A2E',
  500: '#CC6B3D',  // 기본 액션 (Claude 시그니처 코랄)
  100: '#FDF0EB',
  50:  '#FEF7F3',
}
const gray = {
  900: '#1A1917',
  700: '#3D3A36',
  500: '#6B6560',
  400: '#A09B95',
  300: '#C8C3BC',
  200: '#E0DDD7',
  100: '#EDEBE6',
  50:  '#F9F7F4',
  0:   '#FFFFFF',
}

export const T = {
  // ── 배경 ─────────────────────────────────────────────────
  bgApp:          gray[50],        // 따뜻한 오프화이트
  bgPanel:        gray[0],
  bgPanelAlt:     warm[50],
  bgRow:          gray[50],
  bgRowHover:     gray[100],
  bgRowAlt:       warm[50],
  bgSection:      gray[100],       // 섹션 헤더 바
  bgHeader:       warm[900],       // 최상단 헤더
  bgHeaderDeep:   warm[850],       // 모듈 탭바
  bgActive:       coral[500],      // 기본 액션
  bgActiveTint:   coral[50],       // 선택 배경
  bgInput:        gray[0],
  bgInputDisabled:gray[100],
  bgOK:           '#EDF7F1',
  bgNG:           '#FDEEED',
  bgWarn:         '#FBF3E0',
  bgInfo:         coral[50],
  bgScrim:        'rgba(26,21,18,0.50)',

  // ── 텍스트 ────────────────────────────────────────────────
  textPrimary:    gray[900],
  textLabel:      gray[700],
  textMuted:      gray[500],
  textDisabled:   gray[400],
  textOnDark:     gray[0],
  textOnDarkMuted:'#BDB5AA',
  textNumber:     warm[800],
  textLink:       coral[600],
  textOK:         '#1F7A47',
  textNG:         '#B4321F',
  textWarn:       '#8A5A00',
  textAccent:     coral[500],

  // ── 테두리 ────────────────────────────────────────────────
  border:         gray[200],
  borderLight:    gray[100],
  borderStrong:   gray[300],
  borderFocus:    coral[500],
  borderOK:       '#BCE0C9',
  borderNG:       '#EFC2BA',
  borderWarn:     '#E8D29A',

  // ── 그림자 ────────────────────────────────────────────────
  shadow0:        'none',
  shadow1:        '0 1px 3px rgba(26,21,18,0.08)',
  shadow2:        '0 2px 8px rgba(26,21,18,0.10)',
  shadow3:        '0 8px 28px rgba(26,21,18,0.14)',
  shadowFocus:    `0 0 0 3px ${coral[100]}`,

  // ── 둥근 모서리 ────────────────────────────────────────────
  radiusSm:       2,
  radiusMd:       4,
  radiusLg:       8,

  // ── 크기 ──────────────────────────────────────────────────
  inputH:         '36px',
  inputHCompact:  '28px',
  rowH:           '40px',
  buttonH:        '36px',
  tabH:           '40px',

  // ── 간격 ──────────────────────────────────────────────────
  panelP:         '14px',
  cellPad:        '4px 8px',
  space1: '4px', space2: '8px', space3: '12px',
  space4: '16px', space5: '20px', space6: '24px',

  // ── 폰트 ──────────────────────────────────────────────────
  fontSans:  '"Pretendard Variable", Pretendard, "Noto Sans KR", system-ui, sans-serif',
  fontMono:  '"JetBrains Mono", "D2Coding", Consolas, monospace',
  fontBrand: '"Press Start 2P", monospace',

  // ── 타이포그래피 ────────────────────────────────────────────
  fs: {
    xs:   '11px',
    sm:   '12px',
    base: '13px',
    md:   '14px',
    lg:   '16px',
    xl:   '20px',
    xxl:  '24px',
  },
  fw: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  lh: { tight: 1.2, normal: 1.45, relaxed: 1.65 },

  // 하위 호환
  fontSzLabel:  '11px',
  fontSzInput:  '13px',
  fontSzResult: '13px',
  fontSzHeader: '13px',
} as const
