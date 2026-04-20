import type { FlowSpec } from '../FlowChartTypes'

// ============================================================
// 내진성능 예비평가 흐름도
// 기준: KDS 57 17 00 : 2022 / 기존시설물(상수도) 내진성능 평가요령 부록 B
// 캔버스: 580 × 860
// ============================================================

export const seismicPrelimFlow: FlowSpec = {
  title: '내진성능 예비평가 흐름도  —  KDS 57 17 00 : 2022 / 평가요령 부록 B',
  width: 580,
  height: 860,
  legend: true,

  nodes: [
    // ── 시작 ────────────────────────────────────────────────
    {
      id: 'start', kind: 'terminal',
      x: 290, y: 46, w: 280, h: 34,
      title: '내진성능 예비평가 시작',
      codeRef: 'KDS 57 17 00',
    },

    // ── 입력 상단 (3열) ──────────────────────────────────────
    {
      id: 'in_zone', kind: 'input',
      x: 100, y: 128, w: 138, h: 46,
      title: '지진구역 / 등급',
      sub: 'I (Z=0.11g) / II (0.07g)',
      codeRef: 'KDS 17 10 00',
    },
    {
      id: 'in_grade', kind: 'input',
      x: 290, y: 128, w: 138, h: 46,
      title: '내진등급 / 권역',
      sub: '특/Ⅰ/Ⅱ등급 · 도시/기타',
      codeRef: 'KDS 57 17 00',
    },
    {
      id: 'in_soil', kind: 'input',
      x: 480, y: 128, w: 138, h: 46,
      title: '지반종류',
      sub: 'S1~S6',
      codeRef: 'KDS 17 10 00 §4',
    },

    // ── 입력 하단 (2열) ──────────────────────────────────────
    {
      id: 'in_pipe', kind: 'input',
      x: 165, y: 218, w: 158, h: 46,
      title: '관종 · 관경 · 두께',
      sub: '강관/주철관/PE/콘크리트',
      codeRef: 'KS D 3565/4311',
    },
    {
      id: 'in_idx', kind: 'input',
      x: 415, y: 218, w: 158, h: 46,
      title: '취약도 세부지수',
      sub: 'CONNECT · FACIL · MCONE',
      codeRef: '요령 Table B-2~4',
    },

    // ── 계산 단계 ────────────────────────────────────────────
    {
      id: 's1', kind: 'process',
      x: 290, y: 314, w: 250, h: 50,
      title: '① 유연도지수 FLEX 산정',
      sub: 'FLEX = f(D/t 비율)',
      codeRef: '요령 §B.2',
    },
    {
      id: 's2', kind: 'process',
      x: 290, y: 412, w: 250, h: 54,
      title: '② 세부지수 산정',
      sub: 'KIND · EARTH · SIZE · CONNECT',
      sub2: 'FACIL · MCONE  (Table B-1~6)',
      codeRef: '요령 §B.2',
    },
    {
      id: 's3', kind: 'process',
      x: 290, y: 514, w: 250, h: 50,
      title: '③ 취약도지수 VI 산정',
      sub: 'VI = FLEX × (KIND+EARTH+SIZE+…)',
      codeRef: '요령 식(B.1)',
    },
    {
      id: 's4', kind: 'process',
      x: 290, y: 608, w: 250, h: 50,
      title: '④ 지진도 그룹 결정',
      sub: '지진구역 × 권역 × 지반종류',
      codeRef: '요령 Table B-5',
    },

    // ── 최종 판정 ────────────────────────────────────────────
    {
      id: 'd_vul', kind: 'decision',
      x: 290, y: 706, w: 230, h: 46,
      title: '상세평가 필요?',
      sub: '1그룹 & VI ≥ 40',
    },

    // ── 결과 ────────────────────────────────────────────────
    {
      id: 'ok_prelim', kind: 'output',
      x: 466, y: 796, w: 208, h: 54,
      title: '내진성능 확보  (O.K.)',
      sub: '상세평가 불필요',
      emphasis: 'ok',
    },
    {
      id: 'ng_prelim', kind: 'output',
      x: 114, y: 796, w: 208, h: 54,
      title: '상세평가 이행  (N.G.)',
      sub: '→ seismic-detail 모듈',
      emphasis: 'ng',
    },

    // ── 종료 ────────────────────────────────────────────────
    {
      id: 'end', kind: 'terminal',
      x: 290, y: 870, w: 280, h: 34,
      title: '예비평가 종료 / 보고서 출력',
    },
  ],

  edges: [
    // ── 시작 → 입력 ────────────────────────────────────────
    { from: 'start', to: 'in_zone',  toSide: 'top', viaY: 88 },
    { from: 'start', to: 'in_grade', toSide: 'top', viaY: 88 },
    { from: 'start', to: 'in_soil',  toSide: 'top', viaY: 88 },

    // ── 상단 입력 → 하단 입력 ──────────────────────────────
    { from: 'in_zone',  to: 'in_pipe', fromSide: 'bottom', toSide: 'top', viaY: 174 },
    { from: 'in_grade', to: 'in_pipe', fromSide: 'bottom', toSide: 'top', viaY: 174 },
    { from: 'in_grade', to: 'in_idx',  fromSide: 'bottom', toSide: 'top', viaY: 174 },
    { from: 'in_soil',  to: 'in_idx',  fromSide: 'bottom', toSide: 'top', viaY: 174 },

    // ── 입력 → s1 (모든 입력이 FLEX 산정에 수렴) ──────────
    { from: 'in_pipe', to: 's1', fromSide: 'bottom', toSide: 'top', viaY: 272 },
    { from: 'in_idx',  to: 's1', fromSide: 'bottom', toSide: 'top', viaY: 272 },
    { from: 'in_zone', to: 's1', fromSide: 'bottom', toSide: 'top', viaY: 272 },

    // ── 계산 단계 연결 ─────────────────────────────────────
    { from: 's1', to: 's2' },
    { from: 's2', to: 's3' },
    { from: 's3', to: 's4' },
    { from: 's4', to: 'd_vul' },

    // ── 판정 → 결과 ────────────────────────────────────────
    {
      from: 'd_vul', to: 'ok_prelim',
      fromSide: 'right', toSide: 'top',
      color: 'ok', label: 'O.K.',
      viaX: 466, labelDx: 6, labelDy: -4,
    },
    {
      from: 'd_vul', to: 'ng_prelim',
      fromSide: 'left', toSide: 'top',
      color: 'ng', kind: 'dashed', label: '상세평가',
      viaX: 114, labelDx: 4, labelDy: -4,
    },

    // ── 결과 → 종료 ─────────────────────────────────────────
    { from: 'ok_prelim', to: 'end', fromSide: 'bottom', toSide: 'right', viaY: 848 },
    { from: 'ng_prelim', to: 'end', fromSide: 'bottom', toSide: 'left',  viaY: 848 },
  ],
}
