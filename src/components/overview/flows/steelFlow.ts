import type { FlowSpec } from '../FlowChartTypes'

export const steelFlow: FlowSpec = {
  title: '수도용 도복장강관 구조안전성 검토  —  세부지침 제11장 11.5.2',
  width: 520,
  height: 800,
  legend: true,

  nodes: [
    {
      id: 'start', kind: 'terminal',
      x: 260, y: 38, w: 340, h: 34,
      title: '강관 구조안전성 검토 시작',
      codeRef: '세부지침 11-134',
    },

    {
      id: 'inputs', kind: 'input',
      x: 260, y: 106, w: 400, h: 48,
      title: '입력 파라미터',
      sub: 'DN · D · t(실측/기준 최소)  |  P · H · γt · E′  |  지지각 · 압력구간',
      codeRef: 'KS D 3565 / 세부지침 11-134',
    },

    {
      id: 's1a', kind: 'process',
      x: 145, y: 194, w: 200, h: 42,
      title: '① 상부 토압  Wv',
      sub: 'H≤2m: γt·H  |  H>2m: Cd·γt·B',
      codeRef: '세부지침 11-134',
    },
    {
      id: 's1b', kind: 'process',
      x: 375, y: 194, w: 200, h: 42,
      title: '② 노면하중  Wt',
      sub: '2nP(1+i) / {[…]·(a+2H·tanθ)}',
      codeRef: '세부지침 11-134',
    },
    {
      id: 's1c', kind: 'process',
      x: 260, y: 270, w: 300, h: 34,
      title: '합계 하중  W = Wv + Wt  [kg/cm²]',
    },

    {
      id: 's2', kind: 'process',
      x: 130, y: 348, w: 178, h: 46,
      title: '③ 내압 검토 (외압 없는 조건)',
      sub: 'σt = P·D/(2t) ≤ 140 MPa',
      codeRef: '세부지침 11-134',
    },
    {
      id: 's3', kind: 'process',
      x: 390, y: 348, w: 178, h: 46,
      title: '④ 외압 휨응력 (수압 없는 조건)',
      sub: "σb = 2/(f·z)·W·[…E′…] ≤ 140 MPa",
      codeRef: '세부지침 11-135',
    },
    {
      id: 's4', kind: 'process',
      x: 130, y: 428, w: 178, h: 46,
      title: '⑤ 관체 변형률',
      sub: 'ε = 2Kx·W·R⁴/(…) < 5%',
      codeRef: '세부지침 11-136',
    },
    {
      id: 's5', kind: 'process',
      x: 390, y: 428, w: 178, h: 46,
      title: '⑥ 좌굴하중',
      sub: "qa = (1/FS)·√(32RwB′E′EI/D³)",
      codeRef: '세부지침 11-136',
    },

    {
      id: 'd_all', kind: 'decision',
      x: 260, y: 516, w: 240, h: 44,
      title: '전 항목  σt, σb, ε, qa  합격?',
    },

    {
      id: 's6', kind: 'process',
      x: 260, y: 600, w: 300, h: 44,
      title: '⑦ 안전성평가 등급 판정',
      sub: 'SF = 허용응력/발생응력 → a~e 등급',
      codeRef: '세부지침 11-133 [표 11.74]',
    },
    {
      id: 'd6', kind: 'decision',
      x: 260, y: 680, w: 220, h: 40,
      title: 'SF ≥ 1.0 ?',
    },

    {
      id: 'ng_out', kind: 'output',
      x: 100, y: 758, w: 172, h: 44,
      title: '보수·보강 검토  (N.G.)',
      sub: 'c~e 등급 — 단면손실 여부 확인',
      emphasis: 'ng',
    },
    {
      id: 'ok_out', kind: 'output',
      x: 420, y: 758, w: 172, h: 44,
      title: '구조적으로 안전  (O.K.)',
      sub: 'a·b 등급 — 전 항목 허용기준 이내',
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
