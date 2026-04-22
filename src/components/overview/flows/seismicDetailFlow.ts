import type { FlowSpec } from '../FlowChartTypes'

export const seismicDetailFlow: FlowSpec = {
  title: '내진성능 상세평가  —  KDS 57 17 00 : 2022 / 평가요령 부록 C (응답변위법)',
  width: 520,
  height: 900,
  legend: true,

  nodes: [
    {
      id: 'start', kind: 'terminal',
      x: 260, y: 38, w: 360, h: 34,
      title: '내진성능 상세평가 시작  (응답변위법)',
      codeRef: 'KDS 57 17 00',
    },

    {
      id: 'in_ground', kind: 'input',
      x: 140, y: 110, w: 210, h: 46,
      title: '지반 · 설계지진 조건',
      sub: '층별 H·Vs · Vbs · Z · I',
      codeRef: 'KDS 17 10 00',
    },
    {
      id: 'in_pipe', kind: 'input',
      x: 380, y: 110, w: 210, h: 46,
      title: '관로 · 이음부 조건',
      sub: '관종·DN·t·E  |  연속/분절',
      codeRef: 'KS D 3565/4311',
    },

    {
      id: 'g1', kind: 'process',
      x: 140, y: 192, w: 210, h: 42,
      title: '① 지반고유주기 Tg',
      sub: 'Tg = 4 · Σ(Hi / VSi)',
      codeRef: '요령 식(C.1)',
    },
    {
      id: 'g2', kind: 'process',
      x: 380, y: 192, w: 210, h: 42,
      title: '② 응답스펙트럼 Sv',
      sub: 'SDS · SD1 · Ts · Vds',
      codeRef: 'KDS 17 10 00 §6',
    },

    {
      id: 'g3', kind: 'process',
      x: 260, y: 270, w: 320, h: 46,
      title: '③ 지반변위 Uh · 파장 L 산정',
      sub: 'Uh = (2/π²)·Sv·Ts  |  L = Vds·Ts',
      codeRef: '요령 식(C.2~C.5)',
    },

    {
      id: 'd_type', kind: 'decision',
      x: 260, y: 350, w: 220, h: 44,
      title: '관종 분류?',
      sub: '연속관  vs  분절관',
    },

    // 연속관 브랜치
    {
      id: 'c1', kind: 'subprocess',
      x: 130, y: 440, w: 198, h: 50,
      title: '[연속관] 축·굽힘 변형률',
      sub: 'ε_L = 4Uh/L  |  ε_B = π²D·Uh/2L²',
      codeRef: '식(5.3.43~44)',
      emphasis: 'info',
    },
    {
      id: 'c2', kind: 'process',
      x: 130, y: 524, w: 198, h: 44,
      title: '추가 변형률 합산',
      sub: 'ε_i (내압) + ε_t (온도) + ε_d (침하)',
      codeRef: '§5.3',
    },
    {
      id: 'c3', kind: 'decision',
      x: 130, y: 604, w: 170, h: 40,
      title: 'ε_total ≤ ε_allow ?',
    },

    // 분절관 브랜치
    {
      id: 'seg1', kind: 'subprocess',
      x: 390, y: 440, w: 198, h: 50,
      title: '[분절관] 이음부 신축량',
      sub: 'u_J = (2/π) · L · ε_G',
      codeRef: '식(5.3.48)',
      emphasis: 'info',
    },
    {
      id: 'seg2', kind: 'process',
      x: 390, y: 524, w: 198, h: 44,
      title: '굽힘각 θ_J 산정',
      sub: 'θ_J = (π·D / L) · ε_G',
      codeRef: '식(5.3.49)',
    },
    {
      id: 'seg3', kind: 'decision',
      x: 390, y: 604, w: 170, h: 40,
      title: 'u_J, θ_J ≤ 허용?',
    },

    {
      id: 'vul', kind: 'process',
      x: 260, y: 688, w: 280, h: 44,
      title: '취약부 검토',
      sub: '밸브실 · 교차부 · 분기 · 교량횡단',
      codeRef: '요령 §C.6',
    },
    {
      id: 'd_all', kind: 'decision',
      x: 260, y: 768, w: 220, h: 44,
      title: '전 항목 합격?',
    },

    {
      id: 'ng_out', kind: 'output',
      x: 100, y: 840, w: 172, h: 44,
      title: '내진보강 필요  (N.G.)',
      sub: '관종 변경 / 내진이음 / 지반개량',
      emphasis: 'ng',
    },
    {
      id: 'ok_out', kind: 'output',
      x: 420, y: 840, w: 172, h: 44,
      title: '내진성능 확보  (O.K.)',
      sub: '붕괴방지 성능목표 달성',
      emphasis: 'ok',
    },
  ],

  edges: [
    { from: 'start', to: 'in_ground', fromSide: 'bottom', toSide: 'top' },
    { from: 'start', to: 'in_pipe',   fromSide: 'bottom', toSide: 'top' },
    { from: 'in_ground', to: 'g1', fromSide: 'bottom', toSide: 'top' },
    { from: 'in_pipe',   to: 'g2', fromSide: 'bottom', toSide: 'top' },
    { from: 'g1', to: 'g3', fromSide: 'bottom', toSide: 'left' },
    { from: 'g2', to: 'g3', fromSide: 'bottom', toSide: 'right' },
    { from: 'g3', to: 'd_type' },
    {
      from: 'd_type', to: 'c1',
      fromSide: 'left', toSide: 'top',
      label: '연속관', labelDx: 3, labelDy: -4,
    },
    {
      from: 'd_type', to: 'seg1',
      fromSide: 'right', toSide: 'top',
      label: '분절관', labelDx: 3, labelDy: -4,
    },
    { from: 'c1', to: 'c2' },
    { from: 'c2', to: 'c3' },
    { from: 'seg1', to: 'seg2' },
    { from: 'seg2', to: 'seg3' },
    {
      from: 'c3', to: 'vul',
      fromSide: 'bottom', toSide: 'left',
      color: 'ok', label: 'O.K.',
      viaY: 656, labelDx: 4, labelDy: 12,
    },
    {
      from: 'seg3', to: 'vul',
      fromSide: 'bottom', toSide: 'right',
      color: 'ok',
      viaY: 656,
    },
    {
      from: 'c3', to: 'ng_out',
      fromSide: 'left', toSide: 'left',
      color: 'ng', kind: 'dashed', label: 'N.G.',
      viaX: 22, labelDx: 3, labelDy: -5,
    },
    {
      from: 'seg3', to: 'ng_out',
      fromSide: 'left', toSide: 'left',
      color: 'ng', kind: 'dashed',
      viaX: 22,
    },
    { from: 'vul', to: 'd_all' },
    {
      from: 'd_all', to: 'ok_out',
      fromSide: 'right', toSide: 'top',
      color: 'ok', label: 'O.K.',
      viaX: 420, labelDx: 5, labelDy: -4,
    },
    {
      from: 'd_all', to: 'ng_out',
      fromSide: 'left', toSide: 'left',
      color: 'ng', kind: 'dashed', label: 'N.G.',
      viaX: 22, labelDx: 4, labelDy: -5,
    },
  ],
}
