import type { FlowSpec } from '../FlowChartTypes'

// ============================================================
// 내진성능 예비평가 흐름도
// 기준: KDS 57 17 00 : 2022 / 기존시설물(상수도) 내진성능 평가요령 부록 B
// 캔버스: 560 × 700  (컴팩트 재설계)
// ============================================================

export const seismicPrelimFlow: FlowSpec = {
  title: '내진성능 예비평가 흐름도  —  KDS 57 17 00 : 2022 / 평가요령 부록 B',
  width: 560,
  height: 700,
  legend: true,

  nodes: [
    // ── 시작 ───────────────────────────────────────────────
    {
      id: 'start', kind: 'terminal',
      x: 280, y: 36, w: 300, h: 32,
      title: '내진성능 예비평가 시작',
      codeRef: 'KDS 57 17 00',
    },

    // ── 입력 집계 (2열) ────────────────────────────────────
    {
      id: 'in_seismic', kind: 'input',
      x: 155, y: 110, w: 210, h: 46,
      title: '지진 조건',
      sub: '지진구역 Z · 내진등급 I · 권역',
      codeRef: 'KDS 17 10 00',
    },
    {
      id: 'in_pipe', kind: 'input',
      x: 405, y: 110, w: 210, h: 46,
      title: '관로 조건',
      sub: '관종 · DN · t · CONNECT · FACIL · MCONE',
      codeRef: 'KS D 3565/4311',
    },

    // ── 지반종류 (별도 입력) ───────────────────────────────
    {
      id: 'in_soil', kind: 'input',
      x: 280, y: 192, w: 260, h: 36,
      title: '지반종류  S1 ~ S6',
      codeRef: 'KDS 17 10 00 §4',
    },

    // ── 계산 단계 ──────────────────────────────────────────
    {
      id: 's1', kind: 'process',
      x: 280, y: 268, w: 260, h: 44,
      title: '① 유연도지수 FLEX 산정',
      sub: 'FLEX = f(D/t 비율)',
      codeRef: '요령 §B.2',
    },
    {
      id: 's2', kind: 'process',
      x: 280, y: 346, w: 260, h: 48,
      title: '② 세부지수 산정',
      sub: 'KIND · EARTH · SIZE · CONNECT · FACIL · MCONE',
      codeRef: '요령 §B.2 Table B-1~6',
    },
    {
      id: 's3', kind: 'process',
      x: 280, y: 430, w: 260, h: 44,
      title: '③ 취약도지수 VI 산정',
      sub: 'VI = FLEX × (KIND + EARTH + SIZE + …)',
      codeRef: '요령 식(B.1)',
    },
    {
      id: 's4', kind: 'process',
      x: 280, y: 510, w: 260, h: 44,
      title: '④ 지진도 그룹 결정',
      sub: '지진구역 × 권역 × 지반종류',
      codeRef: '요령 Table B-5',
    },

    // ── 최종 판정 ─────────────────────────────────────────
    {
      id: 'd_vul', kind: 'decision',
      x: 280, y: 588, w: 230, h: 44,
      title: '상세평가 필요?',
      sub: '1그룹  &  VI ≥ 40',
    },

    // ── 결과 ──────────────────────────────────────────────
    {
      id: 'ng_out', kind: 'output',
      x: 112, y: 648, w: 168, h: 40,
      title: '상세평가 이행  (N.G.)',
      sub: '→ 상세평가 모듈',
      emphasis: 'ng',
    },
    {
      id: 'ok_out', kind: 'output',
      x: 448, y: 648, w: 168, h: 40,
      title: '내진성능 확보  (O.K.)',
      sub: '상세평가 불필요',
      emphasis: 'ok',
    },

    // ── 종료 ──────────────────────────────────────────────
    {
      id: 'end', kind: 'terminal',
      x: 280, y: 682, w: 280, h: 30,
      title: '예비평가 종료 / 보고서 출력',
    },
  ],

  edges: [
    // 시작 → 입력 2열
    { from: 'start', to: 'in_seismic', fromSide: 'bottom', toSide: 'top' },
    { from: 'start', to: 'in_pipe',    fromSide: 'bottom', toSide: 'top' },

    // 입력 → 지반종류
    { from: 'in_seismic', to: 'in_soil', fromSide: 'bottom', toSide: 'left' },
    { from: 'in_pipe',    to: 'in_soil', fromSide: 'bottom', toSide: 'right' },

    // 지반종류 → 계산 시작
    { from: 'in_soil', to: 's1' },

    // 계산 단계 순차 연결
    { from: 's1', to: 's2' },
    { from: 's2', to: 's3' },
    { from: 's3', to: 's4' },
    { from: 's4', to: 'd_vul' },

    // 판정 → 결과
    {
      from: 'd_vul', to: 'ok_out',
      fromSide: 'right', toSide: 'top',
      color: 'ok', label: 'O.K.',
      viaX: 448, labelDx: 6, labelDy: -4,
    },
    {
      from: 'd_vul', to: 'ng_out',
      fromSide: 'left', toSide: 'top',
      color: 'ng', kind: 'dashed', label: '상세평가',
      viaX: 112, labelDx: 4, labelDy: -4,
    },

    // 결과 → 종료
    { from: 'ok_out', to: 'end', fromSide: 'bottom', toSide: 'right', viaY: 672 },
    { from: 'ng_out', to: 'end', fromSide: 'bottom', toSide: 'left',  viaY: 672 },
  ],
}
