import type { FlowSpec } from '../FlowChartTypes'

export const steelFlow: FlowSpec = {
  title: '강관(도복장강관) 구조안전성 검토  —  KDS 57 10 00 : 2022 / AWWA M11',
  width: 520,
  height: 800,
  legend: true,

  nodes: [
    {
      id: 'start', kind: 'terminal',
      x: 260, y: 38, w: 340, h: 34,
      title: '강관 구조안전성 검토 시작',
      codeRef: 'KDS 57 10 00',
    },

    {
      id: 'inputs', kind: 'input',
      x: 260, y: 106, w: 400, h: 48,
      title: '입력 파라미터',
      sub: 'DN · Do · t · fy  |  Pd · H · γs · E′  |  침상각 · GWL',
      codeRef: 'KS D 3565 / AWWA M11',
    },

    {
      id: 's1a', kind: 'process',
      x: 145, y: 194, w: 200, h: 42,
      title: '① 토압  We (Prism Load)',
      sub: 'We = γs · H · Do',
      codeRef: 'AWWA M11 §5.2',
    },
    {
      id: 's1b', kind: 'process',
      x: 375, y: 194, w: 200, h: 42,
      title: '② 차량하중  WL',
      sub: 'WL = PL · IF · Do  (Boussinesq)',
      codeRef: 'DB-24',
    },
    {
      id: 's1c', kind: 'process',
      x: 260, y: 270, w: 300, h: 34,
      title: '총하중  Wtotal = We + WL  [kN/m]',
    },

    {
      id: 's2', kind: 'process',
      x: 130, y: 348, w: 178, h: 46,
      title: '③ 내압 검토',
      sub: 'σ = Pd · Do / (2t)',
      codeRef: 'KDS §3.2',
    },
    {
      id: 's3', kind: 'process',
      x: 390, y: 348, w: 178, h: 46,
      title: '④ 링 휨응력',
      sub: 'σb = Kb · W · Do / t²',
      codeRef: 'KDS §3.4',
    },
    {
      id: 's4', kind: 'process',
      x: 130, y: 428, w: 178, h: 46,
      title: '⑤ 처짐 (Iowa)',
      sub: 'Δy/Do = DL·Kx·W / …',
      codeRef: 'KDS §3.5',
    },
    {
      id: 's5', kind: 'process',
      x: 390, y: 428, w: 178, h: 46,
      title: '⑥ 좌굴 (AWWA)',
      sub: 'qa = (1/FS) · √(…)',
      codeRef: 'KDS §3.6',
    },

    {
      id: 'd_all', kind: 'decision',
      x: 260, y: 516, w: 240, h: 44,
      title: '전 항목  σ, σb, Δy, FS  합격?',
    },

    {
      id: 's6', kind: 'process',
      x: 260, y: 600, w: 300, h: 44,
      title: '⑦ 최소 소요두께 역산',
      sub: 't_req = max(t_p, t_surge, t_H) + CA',
      codeRef: 'KDS §3.3',
    },
    {
      id: 'd6', kind: 'decision',
      x: 260, y: 680, w: 220, h: 40,
      title: 't_채택  ≥  t_required ?',
    },

    {
      id: 'ng_out', kind: 'output',
      x: 100, y: 758, w: 172, h: 44,
      title: '재설계 필요  (N.G.)',
      sub: '두께 증가 / 침상 조건 개선',
      emphasis: 'ng',
    },
    {
      id: 'ok_out', kind: 'output',
      x: 420, y: 758, w: 172, h: 44,
      title: '구조적으로 안전  (O.K.)',
      sub: '전 항목 허용값 이내',
      emphasis: 'ok',
    },

  ],

  edges: [
    { from: 'start',  to: 'inputs' },
    { from: 'inputs', to: 's1a', fromSide: 'bottom', toSide: 'top' },
    { from: 'inputs', to: 's1b', fromSide: 'bottom', toSide: 'top' },
    { from: 's1a', to: 's1c', fromSide: 'bottom', toSide: 'left' },
    { from: 's1b', to: 's1c', fromSide: 'bottom', toSide: 'right' },
    // 총하중→각 검토 항목: viaY로 아래에서 수평으로 분기
    { from: 's1c', to: 's2', fromSide: 'bottom', toSide: 'top', viaY: 310 },
    { from: 's1c', to: 's3', fromSide: 'bottom', toSide: 'top', viaY: 310 },
    { from: 's1c', to: 's4', fromSide: 'bottom', toSide: 'top', viaY: 310 },
    { from: 's1c', to: 's5', fromSide: 'bottom', toSide: 'top', viaY: 310 },
    // 각 검토→판정: 수직으로 합류
    { from: 's2', to: 'd_all', fromSide: 'bottom', toSide: 'top', viaY: 488 },
    { from: 's3', to: 'd_all', fromSide: 'bottom', toSide: 'top', viaY: 488 },
    { from: 's4', to: 'd_all', fromSide: 'bottom', toSide: 'top', viaY: 488 },
    { from: 's5', to: 'd_all', fromSide: 'bottom', toSide: 'top', viaY: 488 },
    {
      from: 'd_all', to: 's6',
      fromSide: 'bottom', toSide: 'top',
      color: 'ok', label: 'O.K.', labelDx: 5, labelDy: 14,
    },
    {
      from: 'd_all', to: 'ng_out',
      fromSide: 'left', toSide: 'top',
      color: 'ng', kind: 'dashed', label: 'N.G.',
      viaX: 20, labelDx: 4, labelDy: 14,
    },
    { from: 's6', to: 'd6' },
    {
      from: 'd6', to: 'ok_out',
      fromSide: 'right', toSide: 'top',
      color: 'ok', label: 'O.K.',
      viaX: 470, labelDx: 5, labelDy: 14,
    },
    {
      from: 'd6', to: 'ng_out',
      fromSide: 'left', toSide: 'top',
      color: 'ng', kind: 'dashed', label: 'N.G.',
      viaX: 20, labelDx: 4, labelDy: 14,
    },
  ],
}
