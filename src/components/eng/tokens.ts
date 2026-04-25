// ============================================================
// STEP-PIPE Design System v2
// 전문 엔지니어링 툴 — 네이비 계열 단일 팔레트
// ============================================================

// ─── Primitive palette (컴포넌트에서 직접 쓰지 않음) ──────
const navy = {
  900: '#0B1E36',
  800: '#13294B',
  700: '#1B3A66',
  600: '#27548A',
  500: '#3A6FB0',
  200: '#ADC6E5',
  100: '#DDE9F5',
  50:  '#F0F5FB',
}
const gray = {
  900: '#1A1D21',
  700: '#3F4750',
  500: '#6B7480',
  400: '#9098A2',
  300: '#C4CAD3',
  200: '#E0E4E9',
  100: '#EDF0F3',
  50:  '#F5F7F9',
  0:   '#FFFFFF',
}

export const T = {
  // ── 배경 ─────────────────────────────────────────────────
  bgApp:          gray[50],       // #F5F7F9 — 단일 앱 배경
  bgPanel:        gray[0],        // #FFFFFF
  bgPanelAlt:     gray[50],
  bgRow:          gray[50],
  bgRowHover:     gray[100],
  bgSection:      gray[100],      // 서브섹션 헤더 바
  bgHeader:       navy[800],      // 패널 헤더 + 앱 헤더 (통일)
  bgHeaderDeep:   navy[900],      // 모듈 탭바 (한 단계 깊음)
  bgActive:       navy[700],      // 선택된 세그먼트/탭
  bgActiveTint:   navy[50],       // 선택 행 배경 (연한 틴트)
  bgInput:        gray[0],
  bgInputDisabled:gray[100],
  bgOK:           '#EAF6EE',
  bgNG:           '#FBECE9',
  bgWarn:         '#FBF2DD',
  bgInfo:         navy[50],
  bgScrim:        'rgba(11,30,54,0.45)',

  // ── 텍스트 ────────────────────────────────────────────────
  textPrimary:    gray[900],      // #1A1D21
  textLabel:      gray[700],      // #3F4750
  textMuted:      gray[500],      // #6B7480
  textDisabled:   gray[400],
  textOnDark:     gray[0],        // 어두운 배경 위 흰 텍스트
  textOnDarkMuted:'#B0BFCF',
  textNumber:     navy[800],      // 계산값 숫자 (was #003399)
  textLink:       navy[600],
  textOK:         '#1F7A47',
  textNG:         '#B4321F',
  textWarn:       '#8A5A00',
  textAccent:     navy[700],      // 강조 라벨 (섹션 헤더 등)

  // ── 테두리 ────────────────────────────────────────────────
  border:         gray[300],      // #C4CAD3 — 기본
  borderLight:    gray[200],      // #E0E4E9
  borderStrong:   gray[400],      // #9098A2
  borderFocus:    navy[500],      // focus ring
  borderOK:       '#BCE0C9',
  borderNG:       '#EFC2BA',
  borderWarn:     '#E8D29A',

  // ── 그림자 (elevation) ────────────────────────────────────
  shadow0:        'none',
  shadow1:        '0 1px 3px rgba(11,30,54,0.08)',
  shadow2:        '0 2px 8px rgba(11,30,54,0.10)',
  shadow3:        '0 8px 28px rgba(11,30,54,0.14)',
  shadowFocus:    `0 0 0 3px ${navy[100]}`,

  // ── 둥근 모서리 ────────────────────────────────────────────
  radiusSm:       2,    // px — 입력칸, 칩, 세그먼트
  radiusMd:       4,    // px — 패널, 카드, 팝오버
  radiusLg:       8,    // px — 모달 전용

  // ── 크기 (touch-friendly) ─────────────────────────────────
  inputH:         '36px',   // 모든 입력칸 통일 (전 22/32 혼재 → 통일)
  inputHCompact:  '28px',   // 테이블 내부 전용
  rowH:           '40px',
  buttonH:        '36px',
  tabH:           '40px',

  // ── 간격 ──────────────────────────────────────────────────
  panelP:         '14px',
  cellPad:        '4px 8px',
  space1: '4px', space2: '8px', space3: '12px',
  space4: '16px', space5: '20px', space6: '24px',

  // ── 폰트 (단일 산세리프 + 단일 모노) ─────────────────────
  fontSans:  '"Pretendard Variable", Pretendard, "Noto Sans KR", system-ui, sans-serif',
  fontMono:  '"JetBrains Mono", "D2Coding", Consolas, monospace',
  fontBrand: '"Press Start 2P", monospace',  // 헤더/스플래시 전용

  // ── 타이포그래피 스케일 ────────────────────────────────────
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

  // 하위 호환 (마이그레이션 기간 임시)
  fontSzLabel:  '11px',
  fontSzInput:  '13px',
  fontSzResult: '13px',
  fontSzHeader: '13px',
} as const
