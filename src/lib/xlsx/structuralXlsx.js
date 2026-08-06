// ============================================================
// 구조안전성 검토 — 엑셀(.xlsx) 내보내기
// 근거: 「시설물의 안전 및 유지관리 실시 세부지침(안전점검·진단 편) 해설서」
//       제11장 상수도 11.5.2 (11-132 ~ 11-138)
// 시트: 표지 / 입력 / 하중산정 / 단면검토 / 판정요약 / 참고
//
// 모든 계산 셀은 살아있는 수식(입력 시트 정의 이름 참조)으로 기록되어
// 입력값 수정 시 엑셀에서 전체가 재계산된다.
// ※ 지침 원단위계(cm, kg, kg/cm²)를 그대로 사용한다.
// ============================================================
import { createWorkbook, downloadWorkbook, addCoverSheet, SW } from './xlsxCore.js'
import {
  GW_RW, STEEL_BEDDING, DI_BEDDING, STEEL_ALLOW, DI_COMBINED,
  STEEL_MAX_DEFLECTION, EARTH_LOAD, TRAFFIC, GUIDE_LABEL,
} from '../../engine/constants.js'

const KGF_TO_MPA = 0.0980665

export async function exportStructuralXlsx({ inputs, result, projectName, facilityName }) {
  const wb = await createWorkbook()
  const isSteel = result.pipeType === 'steel'
  const rs = result.steps
  const s1 = rs.step1          // 내압
  const s2 = rs.step2          // 작용 하중(외압)
  const s3 = rs.step3          // 휨응력
  const s4 = rs.step4          // 강관: 변형률 / 주철관: 조합응력
  const s5 = isSteel ? rs.step5 : null   // 강관: 좌굴

  const Do = result.Do
  const tAdopt = result.tAdopt
  const hasTraffic = !!inputs.hasTraffic

  addCoverSheet(wb, {
    title: '매설관로 구조안전성 검토서',
    subtitle: isSteel ? '수도용 도복장강관 (KS D 3565)' : '수도용 덕타일 주철관 (KS D 4311)',
    standard: '시설물의 안전 및 유지관리 실시 세부지침(안전점검·진단 편) 해설서 — 제11장 상수도 11.5.2',
    projectName, facilityName,
  })

  const inS = new SW(wb, '입력')
  const ld  = new SW(wb, '하중산정')
  const ck  = new SW(wb, '단면검토')
  const sm  = new SW(wb, '판정요약')
  const rf  = new SW(wb, '참고')

  // ══ 참고 시트 ══════════════════════════════════════════
  rf.title('참고 자료').blank(0.5)
  rf.sec('안전성평가 기준 [표 11.74] — 세부지침 11-133')
  rf.table([
    ['평가기준', '평가점수', '내용'],
    ['a', 5, '안전율(SF) 1.0 이상, 주부재 손상 없음'],
    ['b', 4, '안전율(SF) 1.0 이상, 주부재 손상(단면손실) 있음'],
    ['c', 3, '안전율(SF) 1.0 미만 ~ 0.9 이상'],
    ['d', 2, '안전율(SF) 0.9 미만 ~ 0.75 이상'],
    ['e', 1, '안전율(SF) 0.75 미만'],
  ])
  rf.note('※ 허용응력설계법 : SF = 허용응력 / 발생응력')
  rf.blank(0.5)

  if (isSteel) {
    rf.sec('강관 구조 안전성 허용기준 [해설 표 11.5.1] — 세부지침 11-134')
    rf.table([
      ['구분', '검토 항목', '작용 하중', '허용 기준', '하중 조건'],
      ['내압', '휨응력', '정수압', `${STEEL_ALLOW.normal} MPa (1,400 kgf/㎠)`, '상시'],
      ['내압', '휨응력', '동수압+수격압', `${STEEL_ALLOW.surge} MPa (2,100 kgf/㎠)`, '일시'],
      ['외압', '휨응력', '토압+차량하중', `${STEEL_ALLOW.normal} MPa (1,400 kgf/㎠)`, '상시'],
      ['외압', '관체 변형량', '토압+차량하중', `관경의 ${STEEL_MAX_DEFLECTION}% 미만`, '상시'],
      ['외압', '좌굴하중', '토압+차량하중', '허용하중', '상시'],
    ])
    rf.blank(0.5)
    rf.sec('강관 기초지지각별 계수 — 세부지침 11-135')
    const bedRows = [['지지각', 'K_b (휨)', 'K_x (변형)', '0.061K_b − 0.083K_x']]
    Object.values(STEEL_BEDDING).forEach(v =>
      bedRows.push([v.label, v.Kb, v.Kx, +(0.061 * v.Kb - 0.083 * v.Kx).toFixed(5)]))
    rf.table(bedRows)
  } else {
    rf.sec('덕타일 주철관 지지각별 계수 (관저) — 세부지침 11-137')
    const diRows = [['지지각', 'K_f', 'K_t']]
    Object.values(DI_BEDDING).forEach(v => diRows.push([v.label, v.Kf, v.Kt]))
    rf.table(diRows)
    rf.blank(0.5)
    rf.sec('조합응력 판정 — 세부지침 11-137')
    rf.note(`2.5·σ_ts + 2.0·σ_td + 1.4·σ_b < S  (S = ${DI_COMBINED.S} MPa, GCD400 인장강도)`)
  }
  rf.blank(0.5)
  rf.sec('작용 하중 상수 — 세부지침 11-134')
  rf.table([
    ['항목', '기호', '값', '비고'],
    ['흙의 단위중량', 'γ_t', `${EARTH_LOAD.gamma_t}`, 'kg/cm³'],
    ['내부마찰각', "φ′ = φ", `${EARTH_LOAD.phi_deg}°`, "k = (1−sinφ)/(1+sinφ), μ′ = tanφ′"],
    ['토압계수', "kμ′", +EARTH_LOAD.kmu.toFixed(5), 'φ=30°에서 유도'],
    ['굴착부 폭', 'B', 'B = 2D + 100', 'cm — 강관 정부 기준'],
    ['연직/Marston 경계', 'H', `${EARTH_LOAD.H_limit_m} m`, 'H ≤ 2.0m 연직토압'],
    ['후륜하중', 'P', TRAFFIC.P, 'kg (DB-24)'],
    ['후륜 중심간격', 'L', TRAFFIC.L_cm, 'cm'],
    ['인접차량 후륜 중심간격', 'C', TRAFFIC.C_cm, 'cm'],
    ['차륜 접지폭', 'b', TRAFFIC.b_cm, 'cm'],
    ['차륜폭', 'a', TRAFFIC.a_cm, 'cm'],
    ['Kögler 분산각', 'θ', `${TRAFFIC.theta}°`, ''],
  ])
  rf.note('※ 충격계수 i : H<1.5 → 0.5 / 1.5<H<6.5 → 0.65−0.10H / 6.5<H → 0')

  // ══ 1. 입력 시트 ═══════════════════════════════════════
  inS.title('1. 검토 입력값').blank(0.5)
  inS.sec('관로 제원').head()
  inS.item({ label: '관종', value: isSteel ? '수도용 도복장강관' : '수도용 덕타일 주철관', note: isSteel ? 'KS D 3565' : 'KS D 4311' })
  if (!result.pipeDimManual) {
    inS.item({ label: '공칭관경', sym: 'DN', value: result.DN, unit: 'mm',
      note: isSteel ? `두께등급 ${result.pnGrade}` : `K등급 ${result.selectedGrade}` })
  }
  inS.item({ label: '외경', sym: 'D', value: Do, unit: 'mm', name: 'In_Do', input: true })
  inS.item({ label: '기준 관두께', sym: 't_std', value: result.tStandard, unit: 'mm', note: isSteel ? 'STWW 400 기준' : 'K등급 기준' })
  if (result.hasMeasured) {
    inS.item({ label: '실측 최소 관두께', sym: 't_msr', value: result.tMeasured, unit: 'mm', note: '관 상세검사값' })
  }
  inS.item({ label: '적용 관두께', sym: 't', value: tAdopt, unit: 'mm', name: 'In_t', input: true,
    note: result.thicknessGoverned === 'measured'
      ? '실측 최소값 적용 (세부지침 11-134: 실측·기준 중 작은 값)'
      : '기준 두께 적용' + (result.hasMeasured ? '' : ' — 실측값 미입력') })

  inS.sec('하중·지반 조건').head()
  inS.item({ label: '정수압', sym: 'P', value: inputs.Pd, unit: 'MPa', name: 'In_Pd', input: true })
  inS.item({ label: '압력 구간', value: result.pressureZone === 'pumped' ? '가압구간 (수격압 적용)' : '자연유하 구간 (정수압)',
    note: '세부지침 11-136' })
  if (result.pressureZone === 'pumped') {
    inS.item({ label: '수격압', sym: "P′", value: s1?.Psurge, unit: 'MPa', name: 'In_Ps', input: true, note: '정수압 이상 상승압력' })
  }
  inS.item({ label: '관정 매설깊이', sym: 'H', value: inputs.H, unit: 'm', name: 'In_H', input: true })
  inS.item({ label: '흙의 단위중량', sym: 'γ_t', value: s2?.gammaSoil_kgfcm3 ?? EARTH_LOAD.gamma_t, unit: 'kg/cm³', name: 'In_gt', input: true })
  inS.item({ label: '흙 반력계수', sym: "E′", value: isSteel ? s3?.Ep : null, unit: 'kg/cm²', name: 'In_Ep', input: true, note: '세부지침 11-135 제시값 28' })
  inS.item({ label: '차량하중 적용', value: hasTraffic ? '적용 (Kögler 분산)' : '미적용', note: '세부지침 11-134' })

  const bedRow = isSteel
    ? (STEEL_BEDDING[s3?.steelBeddingType] || STEEL_BEDDING.deg90)
    : (DI_BEDDING[inputs.diBeddingType] || DI_BEDDING.deg90)
  inS.item({ label: '기초지지각', value: bedRow.label, note: isSteel ? '세부지침 11-135' : '세부지침 11-137 (관저)' })
  if (isSteel) {
    inS.item({ label: '휨모멘트계수', sym: 'K_b', value: bedRow.Kb, name: 'In_Kb', input: true })
    inS.item({ label: '변형계수',     sym: 'K_x', value: bedRow.Kx, name: 'In_Kx', input: true })
    inS.item({ label: '관체 탄성계수', sym: 'E', value: s3?.E, unit: 'kg/cm²', name: 'In_E', input: true, note: '2.1×10⁶ (세부지침 11-135)' })
    inS.item({ label: '허용응력 (상시)', sym: 'σ_a', value: STEEL_ALLOW.normal, unit: 'MPa', name: 'In_sa', input: true, note: STEEL_ALLOW.source })
    inS.item({ label: '허용 변형률', sym: '', value: STEEL_MAX_DEFLECTION, unit: '%', name: 'In_dmax', input: true, note: '관경의 5% 미만 (라이닝 무관)' })
    inS.item({ label: '부력계수', sym: 'R_w', value: s5?.Rw ?? 1.0, name: 'In_Rw', input: true,
      note: s5?.rwIsGuideline ? '세부지침 제시값 1.0' : `지하수위 ${inputs.gwLevel} — 안전측 보정값 (지침 제시값 1.0 아님)` })
    inS.item({ label: '좌굴 설계계수', sym: 'FS', value: s5?.FS, name: 'In_FS', input: true, note: 'H/D≥2 → 2.5 / H/D<2 → 3.0' })
  } else {
    inS.item({ label: '휨모멘트계수', sym: 'K_f', value: bedRow.Kf, name: 'In_Kf', input: true })
    inS.item({ label: '계수',         sym: 'K_t', value: bedRow.Kt, name: 'In_Kt', input: true })
    inS.item({ label: '기준 인장강도', sym: 'S', value: DI_COMBINED.S, unit: 'MPa', name: 'In_S', input: true, note: 'GCD400 (KS D 4311)' })
  }
  inS.item({ label: '주부재 손상(단면손실)', value: result.hasSectionLoss ? '있음' : '없음', note: '등급 a/b 구분 (표 11.74)' })

  // ══ 2. 하중산정 시트 ═══════════════════════════════════
  ld.title('2. 작용 하중 산정 (외압)').blank(0.5)
  ld.note(`근거: ${GUIDE_LABEL} 11-134 (가)`)

  ld.sec('상부 토압').head()
  const rB = ld.item({ label: '굴착부 폭', sym: 'B', formula: '2*(In_Do/10)+100', result: s2?.B_cm, unit: 'cm', note: 'B = 2D + 100 (cm)' })
  ld.item({ label: '토압계수', sym: "kμ′", value: +(s2?.kmu ?? EARTH_LOAD.kmu).toFixed(5), note: 'φ′ = φ = 30°' })
  const rCd = ld.item({
    label: 'Marston 토압계수', sym: 'C_d',
    formula: `(1-EXP(-2*${(s2?.kmu ?? EARTH_LOAD.kmu).toFixed(5)}*(In_H*100)/${rB}))/(2*${(s2?.kmu ?? EARTH_LOAD.kmu).toFixed(5)})`,
    result: s2?.Cd, note: "C_d = [1 − e^(−2kμ′H/B)] / (2kμ′)",
  })
  const WvKey = isSteel ? 'Wv' : 'Wf'
  const rWv = ld.item({
    label: '상부 토압', sym: 'W_v',
    formula: `IF(In_H<=${EARTH_LOAD.H_limit_m},In_gt*In_H*100,${rCd}*In_gt*${rB})`,
    result: s2?.[WvKey], unit: 'kg/cm²',
    note: `H ≤ 2.0m → γ_t·H (연직토압) / H > 2.0m → C_d·γ_t·B (Marston) — 현재 적용: ${s2?.earthMethod === 'marston' ? 'Marston' : '연직토압'}`,
  })

  ld.sec('노면하중').head()
  let rWt
  if (hasTraffic) {
    const ri = ld.item({
      label: '충격계수', sym: 'i',
      formula: 'IF(In_H<1.5,0.5,IF(In_H<=6.5,0.65-0.1*In_H,0))',
      result: s2?.impactFactor, note: 'H<1.5→0.5 / 1.5~6.5→0.65−0.10H / >6.5→0',
    })
    const spread = `2*In_H*100*TAN(RADIANS(${TRAFFIC.theta}))`
    rWt = ld.item({
      label: '노면하중', sym: 'W_t',
      formula: `2*${TRAFFIC.n}*${TRAFFIC.P}*(1+${ri})/((${TRAFFIC.n}*${TRAFFIC.L_cm}+${TRAFFIC.n - 1}*${TRAFFIC.C_cm}+${TRAFFIC.b_cm}+${spread})*(${TRAFFIC.a_cm}+${spread}))`,
      result: s2?.Wt, unit: 'kg/cm²',
      note: 'W_t = 2nP(1+i) / {[nL+(n−1)C+b+2H·tanθ]·(a+2H·tanθ)}',
    })
  } else {
    rWt = ld.item({ label: '노면하중', sym: 'W_t', value: 0, unit: 'kg/cm²', note: '미적용' })
  }

  ld.sec('합계').head()
  const rW = ld.item({ label: '합계 하중', sym: 'W', formula: `${rWv}+${rWt}`,
    result: isSteel ? s2?.Wtotal : (s2?.Wf ?? 0) + (s2?.Wt ?? 0), unit: 'kg/cm²', bold: true, note: 'W = W_v + W_t' })

  // ══ 3. 단면검토 시트 ═══════════════════════════════════
  ck.title('3. 단면 검토').blank(0.5)
  ck.note(`적용 기준: ${result.appliedCodeLabel}`)
  ck.note(`허용기준 근거: ${result.allowSource}`)
  const okRefs = []

  if (isSteel) {
    // ── 3.1 내압 ──
    ck.sec('3.1 내압에 의한 관의 응력 — 세부지침 11-134 (나)').head()
    ck.note('※ 내압 검토는 외부 하중(토압·노면하중)이 없는 조건 (세부지침 11-134 ②)')
    const rSt = ck.item({ label: '내압응력 (정수압)', sym: 'σ_t', formula: 'In_Pd*In_Do/(2*In_t)', result: s1?.sigma_t_static, unit: 'MPa', note: 'σ_t = P·D/(2t)' })
    okRefs.push(ck.verdict({ formula: `IF(${rSt}<=In_sa,"O.K.","N.G.")`, result: s1?.ok_static ? 'O.K.' : 'N.G.', note: `σ_t ≤ ${STEEL_ALLOW.normal} MPa (상시)` }))
    if (s1?.isPumped) {
      const rStd = ck.item({ label: '내압응력 (수격압)', sym: "σ_t′", formula: 'In_Ps*In_Do/(2*In_t)', result: s1?.sigma_t_surge, unit: 'MPa', note: '일시하중' })
      okRefs.push(ck.verdict({ formula: `IF(${rStd}<=${STEEL_ALLOW.surge},"O.K.","N.G.")`, result: s1?.ok_surge ? 'O.K.' : 'N.G.', note: `σ_t′ ≤ ${STEEL_ALLOW.surge} MPa (일시)` }))
    }

    // ── 3.2 외압 휨응력 ──
    ck.sec('3.2 외압에 의한 원주방향 휨응력 — 세부지침 11-135 (다)').head()
    const rR = ck.item({ label: '관 반경', sym: 'R', formula: 'In_Do/20+In_t/10', result: s3?.R, unit: 'cm', note: 'R = D/2 + t' })
    const rI = ck.item({ label: '단면2차모멘트', sym: 'I', formula: '(In_t/10)^3/12', result: s3?.I, unit: 'cm³', note: 'I = t³/12' })
    const rZ = ck.item({ label: '단면계수', sym: 'Z', formula: '(In_t/10)^2/6', result: s3?.Z, unit: 'cm²', note: 'Z = t²/6' })
    const rNum = ck.item({ label: '분자', sym: '', formula: `In_Kb*${rR}^2*In_E*${rI}+(0.061*In_Kb-0.083*In_Kx)*In_Ep*${rR}^5`,
      result: s3 ? (s3.Kb * s3.R ** 2 * s3.E * s3.I + (0.061 * s3.Kb - 0.083 * s3.Kx) * s3.Ep * s3.R ** 5) : null,
      note: "K_b·R²·E·I + (0.061K_b − 0.083K_x)·E′·R⁵" })
    const rDen = ck.item({ label: '분모', sym: '', formula: `In_E*${rI}+0.061*In_Ep*${rR}^3`,
      result: s3 ? (s3.E * s3.I + 0.061 * s3.Ep * s3.R ** 3) : null, note: "E·I + 0.061·E′·R³" })
    const rSbk = ck.item({ label: '휨응력', sym: 'σ_b', formula: `(2/(1.5*${rZ}))*${rW}*${rNum}/${rDen}`, result: s3?.sigma_b_kgf, unit: 'kg/cm²', note: 'f = 1.5 (소성단면계수)' })
    const rSb = ck.item({ label: '휨응력', sym: 'σ_b', formula: `${rSbk}*${KGF_TO_MPA}`, result: s3?.sigma_b, unit: 'MPa' })
    okRefs.push(ck.verdict({ formula: `IF(${rSb}<=In_sa,"O.K.","N.G.")`, result: s3?.ok ? 'O.K.' : 'N.G.', note: `σ_b ≤ ${STEEL_ALLOW.normal} MPa` }))

    // ── 3.3 변형률 ──
    ck.sec('3.3 외압에 의한 원주방향 변형률 — 세부지침 11-136 (라)').head()
    const rDx = ck.item({ label: '변형량', sym: 'Δx', formula: `2*In_Kx*${rW}*${rR}^4/${rDen}`, result: s4?.deltaX, unit: 'cm' })
    const rEps = ck.item({ label: '변형률', sym: 'ε', formula: `${rDx}/(In_Do/10)*100`, result: s4?.deflectionRatio, unit: '%',
      note: "ε = 2K_x(W_v+W_t)R⁴ / (EI + 0.061E′R³) × (1/D) × 100" })
    okRefs.push(ck.verdict({ formula: `IF(${rEps}<In_dmax,"O.K.","N.G.")`, result: s4?.ok ? 'O.K.' : 'N.G.', note: `ε < ${STEEL_MAX_DEFLECTION}% (관경의 5% 미만)` }))

    // ── 3.4 좌굴 ──
    ck.sec('3.4 외압에 의한 좌굴하중 — 세부지침 11-136 (마)').head()
    const rHD = ck.item({ label: '', sym: 'H/D', formula: 'In_H*100/(In_Do/10)', result: s5?.HoverD })
    const rBp = ck.item({ label: '기초계수', sym: "B′", formula: `0.15+0.041*${rHD}`, result: s5?.Bprime, note: "B′ = 0.15 + 0.041(H/D)" })
    const rQa = ck.item({ label: '허용 좌굴하중', sym: 'q_a', formula: `(1/In_FS)*SQRT(32*In_Rw*${rBp}*In_Ep*(In_E*${rI})/((In_Do/10)^3))`,
      result: s5?.qa, unit: 'kg/cm²', note: "q_a = (1/FS)·√(32·R_w·B′·E′·EI/D³)" })
    okRefs.push(ck.verdict({ formula: `IF(${rW}<=${rQa},"O.K.","N.G.")`, result: s5?.ok ? 'O.K.' : 'N.G.', note: 'W ≤ q_a' }))
  } else {
    // ── 주철관: 조합응력 ──
    ck.sec('3.1 내압에 의한 인장응력 — 세부지침 11-137 (가)').head()
    const rDi = ck.item({ label: '내경', sym: 'D_i', formula: 'In_Do-2*In_t', result: result.Di, unit: 'mm' })
    const rSts = ck.item({ label: '정수압 인장응력', sym: 'σ_ts', formula: `In_Pd*${rDi}/(2*In_t)`, result: s1?.sigma_ts, unit: 'MPa', note: 'σ_ts = P·D/(2t)' })
    const rStd = ck.item({ label: '수격압 인장응력', sym: 'σ_td',
      formula: result.pressureZone === 'pumped' ? `(In_Ps-In_Pd)*${rDi}/(2*In_t)` : '0',
      result: s1?.sigma_td, unit: 'MPa', note: result.pressureZone === 'pumped' ? "σ_td = P′·D/(2t) — 정수압 이상 상승압력" : '자연유하 구간 — 미적용' })

    ck.sec('3.2 외압에 의한 휨응력 — 세부지침 11-137 (나)').head()
    const rRcm = ck.item({ label: '관 반경', sym: 'R', formula: 'In_Do/20', result: s3?.R_cm, unit: 'cm' })
    const rSbk = ck.item({ label: '휨응력', sym: 'σ_b', formula: `6*(In_Kf*${rWv}+In_Kt*${rWt})*${rRcm}^2/((In_t/10)^2)`,
      result: s3?.sigma_b_kgf, unit: 'kg/cm²', note: 'σ_b = 6(K_f·W_f + K_t·W_t)R² / t²' })
    const rSb = ck.item({ label: '휨응력', sym: 'σ_b', formula: `${rSbk}*${KGF_TO_MPA}`, result: s3?.sigma_b, unit: 'MPa' })

    ck.sec('3.3 조합응력 검토 — 세부지침 11-137').head()
    const rDem = ck.item({ label: '조합 인장응력', sym: '', formula: `2.5*${rSts}+2.0*${rStd}+1.4*${rSb}`,
      result: s4?.demand, unit: 'MPa', bold: true, note: '2.5σ_ts + 2.0σ_td + 1.4σ_b' })
    okRefs.push(ck.verdict({ formula: `IF(${rDem}<In_S,"O.K.","N.G.")`, result: s4?.ok ? 'O.K.' : 'N.G.', note: `< S = ${DI_COMBINED.S} MPa` }))
  }

  // ══ 4. 판정요약 시트 ═══════════════════════════════════
  sm.title('4. 구조안전성 검토 결과').blank(0.5).head()
  const verdictItems = Object.entries(result.verdict).filter(([k]) => k !== 'overallOK')
  verdictItems.forEach(([, item], i) => {
    sm.item({
      label: item.label,
      formula: okRefs[i] ? `${okRefs[i]}` : null,
      value: okRefs[i] ? undefined : (item.ok ? 'O.K.' : 'N.G.'),
      result: item.ok ? 'O.K.' : 'N.G.',
      unit: '',
      note: `계산값 ${typeof item.value === 'number' ? item.value.toFixed(3) : item.value} / 허용값 ${typeof item.allow === 'number' ? item.allow.toFixed(3) : item.allow ?? '—'} ${item.unit ?? ''}  (내보내기 시점)`,
    })
  })
  sm.blank(0.5)
  sm.item({
    label: '종합 판정', bold: true,
    formula: `IF(COUNTIF('단면검토'!$C:$C,"N.G.")=0,"O.K.","N.G.")`,
    result: result.verdict.overallOK ? 'O.K.' : 'N.G.',
    note: '단면검토 시트 판정 셀 중 N.G.가 하나도 없으면 O.K.',
  })

  // ── 안전성평가 등급 (11-133 표 11.74) ──
  sm.blank(0.5)
  sm.sec('안전성평가 등급 — 세부지침 11-133 [표 11.74]').head()
  sm.item({ label: '안전율', sym: 'SF', value: Number.isFinite(result.SF) ? +result.SF.toFixed(3) : '—',
    note: '허용응력 / 발생응력 — 검토항목 중 최솟값' })
  sm.item({ label: '주부재 손상(단면손실)', value: result.hasSectionLoss ? '있음' : '없음' })
  sm.item({ label: '평가기준', value: result.safetyGrade?.grade ?? '—', bold: true,
    note: result.safetyGrade?.desc ?? '' })
  sm.item({ label: '평가점수', value: result.safetyGrade?.score ?? '—' })

  const dn = result.pipeDimManual ? `D${Do}` : `DN${result.DN}`
  await downloadWorkbook(wb, `구조안전성검토_${dn}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
