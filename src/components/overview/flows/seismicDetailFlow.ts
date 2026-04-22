import type { FlowSpec } from '../FlowChartTypes'

// ============================================================
// 내진성능 상세평가 흐름도 (응답변위법)
// 기준: KDS 57 17 00 : 2022 / 매설관로 내진성능평가 요령 부록 C
// 캔버스: 560 × 940  (컴팩트 재설계)
// ============================================================

export const seismicDetailFlow: FlowSpec = {
  title: '내진성능 상세평가 흐름도  —  KDS 57 17 00 : 2022 / 평가요령 부록 C (응답변위법)',
  width: 560,
  height: 940,
  legend: true,

  nodes: [
    // ── 시작 ───────────────────────────────────────────────
    {
      id: 'start', kind: 'terminal',
      x: 280, y: 36, w: 320, h: 32,
      title: '내진성능 상세평가 시작  (응답변위법)',
      codeRef: 'KDS 57 17 00',
    },

    // ── 입력 집계 (2열) ────────────────────────────────────
    {
      id: 'in_ground', kind: 'input',
      x: 148, y: 108, w: 200, h: 46,
      title: '지반 · 설계지진 조건',
      sub: '층별 H · Vs · 기반암 Vbs · Z · I',
      codeRef: 'KDS 17 10 00',
    },
    {
      id: 'in_pipe', kind: 'input',
      x: 412, y: 108, w: 200, h: 46,
      title: '관로 · 이음부 조건',
      sub: '관종 · DN · t · E · ν  |  연속/분절 · u_allow',
      codeRef: 'KS D 3565/4311 요령 §C.2',
    },

    // ── 지반 응답 해석 ─────────────────────────────────────
    {
      id: 'g1', kind: 'process',
      x: 148, y: 196, w: 200, h: 44,
      title: '① 지반고유주기 Tg 산정',
      sub: 'Tg = 4 · Σ(Hi / VSi)',
      codeRef: '요령 식(C.1)',
    },
    {
      id: 'g2', kind: 'process',
      x: 412, y: 196, w: 200, h: 44,
      title: '② 응답스펙트럼 Sv 산정',
      sub: 'SDS · SD1 · Ts · Vds',
      codeRef: 'KDS 17 10 00 §6',
    },

    // ── 지반변위·파장 집계 ─────────────────────────────────
    {
      id: 'g3', kind: 'process',
      x: 280, y: 278, w: 300, h: 48,
      title: '③ 지반변위 Uh · 파장 L 산정',
      sub: 'Uh = (2/π²)·Sv·Ts  |  L = Vds·Ts',
      codeRef: '요령 식(C.2~C.5)',
    },

    // ── 관종 분기 ──────────────────────────────────────────
    {
      id: 'd_type', kind: 'decision',
      x: 280, y: 366, w: 210, h: 44,
      title: '관종 분류?',
      sub: '용접이음  vs  기계식이음',
    },

    // ── [좌] 연속관 (강관 용접이음) ────────────────────────
    {
      id: 'c1', kind: 'subprocess',
      x: 140, y: 460, w: 196, h: 50,
      title: '[연속관] 축·굽힘 변형률',
      sub: 'ε_L = (4Uh/L)  ·  ε_B = π²D·Uh/2L²',
      codeRef: '식(5.3.43~44)',
      emphasis: 'info',
    },
    {
      id: 'c2', kind: 'process',
      x: 140, y: 546, w: 196, h: 46,
      title: '추가 변형률 합산',
      sub: 'ε_i (내압) + ε_t (온도) + ε_d (침하)',
      codeRef: '§5.3',
    },
    {
      id: 'c3', kind: 'decision',
      x: 140, y: 630, w: 170, h: 40,
      title: 'ε_total ≤ ε_allow ?',
    },

    // ── [우] 분절관 (덕타일 주철관 기계이음) ──────────────
    {
      id: 'seg1', kind: 'subprocess',
      x: 420, y: 460, w: 196, h: 50,
      title: '[분절관] 이음부 신축량',
      sub: 'u_J = (2/π) · L · ε_G',
      codeRef: '식(5.3.48)',
      emphasis: 'info',
    },
    {
      id: 'seg2', kind: 'process',
      x: 420, y: 546, w: 196, h: 46,
      title: '굽힘각 θ_J 산정',
      sub: 'θ_J = (π·D/L) · ε_G',
      codeRef: '식(5.3.49)',
    },
    {
      id: 'seg3', kind: 'decision',
      x: 420, y: 630, w: 170, h: 40,
      title: 'u_J, θ_J ≤ 허용?',
    },

    // ── 취약부 검토 ────────────────────────────────────────
    {
      id: 'vul', kind: 'process',
      x: 280, y: 716, w: 270, h: 46,
      title: '취약부 검토',
      sub: '밸브실 · 교차부 · 분기 · 교량횡단',
      codeRef: '요령 §C.6',
    },
    {
      id: 'd_all', kind: 'decision',
      x: 280, y: 798, w: 210, h: 44,
      title: '전 항목 합격?',
    },

    // ── 결과 ──────────────────────────────────────────────
    {
      id: 'ng_out', kind: 'output',
      x: 112, y: 862, w: 174, h: 46,
      title: '내진보강 필요  (N.G.)',
      sub: '관종 변경 / 가요이음 / 지반개량',
      emphasis: 'ng',
    },
    {
      id: 'ok_out', kind: 'output',
      x: 448, y: 862, w: 174, h: 46,
      title: '내진성능 확보  (O.K.)',
      sub: '붕괴방지 성능목표 달성',
      emphasis: 'ok',
    },

    // ── 종료 ──────────────────────────────────────────────
    {
      id: 'end', kind: 'terminal',
      x: 280, y: 924, w: 300, h: 30,
      title: '상세평가 종료 / 보고서 출력',
    },
  ],

  edges: [
    // 시작 → 입력 2열
    { from: 'start', to: 'in_ground', fromSide: 'bottom', toSide: 'top' },
    { from: 'start', to: 'in_pipe',   fromSide: 'bottom', toSide: 'top' },

    // 입력 → 지반 응답 해석
    { from: 'in_ground', to: 'g1', fromSide: 'bottom', toSide: 'top' },
    { from: 'in_pipe',   to: 'g2', fromSide: 'bottom', toSide: 'top' },

    // 지반 응답 → 집계
    { from: 'g1', to: 'g3', fromSide: 'bottom', toSide: 'left' },
    { from: 'g2', to: 'g3', fromSide: 'bottom', toSide: 'right' },

    // 집계 → 관종 분기
    { from: 'g3', to: 'd_type' },

    // 관종 분기 → 연속관 / 분절관
    {
      from: 'd_type', to: 'c1',
      fromSide: 'left', toSide: 'top',
      label: '연속관', labelDx: 4, labelDy: -4,
    },
    {
      from: 'd_type', to: 'seg1',
      fromSide: 'right', toSide: 'top',
      label: '분절관', labelDx: 4, labelDy: -4,
    },

    // 연속관 브랜치
    { from: 'c1', to: 'c2' },
    { from: 'c2', to: 'c3' },

    // 분절관 브랜치
    { from: 'seg1', to: 'seg2' },
    { from: 'seg2', to: 'seg3' },

    // 각 브랜치 OK → 취약부 검토
    {
      from: 'c3', to: 'vul',
      fromSide: 'bottom', toSide: 'left',
      color: 'ok', label: 'O.K.',
      viaY: 684, labelDx: 4, labelDy: 13,
    },
    {
      from: 'seg3', to: 'vul',
      fromSide: 'bottom', toSide: 'right',
      color: 'ok',
      viaY: 684,
    },

    // 각 브랜치 NG → N.G. 출력 (좌측 채널)
    {
      from: 'c3', to: 'ng_out',
      fromSide: 'left', toSide: 'left',
      color: 'ng', kind: 'dashed', label: 'N.G.',
      viaX: 28, labelDx: 4, labelDy: -5,
    },
    {
      from: 'seg3', to: 'ng_out',
      fromSide: 'left', toSide: 'left',
      color: 'ng', kind: 'dashed',
      viaX: 28,
    },

    // 취약부 → 최종 판정
    { from: 'vul', to: 'd_all' },

    // 최종 판정 → 결과
    {
      from: 'd_all', to: 'ok_out',
      fromSide: 'right', toSide: 'top',
      color: 'ok', label: 'O.K.',
      viaX: 448, labelDx: 6, labelDy: -4,
    },
    {
      from: 'd_all', to: 'ng_out',
      fromSide: 'left', toSide: 'left',
      color: 'ng', kind: 'dashed', label: 'N.G.',
      viaX: 28, labelDx: 4, labelDy: -5,
    },

    // 결과 → 종료
    { from: 'ok_out', to: 'end', fromSide: 'bottom', toSide: 'right', viaY: 914 },
    { from: 'ng_out', to: 'end', fromSide: 'bottom', toSide: 'left',  viaY: 914 },
  ],
}
