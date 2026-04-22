import type { FlowSpec } from '../FlowChartTypes'

export const seismicPrelimFlow: FlowSpec = {
  title: '내진성능 예비평가  —  KDS 57 17 00 : 2022 / 평가요령 부록 B',
  width: 520,
  height: 660,
  legend: true,

  nodes: [
    {
      id: 'start', kind: 'terminal',
      x: 260, y: 38, w: 340, h: 34,
      title: '내진성능 예비평가 시작',
      codeRef: 'KDS 57 17 00',
    },

    {
      id: 'in_seismic', kind: 'input',
      x: 140, y: 112, w: 220, h: 46,
      title: '지진 조건',
      sub: '지진구역 Z · 내진등급 I · 권역',
      codeRef: 'KDS 17 10 00',
    },
    {
      id: 'in_pipe', kind: 'input',
      x: 380, y: 112, w: 220, h: 46,
      title: '관로 조건',
      sub: '관종 · DN · t · CONNECT · FACIL',
      codeRef: 'KS D 4311',
    },

    {
      id: 'in_soil', kind: 'input',
      x: 260, y: 192, w: 280, h: 36,
      title: '지반종류  S1 ~ S6',
      codeRef: 'KDS 17 10 00 §4',
    },

    {
      id: 's1', kind: 'process',
      x: 260, y: 264, w: 280, h: 42,
      title: '① 유연도지수 FLEX 산정',
      sub: 'FLEX = f(D/t 비율)',
      codeRef: '요령 §B.2',
    },
    {
      id: 's2', kind: 'process',
      x: 260, y: 338, w: 280, h: 46,
      title: '② 세부지수 산정',
      sub: 'KIND · EARTH · SIZE · CONNECT · FACIL · MCONE',
      codeRef: '요령 Table B-1~6',
    },
    {
      id: 's3', kind: 'process',
      x: 260, y: 416, w: 280, h: 42,
      title: '③ 취약도지수 VI 산정',
      sub: 'VI = FLEX × (KIND + EARTH + SIZE + …)',
      codeRef: '요령 식(B.1)',
    },
    {
      id: 's4', kind: 'process',
      x: 260, y: 490, w: 280, h: 42,
      title: '④ 지진도 그룹 결정',
      sub: '지진구역 × 권역 × 지반종류',
      codeRef: '요령 Table B-5',
    },

    {
      id: 'd_vul', kind: 'decision',
      x: 260, y: 562, w: 240, h: 44,
      title: '상세평가 필요?',
      sub: '1그룹  &  VI ≥ 40',
    },

    {
      id: 'ng_out', kind: 'output',
      x: 100, y: 630, w: 172, h: 44,
      title: '상세평가 이행  (N.G.)',
      sub: '→ 상세평가 모듈',
      emphasis: 'ng',
    },
    {
      id: 'ok_out', kind: 'output',
      x: 420, y: 630, w: 172, h: 44,
      title: '내진성능 확보  (O.K.)',
      sub: '상세평가 불필요',
      emphasis: 'ok',
    },
  ],

  edges: [
    { from: 'start', to: 'in_seismic', fromSide: 'bottom', toSide: 'top' },
    { from: 'start', to: 'in_pipe',    fromSide: 'bottom', toSide: 'top' },
    { from: 'in_seismic', to: 'in_soil', fromSide: 'bottom', toSide: 'left' },
    { from: 'in_pipe',    to: 'in_soil', fromSide: 'bottom', toSide: 'right' },
    { from: 'in_soil', to: 's1' },
    { from: 's1', to: 's2' },
    { from: 's2', to: 's3' },
    { from: 's3', to: 's4' },
    { from: 's4', to: 'd_vul' },
    {
      from: 'd_vul', to: 'ok_out',
      fromSide: 'right', toSide: 'top',
      color: 'ok', label: 'O.K.',
      viaX: 420, labelDx: 5, labelDy: -4,
    },
    {
      from: 'd_vul', to: 'ng_out',
      fromSide: 'left', toSide: 'top',
      color: 'ng', kind: 'dashed', label: '상세평가',
      viaX: 100, labelDx: 4, labelDy: -4,
    },
  ],
}
