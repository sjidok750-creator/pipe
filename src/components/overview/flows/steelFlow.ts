import type { FlowSpec } from '../FlowChartTypes'

// ============================================================
// 강관(도복장강관) 구조안전성 검토 흐름도
// 기준: KDS 57 10 00 : 2022 / AWWA M11
// 캔버스: 560 × 840  (컴팩트 재설계)
// ============================================================

export const steelFlow: FlowSpec = {
  title: '강관(도복장강관) 구조안전성 검토 흐름도  —  KDS 57 10 00 : 2022',
  width: 560,
  height: 840,
  legend: true,

  nodes: [
    // ── 시작 ───────────────────────────────────────────────
    {
      id: 'start', kind: 'terminal',
      x: 280, y: 36, w: 300, h: 32,
      title: '강관 구조안전성 검토 시작',
      codeRef: 'KDS 57 10 00',
    },

    // ── 입력 집계 (1열 수직 입력 → 하나의 박스) ──────────
    {
      id: 'inputs', kind: 'input',
      x: 280, y: 106, w: 380, h: 44,
      title: '입력 파라미터',
      sub: 'DN · Do · t · fy  |  Pd · H · γs · E′  |  침상각 · GWL',
      codeRef: 'KS D 3565 / AWWA M11',
    },

    // ── 하중 산정 ──────────────────────────────────────────
    {
      id: 's1a', kind: 'process',
      x: 155, y: 196, w: 190, h: 44,
      title: '① 토압  We (Prism Load)',
      sub: 'We = γs · H · Do',
      codeRef: 'AWWA M11 §5.2',
    },
    {
      id: 's1b', kind: 'process',
      x: 405, y: 196, w: 190, h: 44,
      title: '② 차량하중  WL (Boussinesq)',
      sub: 'WL = PL · IF · Do',
      codeRef: 'DB-24 KDS 24 12 20',
    },
    {
      id: 's1c', kind: 'process',
      x: 280, y: 278, w: 260, h: 36,
      title: '총하중  Wtotal = We + WL  [kN/m]',
    },

    // ── 4가지 구조검토 (2열×2행) ──────────────────────────
    {
      id: 's2', kind: 'process',
      x: 148, y: 368, w: 190, h: 46,
      title: '③ 내압 검토 (Barlow)',
      sub: 'σ = Pd · Do / (2t)',
      codeRef: 'KDS §3.2',
    },
    {
      id: 's3', kind: 'process',
      x: 412, y: 368, w: 190, h: 46,
      title: '④ 링 휨응력 검토',
      sub: 'σb = Kb · W · Do / t²',
      codeRef: 'KDS §3.4',
    },
    {
      id: 's4', kind: 'process',
      x: 148, y: 450, w: 190, h: 46,
      title: '⑤ 처짐 검토 (Iowa)',
      sub: 'Δy/Do = DL · Kx · W / …',
      codeRef: 'KDS §3.5',
    },
    {
      id: 's5', kind: 'process',
      x: 412, y: 450, w: 190, h: 46,
      title: '⑥ 좌굴 검토 (AWWA)',
      sub: 'qa = (1/FS) · √(…)',
      codeRef: 'KDS §3.6',
    },

    // ── 전체 합격 판정 ─────────────────────────────────────
    {
      id: 'd_all', kind: 'decision',
      x: 280, y: 540, w: 220, h: 44,
      title: '전 항목  σ, σb, Δy, FS 합격?',
    },

    // ── 최소 소요두께 역산 ─────────────────────────────────
    {
      id: 's6', kind: 'process',
      x: 280, y: 626, w: 290, h: 46,
      title: '⑦ 최소 소요두께 역산',
      sub: 't_req = max(t_p, t_surge, t_H) + CA',
      codeRef: 'KDS §3.3',
    },
    {
      id: 'd6', kind: 'decision',
      x: 280, y: 706, w: 220, h: 40,
      title: 't_채택 ≥ t_required ?',
    },

    // ── 결과 ──────────────────────────────────────────────
    {
      id: 'ng_out', kind: 'output',
      x: 118, y: 784, w: 180, h: 46,
      title: '재설계 필요  (N.G.)',
      sub: '두께 증가 / 침상 조건 개선',
      emphasis: 'ng',
    },
    {
      id: 'ok_out', kind: 'output',
      x: 442, y: 784, w: 180, h: 46,
      title: '구조적으로 안전  (O.K.)',
      sub: '전 항목 허용값 이내',
      emphasis: 'ok',
    },

    // ── 종료 ──────────────────────────────────────────────
    {
      id: 'end', kind: 'terminal',
      x: 280, y: 818, w: 280, h: 30,
      title: '검토 종료 / 보고서 출력',
    },
  ],

  edges: [
    // 시작 → 입력
    { from: 'start', to: 'inputs' },

    // 입력 → 하중 산정
    { from: 'inputs', to: 's1a', fromSide: 'bottom', toSide: 'top' },
    { from: 'inputs', to: 's1b', fromSide: 'bottom', toSide: 'top' },

    // 하중 → 집계
    { from: 's1a', to: 's1c', fromSide: 'bottom', toSide: 'left' },
    { from: 's1b', to: 's1c', fromSide: 'bottom', toSide: 'right' },

    // 집계 → 검토 4항목
    { from: 's1c', to: 's2', fromSide: 'bottom', toSide: 'top' },
    { from: 's1c', to: 's3', fromSide: 'bottom', toSide: 'top' },
    { from: 's1c', to: 's4', fromSide: 'bottom', toSide: 'top' },
    { from: 's1c', to: 's5', fromSide: 'bottom', toSide: 'top' },

    // 검토 4항목 → 합격 판정
    { from: 's2', to: 'd_all', fromSide: 'bottom', toSide: 'top' },
    { from: 's3', to: 'd_all', fromSide: 'bottom', toSide: 'top' },
    { from: 's4', to: 'd_all', fromSide: 'bottom', toSide: 'top' },
    { from: 's5', to: 'd_all', fromSide: 'bottom', toSide: 'top' },

    // 합격 → 두께 역산
    {
      from: 'd_all', to: 's6',
      fromSide: 'bottom', toSide: 'top',
      color: 'ok', label: 'O.K.',
      labelDx: 6, labelDy: -4,
    },
    // 불합격 → N.G. 출력
    {
      from: 'd_all', to: 'ng_out',
      fromSide: 'left', toSide: 'top',
      color: 'ng', kind: 'dashed', label: 'N.G.',
      viaX: 28, labelDx: 4, labelDy: -5,
    },

    // 두께 판정
    { from: 's6', to: 'd6' },
    {
      from: 'd6', to: 'ok_out',
      fromSide: 'right', toSide: 'top',
      color: 'ok', label: 'O.K.',
      viaX: 442, labelDx: 6, labelDy: -4,
    },
    {
      from: 'd6', to: 'ng_out',
      fromSide: 'left', toSide: 'top',
      color: 'ng', kind: 'dashed', label: 'N.G.',
      viaX: 28, labelDx: 4, labelDy: -5,
    },

    // 결과 → 종료
    { from: 'ok_out', to: 'end', fromSide: 'bottom', toSide: 'right', viaY: 808 },
    { from: 'ng_out', to: 'end', fromSide: 'bottom', toSide: 'left',  viaY: 808 },
  ],
}
