import type { FlowSpec } from '../FlowChartTypes'

export const ductileFlow: FlowSpec = {
  title: '덕타일 주철관 구조안전성 검토  —  KDS 57 10 00 : 2022 / DIPRA',
  width: 520,
  height: 760,
  legend: true,

  nodes: [
    {
      id: 'start', kind: 'terminal',
      x: 260, y: 38, w: 340, h: 34,
      title: '주철관 구조안전성 검토 시작',
      codeRef: 'KDS 57 10 00',
    },

    {
      id: 'inputs', kind: 'input',
      x: 260, y: 106, w: 400, h: 48,
      title: '입력 파라미터',
      sub: 'DN · Do · K등급 · fu  |  Pd · H · γs · E′  |  침상 Type · GWL',
      codeRef: 'KS D 4311 / DIPRA',
    },

    {
      id: 's1a', kind: 'process',
      x: 145, y: 194, w: 200, h: 42,
      title: '① 토압  We (Prism Load)',
      sub: 'We = γs · H · Do',
      codeRef: 'DIPRA §3.2',
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
      x: 100, y: 346, w: 160, h: 48,
      title: '③ 내압 검토',
      sub: 'σ = Pd(Do−t) / 2t',
      codeRef: 'DIPRA §4',
    },
    {
      id: 's3', kind: 'process',
      x: 260, y: 346, w: 160, h: 48,
      title: '④ 링 휨응력',
      sub: 'σb = Kb·W·Do / t²',
      codeRef: 'DIPRA §5',
    },
    {
      id: 's4', kind: 'process',
      x: 420, y: 346, w: 160, h: 48,
      title: '⑤ 처짐 (Iowa)',
      sub: 'Δy/Do = DL·Kd·W/…',
      codeRef: 'DIPRA §6',
    },

    {
      id: 'd_all', kind: 'decision',
      x: 260, y: 436, w: 230, h: 44,
      title: '전 항목  σ, σb, Δy  합격?',
    },

    {
      id: 's5', kind: 'process',
      x: 260, y: 518, w: 300, h: 44,
      title: '⑥ 최소 소요두께 역산',
      sub: 't_req = Pd·Do / (2σ_a) + 서비스 여유',
      codeRef: 'DIPRA §7',
    },
    {
      id: 'd5', kind: 'decision',
      x: 260, y: 600, w: 220, h: 40,
      title: 't_K등급  ≥  t_required ?',
    },

    {
      id: 'ng_out', kind: 'output',
      x: 100, y: 678, w: 172, h: 44,
      title: '재설계 필요  (N.G.)',
      sub: 'K등급 상향 / 침상 개선',
      emphasis: 'ng',
    },
    {
      id: 'ok_out', kind: 'output',
      x: 420, y: 678, w: 172, h: 44,
      title: '구조적으로 안전  (O.K.)',
      sub: '전 항목 허용값 이내',
      emphasis: 'ok',
    },

    {
      id: 'end', kind: 'terminal',
      x: 260, y: 740, w: 300, h: 30,
      title: '검토 종료 / 보고서 출력',
    },
  ],

  edges: [
    { from: 'start',  to: 'inputs' },
    { from: 'inputs', to: 's1a', fromSide: 'bottom', toSide: 'top' },
    { from: 'inputs', to: 's1b', fromSide: 'bottom', toSide: 'top' },
    { from: 's1a', to: 's1c', fromSide: 'bottom', toSide: 'left' },
    { from: 's1b', to: 's1c', fromSide: 'bottom', toSide: 'right' },
    { from: 's1c', to: 's2', fromSide: 'bottom', toSide: 'top' },
    { from: 's1c', to: 's3', fromSide: 'bottom', toSide: 'top' },
    { from: 's1c', to: 's4', fromSide: 'bottom', toSide: 'top' },
    { from: 's2', to: 'd_all', fromSide: 'bottom', toSide: 'top' },
    { from: 's3', to: 'd_all', fromSide: 'bottom', toSide: 'top' },
    { from: 's4', to: 'd_all', fromSide: 'bottom', toSide: 'top' },
    {
      from: 'd_all', to: 's5',
      fromSide: 'bottom', toSide: 'top',
      color: 'ok', label: 'O.K.', labelDx: 5, labelDy: -4,
    },
    {
      from: 'd_all', to: 'ng_out',
      fromSide: 'left', toSide: 'top',
      color: 'ng', kind: 'dashed', label: 'N.G.',
      viaX: 20, labelDx: 4, labelDy: -5,
    },
    { from: 's5', to: 'd5' },
    {
      from: 'd5', to: 'ok_out',
      fromSide: 'right', toSide: 'top',
      color: 'ok', label: 'O.K.',
      viaX: 420, labelDx: 5, labelDy: -4,
    },
    {
      from: 'd5', to: 'ng_out',
      fromSide: 'left', toSide: 'top',
      color: 'ng', kind: 'dashed', label: 'N.G.',
      viaX: 20, labelDx: 4, labelDy: -5,
    },
    { from: 'ok_out', to: 'end', fromSide: 'bottom', toSide: 'right', viaY: 730 },
    { from: 'ng_out', to: 'end', fromSide: 'bottom', toSide: 'left',  viaY: 730 },
  ],
}
