import type { FlowSpec } from '../FlowChartTypes'

export const ductileFlow: FlowSpec = {
  title: '수도용 덕타일 주철관 구조안전성 검토  —  세부지침 제11장 11.5.2',
  width: 520,
  height: 760,
  legend: true,

  nodes: [
    {
      id: 'start', kind: 'terminal',
      x: 260, y: 38, w: 340, h: 34,
      title: '주철관 구조안전성 검토 시작',
      codeRef: '세부지침 11-137',
    },

    {
      id: 'inputs', kind: 'input',
      x: 260, y: 106, w: 400, h: 48,
      title: '입력 파라미터',
      sub: 'DN · D · t(실측/기준 최소)  |  P · P′ · H · γt  |  지지각 · 압력구간',
      codeRef: 'KS D 4311 / 세부지침 11-137',
    },

    {
      id: 's1a', kind: 'process',
      x: 145, y: 194, w: 200, h: 42,
      title: '① 상부 토압  Wf',
      sub: 'H≤2m: γt·H  |  H>2m: Cd·γt·B',
      codeRef: '세부지침 11-134',
    },
    {
      id: 's1b', kind: 'process',
      x: 375, y: 194, w: 200, h: 42,
      title: '② 노면하중  Wt',
      sub: '강관의 계산공식과 동일',
      codeRef: '세부지침 11-134',
    },
    {
      id: 's1c', kind: 'process',
      x: 260, y: 270, w: 300, h: 34,
      title: '합계 하중  W = Wf + Wt  [kg/cm²]',
    },

    {
      id: 's2', kind: 'process',
      x: 100, y: 346, w: 160, h: 48,
      title: '③ 내압 인장응력',
      sub: 'σts = P·D/(2t), σtd = P′·D/(2t)',
      codeRef: '세부지침 11-137',
    },
    {
      id: 's3', kind: 'process',
      x: 260, y: 346, w: 160, h: 48,
      title: '④ 외압 휨응력',
      sub: 'σb = 6(Kf·Wf + Kt·Wt)R²/t²',
      codeRef: '세부지침 11-137',
    },
    {
      id: 's4', kind: 'process',
      x: 420, y: 346, w: 160, h: 48,
      title: '⑤ 조합응력',
      sub: '2.5σts + 2.0σtd + 1.4σb',
      codeRef: '세부지침 11-137',
    },

    {
      id: 'd_all', kind: 'decision',
      x: 260, y: 436, w: 230, h: 44,
      title: '조합 인장응력  <  S (=420 MPa) ?',
    },

    {
      id: 's5', kind: 'process',
      x: 260, y: 518, w: 300, h: 44,
      title: '⑥ 안전성평가 등급 판정',
      sub: 'SF = S / 조합응력 → a~e 등급',
      codeRef: '세부지침 11-133 [표 11.74]',
    },
    {
      id: 'd5', kind: 'decision',
      x: 260, y: 600, w: 220, h: 40,
      title: 'SF ≥ 1.0 ?',
    },

    {
      id: 'ng_out', kind: 'output',
      x: 100, y: 678, w: 172, h: 44,
      title: '보수·보강 검토  (N.G.)',
      sub: 'c~e 등급 — 단면손실 여부 확인',
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
    // 총하중→각 검토: viaY로 아래에서 수평 분기
    { from: 's1c', to: 's2', fromSide: 'bottom', toSide: 'top', viaY: 308 },
    { from: 's1c', to: 's3', fromSide: 'bottom', toSide: 'top', viaY: 308 },
    { from: 's1c', to: 's4', fromSide: 'bottom', toSide: 'top', viaY: 308 },
    // 각 검토→판정: 수직으로 합류
    { from: 's2', to: 'd_all', fromSide: 'bottom', toSide: 'top', viaY: 414 },
    { from: 's3', to: 'd_all', fromSide: 'bottom', toSide: 'top', viaY: 414 },
    { from: 's4', to: 'd_all', fromSide: 'bottom', toSide: 'top', viaY: 414 },
    {
      from: 'd_all', to: 's5',
      fromSide: 'bottom', toSide: 'top',
      color: 'ok', label: 'O.K.', labelDx: 5, labelDy: 14,
    },
    {
      from: 'd_all', to: 'ng_out',
      fromSide: 'left', toSide: 'top',
      color: 'ng', kind: 'dashed', label: 'N.G.',
      viaX: 20, labelDx: 4, labelDy: 14,
    },
    { from: 's5', to: 'd5' },
    {
      from: 'd5', to: 'ok_out',
      fromSide: 'right', toSide: 'top',
      color: 'ok', label: 'O.K.',
      viaX: 470, labelDx: 5, labelDy: 14,
    },
    {
      from: 'd5', to: 'ng_out',
      fromSide: 'left', toSide: 'top',
      color: 'ng', kind: 'dashed', label: 'N.G.',
      viaX: 20, labelDx: 4, labelDy: 14,
    },
    { from: 'ok_out', to: 'end', fromSide: 'bottom', toSide: 'right', viaY: 730 },
    { from: 'ng_out', to: 'end', fromSide: 'bottom', toSide: 'left',  viaY: 730 },
  ],
}
