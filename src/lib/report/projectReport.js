// ============================================================
// 프로젝트 단위 최종보고서 데이터 모델
//   · 시설물(관로 구간)별 계산결과 + 보고서 서술정보(meta)를 모아
//     「제3장 안전성 및 내진성능평가 결과」와 「부록」의 표 행을 만든다.
//   · 서식 견본: templates/제3장 안전성 및 내진성능평가 결과.hwpx
//                templates/부록 - 구조안전성 및 내진성능평가 상세계산서.hwpx
//   · 근거: 세부지침 11-133 ~ 11-138 / 기존시설물(상수도) 내진성능 평가요령
// ============================================================

export const DASH = '—'

// ── 시설물별 보고서 서술정보 ────────────────────────────────
// 계산으로 나오지 않는 값(측점·연장·주상도 등)은 여기에 입력한다.
// 미입력 항목은 보고서에 '—' 로 인쇄한다 (임의로 지어내지 않는다).
export const FACILITY_META_FIELDS = [
  { key: 'system',      label: '관로 계통',        ph: '송수 01',                    w: 90 },
  { key: 'segment',     label: '관로 구간',        ph: '01-4',                       w: 80 },
  { key: 'subSegment',  label: '세부 구간',        ph: '12',                         w: 70 },
  { key: 'station',     label: '측점 (Sta.No)',    ph: '2+987.93 ~ 4+026.42',        w: 190 },
  { key: 'lengthM',     label: '검토구간 연장 (m)', ph: '1,038.49',                   w: 110 },
  { key: 'position',    label: '검토위치 비고',     ph: '밸브실 #7 상류',              w: 150 },
  { key: 'pipeMark',    label: '관종 표기',        ph: 'PEP',                        w: 90 },
  { key: 'steelGrade',  label: '강종',             ph: 'STWW 400',                   w: 110 },
  { key: 'thickBase',   label: '기준 관두께 (mm)',  ph: '6.0',                        w: 110 },
  { key: 'thickMeas',   label: '실측 최소 (mm)',   ph: '5.6 (밸브실 #4)',            w: 140 },
  { key: 'operation',   label: '운전방식',         ph: '자연유하 (○○배수지 ~ △△배수지)', w: 230 },
  { key: 'burial',      label: '매설현황 / 지하수위', ph: '차도부 (DB-24) / 지표면',   w: 200 },
  { key: 'boring',      label: '적용 시추주상도',   ph: 'Y-4',                        w: 110 },
  { key: 'gwlDepth',    label: '지하수위 (GL.−m)', ph: '19.60',                      w: 110 },
  { key: 'soilVs',      label: '토층 평균 Vs (m/s)', ph: '289.4',                     w: 120 },
  { key: 'soilThick',   label: '토층두께 (m)',     ph: '21.0',                       w: 110 },
  { key: 'liquefaction', label: '액상화 생략조건',  ph: '① 지하수위 상부  ④ Vs ≥ 200 m/s', w: 240 },
]

// ── 프로젝트(보고서 표제) 정보 ──────────────────────────────
export const PROJECT_META_FIELDS = [
  { key: 'projectTitle', label: '용역명',      ph: '2026년 ○○송수관로 정밀안전진단 및 내진성능평가 용역' },
  { key: 'facilityName', label: '개별시설물명', ph: '○○광역시 송수관로 3개 구간' },
  { key: 'chapterNo',    label: '장 번호',      ph: '3' },
  { key: 'tablePrefix',  label: '표 번호 접두',  ph: '2.3' },
  { key: 'pipeKindText', label: '관종 서술',    ph: '수도용 도복장 강관(PEP, 용접이음)' },
  { key: 'overview',     label: '개요 서술',    ph: '대상 관로는 … 3개 구간이며 …' },
]

export function emptyFacilityMeta() {
  return FACILITY_META_FIELDS.reduce((o, f) => { o[f.key] = ''; return o }, {})
}
export function emptyProjectMeta() {
  return { projectTitle: '', facilityName: '', chapterNo: '3', tablePrefix: '2.3', pipeKindText: '수도용 도복장 강관(PEP, 용접이음)', overview: '' }
}

// ── 값 서식 ─────────────────────────────────────────────────
export const f = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : DASH)
export const fInt = v => (Number.isFinite(v) ? String(Math.round(v)) : DASH)
export const meta = (m, k) => (m && m[k] ? String(m[k]) : DASH)
const okText = v => (v === true ? '만족' : v === false ? '불만족' : DASH)

export const GRADE_SCORE = { a: 5, b: 4, c: 3, d: 2, e: 1 }

// ── 시설물 수집 ─────────────────────────────────────────────
/**
 * 프로젝트 → 보고서용 시설물 배열
 * @param {{meta:object, facilities:Array}} project
 */
export function collectReportFacilities(project) {
  const list = project?.facilities ?? []
  return list.map(fac => {
    const st = fac.modules?.structural ?? {}
    const pr = fac.modules?.seismicPrelim ?? {}
    const dt = fac.modules?.seismicDetail ?? {}
    return {
      id: fac.id,
      name: fac.name,
      m: { ...emptyFacilityMeta(), ...(fac.reportMeta ?? {}) },
      sIn: st.inputs ?? null, s: st.result ?? null,
      pIn: pr.inputs ?? null, p: pr.result ?? null,
      dIn: dt.inputs ?? null, d: dt.result ?? null,
    }
  })
}

/** 구간 표기 — '01-4(12)' */
export function segLabel(m) {
  if (!m.segment) return DASH
  return m.subSegment ? `${m.segment}(${m.subSegment})` : m.segment
}

// ── 구조안전성 파생값 ───────────────────────────────────────
export function structuralView(fx) {
  const r = fx.s
  if (!r) return null
  const s1 = r.steps?.step1 ?? {}, s2 = r.steps?.step2 ?? {}
  const s3 = r.steps?.step3 ?? {}, s4 = r.steps?.step4 ?? {}, s5 = r.steps?.step5 ?? {}
  const SF_defl = s4.deflectionRatio > 0 ? s4.maxDeflection / s4.deflectionRatio : null
  return {
    DN: r.DN ?? fx.sIn?.DN ?? null,
    Do: r.Do, Di: r.Di, t: r.tAdopt,
    Pd: s1.Pd, Psurge: s1.Psurge,
    sigma_t: s1.sigma_t_static, sigma_ts: s1.sigma_t_surge,
    allow_t: s1.sigmaA_static, allow_ts: s1.sigmaA_surge,
    SF_t: s1.SF_static, SF_ts: s1.SF_surge, ok_t: s1.ok,
    H: s2.H, Wv: s2.Wv, Wt: s2.Wt, Wtotal: s2.Wtotal,
    sigma_b: s3.sigma_b, allow_b: s3.sigmaA_bend, SF_b: s3.SF, ok_b: s3.ok,
    deltaX: s4.deltaX, eps: s4.deflectionRatio, epsA: s4.maxDeflection,
    SF_eps: SF_defl, ok_eps: s4.ok,
    FS: s5.FS, Bprime: s5.Bprime, qa: s5.qa, SF_q: s5.bucklingSF, ok_q: s5.ok,
    // safetyGrade 는 SAFETY_GRADES 항목 객체 {grade, score, desc}
    SF: r.SF, grade: r.safetyGrade?.grade ?? null, gradeScore: r.safetyGrade?.score ?? null,
    okAll: [s1.ok, s3.ok, s4.ok, s5.ok].every(Boolean),
  }
}

// ── 내진 본평가 파생값 (연속관) ─────────────────────────────
export function seismicView(fx) {
  const r = fx.d
  if (!r) return null
  const pct = v => (Number.isFinite(v) ? Math.abs(v) * 100 : null)
  const total = pct(r.epsilon_total), allow = pct(r.epsilon_allow)
  const inp = fx.dIn ?? {}
  const z = Number.isFinite(inp.hCover) && Number.isFinite(inp.D_out)
    ? inp.hCover + inp.D_out / 1000 / 2 : null
  return {
    DN: inp.DN, t: inp.thickness, H: inp.hCover, z, P: inp.P, soilType: inp.soilType,
    ei: pct(r.epsilon_i), eo: pct(r.epsilon_o), et: pct(r.epsilon_t),
    ed: pct(r.epsilon_d), ex: pct(r.epsilon_x),
    total, allow,
    ratio: total != null && allow > 0 ? total / allow : null,
    ok: r.strainOK,
  }
}

// ══════════════════════════════════════════════════════════
// 표 행 생성 — 제3장
// ══════════════════════════════════════════════════════════
const head4 = m => [meta(m, 'system'), meta(m, 'segment'), meta(m, 'subSegment'), meta(m, 'station')]

/** <표 x.5> 내압에 의한 원주방향 응력 및 안전율 */
export function rowsInner(facs) {
  return facs.map(fx => {
    const v = structuralView(fx)
    if (!v) return [...head4(fx.m), ...Array(7).fill(DASH)]
    // 일시하중(수격압)은 가압구간에서만 산정된다 → 미산정 시 '미적용' 으로 명시
    const sg = v.Psurge != null
    return [
      ...head4(fx.m),
      fInt(v.DN), f(v.t, 1),
      `${f(v.Pd, 2)} / ${sg ? f(v.Psurge, 2) : '미적용'}`,
      `${f(v.sigma_t, 2)} / ${sg ? f(v.sigma_ts, 2) : '미적용'}`,
      `${fInt(v.allow_t)} / ${sg ? fInt(v.allow_ts) : '미적용'}`,
      `${f(v.SF_t, 2)} / ${sg ? f(v.SF_ts, 2) : '미적용'}`,
      okText(v.ok_t),
    ]
  })
}

/** <표 x.6> 외압에 의한 원주방향 응력 및 안전율 */
export function rowsOuter(facs) {
  return facs.map(fx => {
    const v = structuralView(fx)
    if (!v) return [...head4(fx.m), ...Array(10).fill(DASH)]
    return [
      ...head4(fx.m),
      fInt(v.DN), f(v.t, 1), f(v.H, 2),
      f(v.Wv, 5), f(v.Wt, 5), f(v.Wtotal, 5),
      f(v.sigma_b, 2), fInt(v.allow_b), f(v.SF_b, 2), okText(v.ok_b),
    ]
  })
}

/** <표 x.7> 관체 변형률 및 좌굴하중 */
export function rowsDeflBuckling(facs) {
  return facs.map(fx => {
    const v = structuralView(fx)
    if (!v) return [...head4(fx.m), ...Array(10).fill(DASH)]
    return [
      ...head4(fx.m),
      f(v.deltaX, 4), f(v.eps, 3), f(v.epsA, 1), okText(v.ok_eps),
      f(v.FS, 1), f(v.Bprime, 3), f(v.qa, 4), f(v.Wtotal, 5), f(v.SF_q, 2), okText(v.ok_q),
    ]
  })
}

/** <표 x.8> 구조 안전성 검토 안전율 산정 결과 (종합) */
export function rowsStructuralSummary(facs) {
  return facs.map(fx => {
    const v = structuralView(fx)
    const m = fx.m
    if (!v) return [meta(m, 'system'), segLabel(m), meta(m, 'station'), ...Array(11).fill(DASH)]
    const score = v.gradeScore ?? GRADE_SCORE[v.grade]
    return [
      meta(m, 'system'), segLabel(m), meta(m, 'station'), fInt(v.DN),
      f(v.sigma_t, 2), f(v.SF_t, 2),
      f(v.sigma_b, 2), f(v.SF_b, 2),
      f(v.eps, 3), f(v.SF_eps, 2),
      f(v.qa, 4), f(v.Wtotal, 5), f(v.SF_q, 2),
      v.okAll ? `만족 (${v.grade ?? DASH}, ${score ?? DASH}점)` : `불만족 (${v.grade ?? DASH})`,
    ]
  })
}

/** <표 x.14> 내진성능 우선순위평가 결과표 */
export function rowsPrelim(facs) {
  return facs.map(fx => {
    const r = fx.p, m = fx.m
    const base = [meta(m, 'system'), segLabel(m),
      m.pipeMark ? `${m.pipeMark}${m.steelGrade ? ` (${m.steelGrade})` : ''}` : DASH]
    if (!r) return [...base, DASH, ...Array(7).fill(DASH)]
    return [
      ...base, fInt(fx.pIn?.DN),
      `${r.seismicityGroup}그룹`,
      f(r.FLEX, 1), f(r.KIND, 1), f(r.EARTH, 1),
      `${f(r.SIZE, 1)} / ${f(r.CONNECT, 1)} / ${f(r.FACIL, 1)} / ${f(r.MCONE, 1)}`,
      f(r.VI, 1),
      r.isCritical ? '내진성능 중요상수도' : '내진성능 유보상수도',
    ]
  })
}

/** <표 x.15> 액상화 예비평가 생략조건 검토 */
export function rowsLiquefaction(facs) {
  return facs.map(fx => {
    const m = fx.m, v = seismicView(fx)
    return [
      `${meta(m, 'system')}(${m.segment || DASH})`,
      meta(m, 'boring'), meta(m, 'gwlDepth'),
      v?.z != null ? f(v.z, 3) : DASH,
      meta(m, 'soilThick'), meta(m, 'soilVs'),
      fx.dIn?.soilType ?? DASH,
      meta(m, 'liquefaction'),
      m.liquefaction ? '생 략' : DASH,
    ]
  })
}

/** <표 x.16> 내진성능 본평가 지점 현황표 */
export function rowsSeismicPoints(facs) {
  return facs.map(fx => {
    const m = fx.m, v = seismicView(fx)
    if (!v) return [meta(m, 'system'), segLabel(m), meta(m, 'station'), ...Array(7).fill(DASH)]
    return [
      meta(m, 'system'), segLabel(m), meta(m, 'station'), meta(m, 'pipeMark'),
      fInt(v.DN), f(v.t, 1), f(v.H, 2), f(v.z, 3), f(v.P, 2), v.soilType ?? DASH,
    ]
  })
}

/** <표 x.17> 내진성능 본평가 결과표 */
export function rowsSeismicResult(facs) {
  return facs.map(fx => {
    const m = fx.m, v = seismicView(fx)
    if (!v) return [meta(m, 'system'), segLabel(m), meta(m, 'station'), ...Array(8).fill(DASH)]
    return [
      meta(m, 'system'), segLabel(m), meta(m, 'station'),
      f(v.ei, 4), f(v.eo, 4), f(v.et, 4), f(v.ed, 4), f(v.ex, 4), f(v.total, 4),
      f(v.allow, 4), okText(v.ok),
    ]
  })
}

/** <표 x.18> 내진성능평가 결과표 (우선순위 + 본평가) */
export function rowsSeismicSummary(facs) {
  return facs.map(fx => {
    const m = fx.m, p = fx.p, v = seismicView(fx)
    return [
      meta(m, 'system'), segLabel(m), meta(m, 'pipeMark'),
      fInt(v?.DN ?? fx.pIn?.DN),
      p ? f(p.VI, 1) : DASH,
      p ? (p.isCritical ? '내진성능 중요상수도' : '내진성능 유보상수도') : DASH,
      meta(m, 'station'),
      v?.ratio != null ? f(v.ratio, 3) : DASH,
      v ? (v.ok ? '내진만족' : '내진불만족') : DASH,
    ]
  })
}

/** <표 x.20> 개별시설물 안전성평가표 — 평가항목 행 */
export function rowsFacilityGrade(facs) {
  return facs.map(fx => {
    const v = structuralView(fx), m = fx.m
    return [
      `${meta(m, 'system')}(${m.segment || DASH}) 관로`,
      v ? f(v.SF, 2) : DASH,
      v?.grade ?? DASH,
      v?.grade ? String(v.gradeScore ?? GRADE_SCORE[v.grade] ?? DASH) : DASH,
      v ? governingItem(v) : DASH,
    ]
  })
}

/** 지배 검토항목 판정 — 최소 안전율 항목 */
export function governingItem(v) {
  const cands = [
    ['내압 응력 지배', v.SF_t], ['외압 휨응력 지배', v.SF_b],
    ['변형률 지배', v.SF_eps], ['좌굴 지배', v.SF_q],
  ].filter(([, sf]) => Number.isFinite(sf))
  if (!cands.length) return DASH
  return cands.reduce((a, b) => (b[1] < a[1] ? b : a))[0]
}

/** 안전성평가 결과 문구 — 세부지침 11-133 표 11.74 (N, L, 종합등급) */
export function safetyAssessment(facs) {
  const grades = facs.map(fx => structuralView(fx)?.grade).filter(Boolean)
  const scores = grades.map(g => GRADE_SCORE[g]).filter(Number.isFinite)
  if (!scores.length) return { N: facs.length, L: null, text: DASH }
  const L = Math.min(...scores)
  const worst = Object.entries(GRADE_SCORE).find(([, s]) => s === L)?.[0] ?? DASH
  return {
    N: facs.length, L, worst,
    text: `평가항목수 N = ${facs.length}, 최소평가점수 L = ${L} → 안전성평가 결과 ${worst} 등급`,
  }
}
