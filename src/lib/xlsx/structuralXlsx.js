// ============================================================
// 구조안전성 검토 — 엑셀(.xlsx) 내보내기
// 시트: 표지 / 입력 / 하중산정 / 단면검토 / 판정요약 / 참고
// 모든 계산 셀은 살아있는 수식(입력 시트 정의 이름 참조)으로 기록되어
// 입력값 수정 시 엑셀에서 전체가 재계산된다.
// ============================================================
import { createWorkbook, downloadWorkbook, addCoverSheet, SW } from './xlsxCore.js'
import { DB24_PRESSURE, GW_RW, STEEL_BEDDING, BEDDING } from '../../engine/constants.js'

export async function exportStructuralXlsx({ inputs, result, projectName, facilityName }) {
  const wb = await createWorkbook()
  const isSteel = result.pipeType === 'steel'
  const rs = result.steps
  const s1 = rs.step1
  const s2 = rs.step2
  const sTraffic = isSteel ? rs.step3 : rs.step2
  const s4 = isSteel ? rs.step4 : rs.step3
  const s5 = isSteel ? rs.step5 : rs.step4
  const s6 = isSteel ? rs.step6 : null

  const fy = result.fy ?? 235
  const Do = result.Do
  const tAdopt = result.tAdopt
  const isWm = (sTraffic?.trafficMethod ?? 'boussinesq') === 'wm'
  const hasTraffic = !!inputs.hasTraffic

  addCoverSheet(wb, {
    title: '매설관로 구조안전성 검토서',
    subtitle: isSteel ? '도복장강관 (KS D 3565)' : '덕타일 주철관 (KS D 4311)',
    standard: 'KDS 57 10 00 : 2022 상수도 시설 설계기준 — 관로',
    projectName, facilityName,
  })

  // 시트 탭 순서대로 먼저 생성 (내용은 의존 순서대로 기록)
  const inS = new SW(wb, '입력')
  const ld = new SW(wb, '하중산정')
  const ck = new SW(wb, '단면검토')
  const sm = new SW(wb, '판정요약')
  const rf = new SW(wb, '참고')

  // ══ 참고 시트 (표 위치를 수식에서 참조하므로 먼저 기록) ══
  rf.title('참고 자료').blank(0.5)
  rf.sec('DB-24 등가 수직압력표 (KDS 24 12 20 / Boussinesq)')
  const db24rows = [['H (m)', 'P_L (kPa, 충격 전)', '충격계수 I_F']]
  const db24entries = Object.entries(DB24_PRESSURE).sort((a, b) => Number(a[0]) - Number(b[0]))
  db24entries.forEach(([h, v]) => db24rows.push([Number(h), v.PL, v.IF]))
  const db24Head = rf.table(db24rows)
  const dbFirst = db24Head + 1                      // 데이터 첫 행
  const dbLast = db24Head + db24entries.length      // 데이터 끝 행
  rf.blank(0.5)
  rf.sec('기초지지각별 계수표 (상수도시설기준 참고표-4.2.4, Spangler)')
  const bedRows = [['기초지지각', 'K_b (휨)', 'K_x/K_d (처짐)']]
  Object.values(STEEL_BEDDING).forEach(v => bedRows.push([v.label, v.Kb, v.Kx]))
  rf.table(bedRows)
  rf.blank(0.5)
  rf.sec('지하수위별 좌굴 저감계수 R_w (보수적 설정값)')
  const rwRows = [['지하수위', 'R_w']]
  Object.entries(GW_RW).forEach(([k, v]) => rwRows.push([k, v]))
  rf.table(rwRows)
  rf.note('※ AWWA M11 원식 R_w = 1 − 0.33(h_w/h) 대비 안전측(보수적) 설정값.')

  // ══ 1. 입력 시트 ═══════════════════════════════════════
  inS.title('1. 설계 입력값').blank(0.5)
  inS.sec('관로 제원').head()
  inS.item({ label: '관종', value: isSteel ? '도복장강관' : '덕타일 주철관', note: isSteel ? 'KS D 3565' : 'KS D 4311' })
  if (!result.pipeDimManual) inS.item({ label: '공칭관경', sym: 'DN', value: result.DN, unit: 'mm', note: isSteel ? `두께등급 ${result.pnGrade}` : `K등급 ${result.selectedGrade}` })
  inS.item({ label: '외경', sym: 'D₀', value: Do, unit: 'mm', name: 'In_Do', input: true })
  inS.item({ label: '채택 두께', sym: 't', value: tAdopt, unit: 'mm', name: 'In_t', input: true })
  if (isSteel) {
    inS.item({ label: '항복강도', sym: 'f_y', value: fy, unit: 'MPa', name: 'In_fy', input: true, note: `강종 ${result.steelGrade ?? 'SPS400'}` })
    inS.item({ label: '관체 탄성계수', sym: 'E_s', value: 206000, unit: 'MPa', name: 'In_E', input: true, note: '강관' })
  } else {
    inS.item({ label: '인장강도', sym: 'f_u', value: 420, unit: 'MPa', name: 'In_fu', input: true, note: 'GCD400 (KS D 4311)' })
    inS.item({ label: '관체 탄성계수', sym: 'E_di', value: 160000, unit: 'MPa', name: 'In_E', input: true, note: '덕타일 주철관 (1.6×10⁸ kN/m²)' })
  }

  inS.sec('하중·지반 조건').head()
  inS.item({ label: '설계 운전압력', sym: 'P_d', value: inputs.Pd, unit: 'MPa', name: 'In_Pd', input: true })
  if (isSteel) inS.item({ label: '수격압 배율', sym: '', value: inputs.surgeRatio, unit: '', name: 'In_sr', input: true, note: "P_d' = P_d × 배율" })
  inS.item({ label: '관정 매설깊이', sym: 'H', value: inputs.H, unit: 'm', name: 'In_H', input: true })
  inS.item({ label: '흙 단위중량', sym: 'γ_s', value: inputs.gammaSoil, unit: 'kN/m³', name: 'In_gs', input: true })
  inS.item({ label: '탄성지반반력', sym: "E'", value: inputs.Eprime, unit: 'kPa', name: 'In_Ep', input: true })
  inS.item({ label: '차량하중 적용', value: hasTraffic ? (isWm ? '적용 (Wm 직접계산)' : '적용 (DB-24 Boussinesq)') : '미적용', note: hasTraffic && !isWm ? 'KDS 24 12 20 / 참고 시트 DB-24 표 보간' : '' })
  if (isWm && hasTraffic) {
    inS.item({ label: '후륜 1륜당 하중', sym: 'P_m', value: sTraffic?.wmPm ?? 100, unit: 'kN', name: 'In_Pm', input: true })
    inS.item({ label: '차량 점유폭', sym: 'C', value: sTraffic?.wmC ?? 3.0, unit: 'm', name: 'In_C', input: true })
    inS.item({ label: '접지폭', sym: 'a', value: sTraffic?.wmA ?? 0.2, unit: 'm', name: 'In_a', input: true })
  }
  const bedKey = isSteel ? (inputs.steelBeddingType === 'deg180' ? 'deg150' : inputs.steelBeddingType) : inputs.beddingType
  const bedRow = isSteel ? (STEEL_BEDDING[bedKey] || STEEL_BEDDING.deg90) : (BEDDING[bedKey] || BEDDING.Type2)
  inS.item({ label: '침상 조건 (기초지지각)', value: bedRow.label, note: '상수도시설기준 참고표-4.2.4 (Spangler 계수) — 참고 시트' })
  inS.item({ label: '휨모멘트계수', sym: 'K_b', value: bedRow.Kb, name: 'In_Kb', input: true })
  inS.item({ label: '처짐계수', sym: isSteel ? 'K_x' : 'K_d', value: isSteel ? bedRow.Kx : bedRow.Kd, name: 'In_Kx', input: true })
  if (isSteel) {
    inS.item({ label: '처짐 지연계수', sym: 'D_L', value: 1.5, name: 'In_DL', input: true, note: 'Deflection Lag Factor (AWWA M11)' })
    inS.item({ label: '지하수위 좌굴 저감계수', sym: 'R_w', value: GW_RW[inputs.gwLevel] ?? 1.0, name: 'In_Rw', input: true, note: `지하수위: ${inputs.gwLevel} (참고 시트 표)` })
    inS.item({ label: '좌굴 안전율', sym: 'FS', value: 2.5, name: 'In_FS', input: true, note: 'AWWA M11' })
    inS.item({ label: '허용 처짐율', sym: '', value: s5?.maxDeflection ?? (inputs.hasLining ? 3 : 5), unit: '%', name: 'In_dmax', input: true, note: inputs.hasLining ? '모르타르 라이닝 적용 3%' : '라이닝 없음 5%' })
  } else {
    inS.item({ label: '허용 처짐율', sym: '', value: s5?.maxDeflection ?? 3, unit: '%', name: 'In_dmax', input: true, note: 'AWWA C150 / DIPRA' })
  }

  // ══ 2. 하중산정 시트 ═══════════════════════════════════
  ld.title('2. 설계 하중 산정').blank(0.5)
  ld.sec('토피하중 (Prism Load) — AWWA M11 Ch.5').head()
  const rWe = ld.item({ label: '토피하중', sym: 'W_e', formula: 'In_gs*In_H*In_Do/1000', result: s2?.We ?? 0, unit: 'kN/m', note: 'W_e = γ_s × H × D₀' })

  let rWL
  if (hasTraffic && !isWm) {
    ld.sec('차량하중 (DB-24 Boussinesq) — KDS 24 12 20').head()
    const colRange = (col) => `'참고'!$${col}$${dbFirst}:$${col}$${dbLast}`
    const clampH = `MEDIAN(In_H,'참고'!$A$${dbFirst},'참고'!$A$${dbLast})`
    const depths = db24entries.map(([h]) => Number(h))
    const clampedH = Math.min(Math.max(inputs.H, depths[0]), depths[depths.length - 1])
    let kVal = depths.filter(d => d <= clampedH).length
    kVal = Math.min(Math.max(kVal, 1), depths.length - 1)
    const rK = ld.item({
      label: '보간 구간 색인', sym: 'k',
      formula: `MIN(MATCH(${clampH},${colRange('A')}),${db24entries.length - 1})`,
      result: kVal, note: 'DB-24 표(참고 시트)에서 H가 속한 구간 (범위 밖은 경계값으로 절사)',
    })
    const seg = (col) => `INDEX(${colRange(col)},${rK}):INDEX(${colRange(col)},${rK}+1)`
    const rPLraw = ld.item({
      label: '등가 수직압 (충격 전)', sym: 'P_L,raw',
      formula: `FORECAST(${clampH},${seg('B')},${seg('A')})`,
      result: sTraffic?.PLraw ?? 0, unit: 'kPa', note: 'DB-24 표 선형보간',
    })
    const rIF = ld.item({
      label: '충격계수', sym: 'I_F',
      formula: `FORECAST(${clampH},${seg('C')},${seg('A')})`,
      result: sTraffic?.IF ?? 1, note: 'DB-24 표 선형보간',
    })
    const rPL = ld.item({ label: '설계 차량압력', sym: 'P_L', formula: `${rPLraw}*${rIF}`, result: sTraffic?.PL ?? 0, unit: 'kPa', note: 'P_L = P_L,raw × I_F' })
    rWL = ld.item({ label: '차량하중', sym: 'W_L', formula: `${rPL}*In_Do/1000`, result: sTraffic?.WL ?? 0, unit: 'kN/m', note: 'W_L = P_L × D₀' })
  } else if (hasTraffic && isWm) {
    ld.sec('차량하중 (Wm 직접계산) — 부록C 해설식(5.3.3)').head()
    const ri = ld.item({
      label: '충격계수', sym: 'i',
      formula: 'IF(In_H<1.5,0.5,IF(In_H<=6.5,0.65-0.1*In_H,0))',
      result: sTraffic?.IF ?? 0, note: '해설표 5.3.4',
    })
    rWL = ld.item({
      label: '차량하중', sym: 'W_m',
      formula: `2*In_Pm*In_Do/1000/(In_C*(In_a+2*In_H*TAN(RADIANS(45))))*(1+${ri})`,
      result: sTraffic?.WL ?? 0, unit: 'kN/m', note: 'W_m = 2·P_m·D₀ / (C·(a+2H·tan45°)) × (1+i)',
    })
  } else {
    ld.sec('차량하중').head()
    rWL = ld.item({ label: '차량하중', sym: 'W_L', value: 0, unit: 'kN/m', note: '미적용' })
  }

  ld.sec('합계').head()
  const rWt = ld.item({ label: '합계 하중', sym: 'W_total', formula: `${rWe}+${rWL}`, result: sTraffic?.Wtotal ?? s2?.We ?? 0, unit: 'kN/m', note: 'W_total = W_e + W_L', bold: true })
  const rPt = ld.item({ label: '단위 수직압력', sym: 'P_total', formula: `${rWt}/(In_Do/1000)`, result: sTraffic?.Ptotal ?? ((s2?.We ?? 0) / (Do / 1000)), unit: 'kPa', note: 'P_total = W_total / D₀[m]' })

  // ══ 3. 단면검토 시트 ═══════════════════════════════════
  ck.title('3. 단면 검토').blank(0.5)
  const okRefs = []

  if (isSteel) {
    ck.sec('3.1 내압 검토 (Barlow) — AWWA M11 Eq.3-1 / KS D 3565').head()
    const rSaN = ck.item({ label: '허용응력 (상시)', sym: 'σ_a,n', formula: '0.5*In_fy', result: s1?.sigmaA_normal, unit: 'MPa', note: '0.50 × f_y' })
    const rSaS = ck.item({ label: '허용응력 (수격)', sym: 'σ_a,s', formula: '0.75*In_fy', result: s1?.sigmaA_surge, unit: 'MPa', note: '0.75 × f_y' })
    const rPds = ck.item({ label: '수격 설계압력', sym: "P_d'", formula: 'In_Pd*In_sr', result: inputs.Pd * inputs.surgeRatio, unit: 'MPa' })
    const rSn = ck.item({ label: '후프응력 (상시)', sym: 'σ_h', formula: 'In_Pd*In_Do/(2*In_t)', result: s1?.sigma_normal, unit: 'MPa', note: 'σ = P·D₀ / (2t)' })
    okRefs.push(ck.verdict({ formula: `IF(${rSn}<=${rSaN},"O.K.","N.G.")`, result: s1?.ok_normal ? 'O.K.' : 'N.G.', note: 'σ_h ≤ σ_a,n' }))
    const rSs = ck.item({ label: '후프응력 (수격)', sym: 'σ_h,s', formula: `${rPds}*In_Do/(2*In_t)`, result: s1?.sigma_surge, unit: 'MPa' })
    okRefs.push(ck.verdict({ formula: `IF(${rSs}<=${rSaS},"O.K.","N.G.")`, result: s1?.ok_surge ? 'O.K.' : 'N.G.', note: 'σ_h,s ≤ σ_a,s' }))
  } else {
    ck.sec('3.1 내압 검토 (Di 기반 Barlow) — KS D 4311 §5').head()
    const rSa = ck.item({ label: '허용응력', sym: 'σ_a', formula: 'In_fu/3', result: s1?.sigmaA_hoop, unit: 'MPa', note: 'f_u / 3' })
    const rDi = ck.item({ label: '내경', sym: 'D_i', formula: 'In_Do-2*In_t', result: s1?.Di ?? Do - 2 * tAdopt, unit: 'mm' })
    const rSh = ck.item({ label: '후프응력', sym: 'σ_h', formula: `In_Pd*${rDi}/(2*In_t)`, result: s1?.sigma_hoop, unit: 'MPa', note: 'σ = P·D_i / (2t)' })
    okRefs.push(ck.verdict({ formula: `IF(${rSh}<=${rSa},"O.K.","N.G.")`, result: s1?.ok ? 'O.K.' : 'N.G.', note: 'σ_h ≤ f_u/3' }))
  }

  ck.sec(`3.2 링 휨응력 검토 — ${result?.appliedCodeLabel ?? 'AWWA M11 §5.3'}`).head()
  if (result?.appliedFormula) ck.note(`적용식: ${result.appliedFormula}`)
  if (result?.allowSource)    ck.note(`허용응력 근거: ${result.allowSource}`)
  const rSab = ck.item({ label: '허용응력', sym: 'σ_a,b', result: s4?.sigmaA_bend, unit: 'MPa', note: result?.allowRatioLabel ?? (isSteel ? '0.50 × f_y' : '0.50 × f_u') })
  const rSb = ck.item({ label: '링 휨응력', sym: 'σ_b', formula: `In_Kb*${rWt}*In_Do/In_t^2`, result: s4?.sigma_b, unit: 'MPa', note: 'σ_b = K_b · W_total · D₀ / t²  (kN/m·mm/mm² = MPa)' })
  okRefs.push(ck.verdict({ formula: `IF(${rSb}<=${rSab},"O.K.","N.G.")`, result: s4?.ok ? 'O.K.' : 'N.G.', note: 'σ_b ≤ σ_a,b' }))

  ck.sec('3.3 처짐 검토 (수정 Iowa) — AWWA M11 Eq.5-4 Eq.5-4').head()
  const rr = ck.item({ label: '관 반경', sym: 'r', formula: '(In_Do-In_t)/2000', result: s5?.r, unit: 'm', note: 'r = (D₀−t)/2' })
  const rI = ck.item({ label: '단면2차모멘트', sym: 'I', formula: '(In_t/1000)^3/12', result: s5?.I, unit: 'm⁴/m', note: 'I = t³/12' })
  const rEI = ck.item({ label: '휨강성', sym: 'EI', formula: `In_E*1000*${rI}`, result: s5?.EI, unit: 'kN·m²/m' })
  const rEIr3 = ck.item({ label: '', sym: 'EI/r³', formula: `${rEI}/${rr}^3`, result: s5?.EI_r3, unit: 'kN/m²' })
  const rDen = ck.item({ label: '분모', sym: '', formula: `${rEIr3}+0.061*In_Ep`, result: s5?.denominator, unit: 'kN/m²', note: "EI/r³ + 0.061E'" })
  const rDef = ck.item({
    label: '처짐율', sym: 'Δy/D',
    formula: isSteel ? `In_DL*In_Kx*${rPt}/${rDen}*100` : `In_Kx*${rPt}/${rDen}*100`,
    result: s5?.deflectionRatio, unit: '%',
    note: isSteel ? 'Δy/D = D_L·K_x·P_total / (EI/r³+0.061E′) × 100' : 'Δy/D = K_d·P_total / (EI/r³+0.061E′) × 100',
  })
  okRefs.push(ck.verdict({ formula: `IF(${rDef}<=In_dmax,"O.K.","N.G.")`, result: s5?.ok ? 'O.K.' : 'N.G.', note: 'Δy/D ≤ 허용 처짐율' }))

  if (isSteel && s6) {
    ck.sec('3.4 외압 좌굴 검토 — AWWA M11 / AWWA M11 Eq.5-5').head()
    const rHD = ck.item({ label: '', sym: 'H/D₀', formula: 'In_H/(In_Do/1000)', result: s6.HoverDo })
    const rBp = ck.item({ label: '탄성토지지계수', sym: "B'", formula: `1/(1+4*EXP(-0.065*${rHD}))`, result: s6.Bprime, note: "B' = 1/(1+4e^(−0.065H/D))" })
    const rEID3 = ck.item({ label: '', sym: 'EI/D₀³', formula: `${rEI}/(In_Do/1000)^3`, result: s6.EI_Do3, unit: 'kN/m²' })
    const rPcrT = ck.item({ label: '이론 좌굴압력', sym: 'P_cr,th', formula: `SQRT(32*In_Rw*${rBp}*In_Ep*${rEID3})`, result: s6.Pcr_theory, unit: 'kPa', note: "√(32·R_w·B'·E'·EI/D₀³)" })
    ck.item({ label: '허용 좌굴압력', sym: 'P_cr', formula: `${rPcrT}/In_FS`, result: s6.Pcr, unit: 'kPa', note: 'P_cr,th / FS' })
    const rFSa = ck.item({ label: '좌굴 안전율', sym: 'FS_actual', formula: `${rPcrT}/${rPt}`, result: s6.bucklingFS_actual, note: 'P_cr,th / P_total' })
    okRefs.push(ck.verdict({ formula: `IF(${rFSa}>=In_FS,"O.K.","N.G.")`, result: s6.ok ? 'O.K.' : 'N.G.', note: `FS_actual ≥ ${s6.FS_allow ?? 2.5} (동치: P_cr ≥ P_total)` }))
  }

  ck.sec('3.5 최소 소요두께 검토 (참고)').head()
  if (isSteel) {
    const rtn = ck.item({ label: '내압 최소두께 (상시)', sym: 't_p,n', formula: 'In_Pd*In_Do/(2*0.5*In_fy)', result: s1?.tp_normal, unit: 'mm' })
    const rts = ck.item({ label: '내압 최소두께 (수격)', sym: 't_p,s', formula: 'In_Pd*In_sr*In_Do/(2*0.75*In_fy)', result: s1?.tp_surge, unit: 'mm' })
    const rth = ck.item({ label: '취급 최소두께', sym: 't_h', formula: 'In_Do/288', result: s1?.tHandling, unit: 'mm', note: 'D₀/288 (AWWA M11)' })
    const rtreq = ck.item({ label: '소요 최소두께', sym: 't_req', formula: `MAX(${rtn},${rts},${rth})`, result: result.tRequired, unit: 'mm', bold: true, note: '부식여유는 별도 고려' })
    ck.verdict({ formula: `IF(In_t>=${rtreq},"O.K.","N.G.")`, result: tAdopt >= (result.tRequired ?? 0) ? 'O.K.' : 'N.G.', note: '채택두께 t ≥ t_req' })
  } else {
    const rtp = ck.item({ label: '내압 최소두께', sym: 't_p,hoop', formula: 'In_Pd*In_Do/(2*(In_fu/3+In_Pd))', result: s1?.tp_hoop, unit: 'mm' })
    const rtb = ck.item({ label: '외압(링휨) 최소두께', sym: 't_p,bend', formula: `SQRT(In_Kb*${rWt}*In_Do/(0.5*In_fu))`, result: s1?.tp_bend, unit: 'mm' })
    const rtreq = ck.item({ label: '소요 최소두께', sym: 't_req', formula: `MAX(${rtp},${rtb})`, result: result.tRequired, unit: 'mm', bold: true })
    ck.verdict({ formula: `IF(In_t>=${rtreq},"O.K.","N.G.")`, result: tAdopt >= (result.tRequired ?? 0) ? 'O.K.' : 'N.G.', note: '채택두께 t ≥ t_req' })
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

  const dn = result.pipeDimManual ? `D${Do}` : `DN${result.DN}`
  await downloadWorkbook(wb, `구조안전성검토_${dn}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
