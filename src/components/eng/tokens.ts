// ============================================================
// 공학 해석 프로그램 스타일 디자인 토큰
// 참고: MIDAS/GEN, SAP2000 다이얼로그 스타일
// ============================================================

export const T = {
  // 배경
  bgApp:    '#f0f0f0',
  bgPanel:  '#ffffff',
  bgRow:    '#f7f7f7',    // 홀수 행
  bgRowAlt: '#ffffff',    // 짝수 행
  bgInput:  '#ffffff',
  bgActive: '#1a3a5c',
  bgHeader: '#1a3a5c',
  bgSubHeader: '#2d5080',
  bgSection: '#e8edf2',   // 섹션 헤더
  bgWarn:   '#fff8e1',
  bgOK:     '#f0faf4',
  bgNG:     '#fff0f0',

  // 텍스트
  textPrimary:  '#1a1a1a',
  textLabel:    '#333333',
  textMuted:    '#666666',
  textActive:   '#ffffff',
  textOK:       '#1a6b3a',
  textNG:       '#c0392b',
  textAccent:   '#1a3a5c',
  textNumber:   '#003399',  // 계산 결과 숫자

  // 테두리
  border:       '#cccccc',
  borderLight:  '#e0e0e0',
  borderDark:   '#aaaaaa',
  borderFocus:  '#1a3a5c',

  // 폰트
  fontMono:   'JetBrains Mono, Consolas, monospace',
  fontSans:   'Pretendard, "Noto Sans KR", sans-serif',
  fontSzLabel: '11px',
  fontSzInput: '12px',
  fontSzResult:'13px',
  fontSzHeader:'12px',

  // 간격
  rowH:   '26px',
  inputH: '22px',
  panelP: '10px 12px',
  cellPad:'2px 6px',
} as const
