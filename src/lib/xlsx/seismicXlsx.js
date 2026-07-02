// ============================================================
// 내진성능 평가 — 엑셀(.xlsx) 내보내기
// 상세평가(분절관/연속관): 표지 / 입력 / 지반·스펙트럼 / 관체검토 / 판정요약
// 예비평가: 표지 / 예비평가
// 계산 셀은 살아있는 수식으로 기록. 단, ξ1·ξ2(보정계수)는 해석해(연립방정식
// 풀이)로 산정되는 값이라 엑셀 수식으로 표현 불가 → 노란 상수 + 산정근거 주석.
// ============================================================
import { createWorkbook, downloadWorkbook, addCoverSheet, SW, BORDER, FILL_HEAD, FILL_INPUT } from './xlsxCore.js'
import { resolveHEffective, resolveLayersForTGVds } from '../../engine/seismicConstants.js'

// ── 지반층 표 (수식 포함) — 지반 시트에 직접 기록 ────────────
// 반환: { firstRow, lastRow, sumRow } (데이터 행 범위, 합계 행)
function writeLayerTable(sw, layers) {
  const ws = sw.ws
  const headers = ['층번', '토층명', 'Hᵢ (m)', 'Vsᵢ (m/s)', '보정 C', 'Vsᵢ,nl (m/s)', 'Hᵢ/Vsᵢ (s)', 'Hᵢ/Vsᵢ,nl (s)']
  const hr = ws.getRow(sw.r)
  headers.forEach((t, i) => {
    const c = hr.getCell(i + 1)
    c.value = t
    c.font = { size: 9, bold: true }
    c.fill = FILL_HEAD
    c.border = BORDER
    c.alignment = { horizontal: 'center', wrapText: true }
  })
  sw.r += 1
  const firstRow = sw.r
  layers.forEach((l, i) => {
    const R = sw.r
    const row = ws.getRow(R)
    const C_nl = l.Vs < 360 ? 0.8 : 1.0
    const cells = [
      i + 1, l.name ?? `층${i + 1}`,
      { v: l.H, input: true }, { v: l.Vs, input: true },
      { f: `IF(D${R}<360,0.8,1)`, r: C_nl },
      { f: `D${R}*E${R}`, r: C_nl * l.Vs },
      { f: `C${R}/D${R}`, r: l.H / l.Vs },
      { f: `C${R}/F${R}`, r: l.H / (C_nl * l.Vs) },
    ]
    cells.forEach((v, ci) => {
      const c = row.getCell(ci + 1)
      if (v && typeof v === 'object') {
        if (v.f) c.value = { formula: v.f, result: v.r }
        else { c.value = v.v; if (v.input) c.fill = FILL_INPUT }
      } else c.value = v
      c.border = BORDER
      c.font = { size: 9 }
      if (ci >= 2) c.alignment = { horizontal: 'right' }
    })
    sw.r += 1
  })
  const lastRow = sw.r - 1
  const R = sw.r
  const row = ws.getRow(R)
  const sums = [
    '합계', '',
    { f: `SUM(C${firstRow}:C${lastRow})`, r: layers.reduce((s, l) => s + l.H, 0) },
    '', '', '',
    { f: `SUM(G${firstRow}:G${lastRow})`, r: layers.reduce((s, l) => s + l.H / l.Vs, 0) },
    { f: `SUM(H${firstRow}:H${lastRow})`, r: layers.reduce((s, l) => s + l.H / ((l.Vs < 360 ? 0.8 : 1) * l.Vs), 0) },
  ]
  sums.forEach((v, ci) => {
    const c = row.getCell(ci + 1)
    if (v && typeof v === 'object') c.value = { formula: v.f, result: v.r }
    else c.value = v
    c.border = BORDER
    c.font = { size: 9, bold: true }
    c.fill = FILL_HEAD
    if (ci >= 2) c.alignment = { horizontal: 'right' }
  })
  sw.r += 1
  return { firstRow, lastRow, sumRow: R }
}

// ══════════════════════════════════════════════════════════
// 상세평가 (분절관 / 연속관)
// ══════════════════════════════════════════════════════════
export async function exportSeismicDetailXlsx({ inp, rs, projectName, facilityName }) {
  const wb = await createWorkbook()
  const isSeg = inp.pipeType === 'segmented'
  const D_mm = inp.D_out
  const E_MPa = rs.E_use ?? (isSeg ? 160000 : 210000)
  const nu = isSeg ? (inp.nu ?? 0.28) : 0.30  // 연속관은 엔진이 ν=0.30 고정 (evalContinuous 기본값)
  const zPipe = inp.hCover + D_mm / 1000 / 2
  const gamma = inp.gammaSoil ?? 18

  addCoverSheet(wb, {
    title: isSeg ? '매설관로 내진성능 본평가 검토서 (분절관)' : '매설관로 내진성능 본평가 검토서 (연속관)',
    subtitle: isSeg ? '응답변위법 — 덕타일 주철관 (KS D 4311)' : '응답변위법 — 상수도용 도복장강관 (KS D 3565)',
    standard: 'KDS 57 17 00 : 2022 / 기존시설물(상수도) 내진성능 평가요령 부록 C',
    projectName, facilityName,
  })

  const inS = new SW(wb, '입력')
  const gd = new SW(wb, '지반·스펙트럼')
  const pk = new SW(wb, '관체검토')
  const sm = new SW(wb, '판정요약')

  // ══ 입력 시트 ═══════════════════════════════════════════
  inS.title('1. 설계 입력값').blank(0.5)
  inS.sec('지진 조건').head()
  inS.item({ label: '지진구역계수', sym: 'Z', value: rs.Z, name: 'S_Z', input: true, note: `지진구역 ${inp.zone}` })
  inS.item({ label: '위험도계수 (붕괴방지)', sym: 'I', value: rs.I_collapse, name: 'S_I', input: true, note: `내진 ${inp.seismicGrade}등급 — 4800년 재현주기` })
  inS.item({ label: '감쇠비', sym: 'ξ', value: 20, unit: '%', name: 'S_xi', input: true, note: '붕괴방지수준 20% (기능수행 10%)' })

  inS.sec('관로 제원').head()
  inS.item({ label: '공칭관경', sym: 'DN', value: inp.DN, unit: 'mm' })
  inS.item({ label: '외경', sym: 'D', value: D_mm, unit: 'mm', name: 'S_D', input: true })
  inS.item({ label: '공칭 관두께', sym: 't₀', value: inp.thickness, unit: 'mm', name: 'S_t0', input: true })
  if (isSeg) {
    inS.item({ label: '두께 공차계수', sym: '', value: rs.tolFactor ?? 1.1, name: 'S_tol', input: true, note: '주철구조물 t = t₀/1.1 (부록C C.1.2)' })
    inS.item({ label: '관 1본 길이', sym: 'l', value: inp.Lj, unit: 'm', name: 'S_l', input: true })
  }
  inS.item({ label: '포아송비', sym: 'ν', value: nu, name: 'S_nu', input: true, note: isSeg ? '주철관 0.28 (부록C C.1.2)' : '강관 0.30' })
  inS.item({ label: '탄성계수', sym: 'E', value: E_MPa, unit: 'MPa', name: 'S_E', input: true, note: isSeg ? '주철관 1.6×10⁸ kN/m²' : '강관 2.1×10⁸ kN/m²' })

  inS.sec('지반·하중 조건').head()
  inS.item({ label: '토피 (관정)', sym: 'h', value: inp.hCover, unit: 'm', name: 'S_hc', input: true })
  inS.item({ label: '지표~관축 깊이', sym: 'z', value: zPipe, unit: 'm', name: 'S_dep', input: true, note: 'z = h + D/2' })
  inS.item({ label: '흙 단위중량', sym: 'γ', value: gamma, unit: 'kN/m³', name: 'S_gam', input: true })
  inS.item({ label: '기반암 전단파속도', sym: 'V_BS', value: inp.Vbs, unit: 'm/s', name: 'S_Vbs', input: true, note: '지침: 불명확 시 760 m/s 이상' })
  inS.item({ label: '설계 내압', sym: 'P', value: inp.P, unit: 'MPa', name: 'S_P', input: true })
  inS.item({ label: '후륜 1륜당 하중', sym: 'P_m', value: inp.Pm ?? 0, unit: 'kN', name: 'S_Pm', input: true })
  inS.item({ label: '차량 점유폭', sym: 'C', value: 3.0, unit: 'm', name: 'S_C', input: true })
  inS.item({ label: '접지폭', sym: 'a', value: 0.2, unit: 'm', name: 'S_a', input: true })
  inS.item({ label: '연직 지반반력계수', sym: 'K_v', value: rs.Kv_used ?? inp.Kv ?? 0, unit: 'kN/m³', name: 'S_Kv', input: true })
  inS.item({ label: '온도변화', sym: 'ΔT', value: inp.deltaT, unit: '℃', name: 'S_dT', input: true })
  if (!isSeg) inS.item({ label: '관-지반 마찰력', sym: 'τ', value: rs.tau ?? 10, unit: 'kN/m²', name: 'S_tau', input: true })

  inS.sec('허용 기준').head()
  if (isSeg) {
    inS.item({ label: '허용응력 (관체)', sym: 'σ_a', value: rs.sigma_allow, unit: 'MPa', name: 'S_sa', input: true, note: '부록C 표 C.1.3 — 덕타일 주철관 2종관 27.5 MPa (타 등급은 직접 수정)' })
    inS.item({ label: '허용신축량 (이음부)', sym: 'e_a', value: rs.e_allow, unit: 'm', name: 'S_ea', input: true, note: '제조사 이음 허용기준 확인 권장 (미입력 시 KS D 4311 삽입깊이 기반)' })
  } else {
    inS.item({ label: '항복강도', sym: 'σ_y', formula: 'IF(S_t0<=16,235,215)', result: rs.sigma_y, unit: 'MPa', name: 'S_sy', note: 'SS400/SPS400: t≤16mm→235, 초과→215' })
  }

  // ══ 지반·스펙트럼 시트 ═══════════════════════════════════
  gd.title('2. 지반 조건 및 설계응답스펙트럼').blank(0.5)
  gd.sec('표층 지반 (해설식 5.3.4~5.3.5)')
  const layersEff = resolveLayersForTGVds({
    layers: inp.layers,
    H_effective: resolveHEffective({ layers: inp.layers, heightMode: inp.heightMode ?? 'sum', H_bedrock: inp.H_bedrock ?? null }).H_effective,
    fillGap: inp.fillGapAsLastLayer !== false,
  })
  const lt = writeLayerTable(gd, layersEff)
  gd.note('※ 보정 C: 비선형 보정계수 (Vs<360 → 0.8, 이상 → 1.0, 해설표 5.3.1). H/Vs는 TG용(원 Vs), H/Vs,nl은 V_DS용.')
  gd.blank(0.5).head()
  const q = (col, row) => `'지반·스펙트럼'!$${col}$${row}`
  const rH = gd.item({ label: '표층지반 두께', sym: 'H', formula: `${q('C', lt.sumRow)}`, result: rs.H_effective, unit: 'm', name: 'S_H' })
  const rTG = gd.item({ label: '지반 특성주기', sym: 'T_G', formula: `4*${q('G', lt.sumRow)}`, result: rs.TG, unit: 's', note: 'T_G = 4ΣHᵢ/Vsᵢ (해설식 5.3.4)' })
  const rTs = gd.item({ label: '설계 고유주기', sym: 'T_s', formula: `1.25*${rTG}`, result: rs.Ts, unit: 's', note: 'T_s = 1.25 T_G (비선형 고려)' })
  const rVds = gd.item({ label: '표층 평균 전단파속도', sym: 'V_DS', formula: `${rH}/${q('H', lt.sumRow)}`, result: rs.Vds, unit: 'm/s', note: 'V_DS = H / Σ(Hᵢ/Vsᵢ,nl)' })

  gd.sec('설계응답스펙트럼 (KDS 17 10 00 암반 S1 + 감쇠보정)').head()
  const rS = gd.item({ label: '유효수평지반가속도', sym: 'S', formula: 'S_Z*S_I', result: rs.S, unit: 'g', note: 'S = Z × I (기반암 기준)' })
  const rCdF = gd.item({ label: '감쇠보정계수 (완전)', sym: 'C_D', formula: '(6.42/(1.42+S_xi))^0.48', result: rs.Cd_full ?? rs.eta, note: 'C_D = (6.42/(1.42+ξ))^0.48 — ξ=20%→0.5605' })
  const rCd = gd.item({ label: '감쇠보정계수 (적용)', sym: 'C_D(T)', formula: `IF(${rTs}<=0,1,IF(${rTs}>=0.06,${rCdF},1+(${rCdF}-1)*${rTs}/0.06))`, result: rs.eta, note: 'T=0에서 1.0, T_A(0.06s)까지 직선보간' })
  const rSaRaw = gd.item({
    label: '스펙트럼 가속도 (보정 전)', sym: 'S_a,raw',
    formula: `IF(${rTs}<=0.06,${rS}*(1+30*${rTs}),IF(${rTs}<=0.3,2.8*${rS},0.84*${rS}/${rTs}))`,
    result: rs.Sa != null && rs.eta ? rs.Sa / rs.eta : undefined, unit: 'g',
    note: 'T≤0.06: S(1+30T) / 0.06~0.3: 2.8S / T>0.3: 0.84S/T',
  })
  const rSv = gd.item({ label: '속도응답스펙트럼', sym: 'S_v', formula: `${rSaRaw}*9.81*${rTs}/(2*PI())*${rCd}`, result: rs.Sv, unit: 'm/s', note: 'S_v = S_a·g·T_s/(2π)·C_D', bold: true })

  gd.sec('지반변위·파장·지반강성 (해설식 5.3.5~5.3.11)').head()
  const rUh = gd.item({ label: '수평 지반변위', sym: 'U_h', formula: `(2/PI()^2)*${rSv}*${rTs}*COS(PI()*S_dep/(2*${rH}))`, result: rs.Uh, unit: 'm', note: 'U_h = (2/π²)·S_v·T_s·cos(πz/2H)', bold: true })
  const rL1 = gd.item({ label: '표층 파장', sym: 'L₁', formula: `${rVds}*${rTs}`, result: rs.Lwave1, unit: 'm', note: 'L₁ = V_DS × T_s' })
  const rL2 = gd.item({ label: '기반암 파장', sym: 'L₂', formula: `S_Vbs*${rTs}`, result: rs.Lwave2, unit: 'm', note: 'L₂ = V_BS × T_s' })
  const rL = gd.item({ label: '설계 파장', sym: 'L', formula: `2*${rL1}*${rL2}/(${rL1}+${rL2})`, result: rs.L, unit: 'm', note: 'L = 2L₁L₂/(L₁+L₂)', bold: true })
  const rLp = gd.item({ label: '', sym: "L'", formula: `SQRT(2)*${rL}`, result: rs.Lprime, unit: 'm', note: "L' = √2·L" })
  const rK1 = gd.item({ label: '지반강성 (축방향)', sym: 'K₁', formula: `1.5*S_gam*${rVds}^2/9.81`, result: rs.K1, unit: 'kN/m²', note: 'K₁ = 1.5(γ/g)V_DS²' })
  const rK2 = gd.item({ label: '지반강성 (축직교)', sym: 'K₂', formula: `3*S_gam*${rVds}^2/9.81`, result: rs.K2, unit: 'kN/m²', note: 'K₂ = 3.0(γ/g)V_DS²' })

  // ══ 관체검토 시트 ═══════════════════════════════════════
  pk.title(isSeg ? '3. 관체 응력 및 이음부 검토 (분절관)' : '3. 관체 축변형률 검토 (연속관)').blank(0.5)
  pk.sec('단면 성능').head()
  const rte = isSeg
    ? pk.item({ label: '유효 관두께', sym: 't', formula: 'S_t0/S_tol', result: rs.t_eff, unit: 'mm', note: 't = t₀/1.1 (부록C C.1.2)' })
    : pk.item({ label: '관두께', sym: 't', formula: 'S_t0', result: inp.thickness, unit: 'mm' })
  const rA = pk.item({ label: '단면적', sym: 'A', formula: `PI()/4*((S_D/1000)^2-(S_D/1000-2*${rte}/1000)^2)`, result: rs.A_m, unit: 'm²' })
  const rIm = pk.item({ label: '단면2차모멘트', sym: 'I', formula: `PI()/64*((S_D/1000)^4-(S_D/1000-2*${rte}/1000)^4)`, result: rs.I_m, unit: 'm⁴' })
  const rZm = pk.item({ label: '단면계수', sym: 'Z', formula: `${rIm}/(S_D/2000)`, result: rs.Z_m, unit: 'm³' })
  const rl1 = pk.item({ label: '지반-관 강성 (축)', sym: 'λ₁', formula: `SQRT(${rK1}/(S_E*1000*${rA}))`, result: rs.lambda1, unit: '1/m', note: 'λ₁ = √(K₁/EA)' })
  const rl2 = pk.item({ label: '지반-관 강성 (휨)', sym: 'λ₂', formula: `(${rK2}/(S_E*1000*${rIm}))^0.25`, result: rs.lambda2, unit: '1/m', note: 'λ₂ = ⁴√(K₂/EI)' })
  const ra1 = pk.item({ label: '전달계수 (축)', sym: 'α₁', formula: `1/(1+(2*PI()/(${rl1}*${rLp}))^2)`, result: rs.alpha1, note: "α₁ = 1/(1+(2π/λ₁L')²)" })
  const ra2 = pk.item({ label: '전달계수 (휨)', sym: 'α₂', formula: `1/(1+(2*PI()/(${rl2}*${rL}))^4)`, result: rs.alpha2, note: 'α₂ = 1/(1+(2π/λ₂L)⁴)' })

  // 차량하중 Wm (공통)
  pk.sec('차량하중 (해설식 5.3.3)').head()
  const rImp = pk.item({ label: '충격계수', sym: 'i', formula: 'IF(S_hc<1.5,0.5,IF(S_hc<=6.5,0.65-0.1*S_hc,0))', result: rs.impact_i ?? rs.i_traffic ?? 0, note: '해설표 5.3.4' })
  const rWm = pk.item({ label: '차량하중', sym: 'W_m', formula: `IF(S_Pm<=0,0,2*S_Pm*(S_D/1000)/(S_C*(S_a+2*S_hc*TAN(RADIANS(45))))*(1+${rImp}))`, result: rs.Wm ?? rs.Wm_traffic ?? 0, unit: 'kN/m', note: 'W_m = 2P_m·D/(C(a+2h·tan45°))·(1+i)' })

  const vd = []   // 판정요약용 [label, formulaRef, ok]

  if (isSeg) {
    // ── 분절관: 관체 응력 ──
    pk.sec('관체 응력 (해설식 5.3.1~5.3.21)').head()
    const rSi = pk.item({ label: '내압 축응력', sym: 'σ_i', formula: `S_nu*S_P*(S_D-${rte})/(2*${rte})`, result: rs.sigma_i, unit: 'MPa', note: 'σ_i = ν·P(D−t)/(2t) (해설식 5.3.1)' })
    const rSo = pk.item({ label: '차량 축응력', sym: 'σ_o', formula: `IF(OR(S_Pm<=0,S_Kv<=0),0,0.322*${rWm}*SQRT(S_E*1000*${rIm}/(S_Kv*S_D/1000))/${rZm}/1000)`, result: rs.sigma_o, unit: 'MPa', note: 'σ_o = 0.322·W_m/Z·√(EI/(K_v·D)) (해설식 5.3.2)' })
    const rSL = pk.item({ label: '지진 축응력 (연속관 기준)', sym: 'σ_L', formula: `${ra1}*PI()*${rUh}/${rL}*S_E`, result: rs.sigma_L, unit: 'MPa', note: 'σ_L = α₁·(πU_h/L)·E (해설식 5.3.15)' })
    const rSB = pk.item({ label: '지진 휨응력 (연속관 기준)', sym: 'σ_B', formula: `${ra2}*2*PI()^2*(S_D/1000)*${rUh}/${rL}^2*S_E`, result: rs.sigma_B, unit: 'MPa', note: 'σ_B = α₂·(2π²D·U_h/L²)·E (해설식 5.3.16)' })
    pk.item({ label: '그래프 파라미터', sym: "λ₁L'", formula: `${rl1}*${rLp}`, result: rs.lam1Lp, note: "ξ₁ 산정 파라미터" })
    pk.item({ label: '', sym: "ν'=l/L'", formula: `S_l/${rLp}`, result: rs.nu_prime, note: '해설식 5.3.23' })
    pk.item({ label: '', sym: 'λ₂L', formula: `${rl2}*${rL}`, result: rs.lam2L, note: 'ξ₂ 산정 파라미터' })
    pk.item({ label: '', sym: 'ν=l/L', formula: `S_l/${rL}`, result: rs.nu_val, note: '해설식 5.3.22' })
    const rXi1 = pk.item({ label: '보정계수 (축)', sym: 'ξ₁', value: rs.xi1, mark: true, note: `해석해 산정 상수 (탄성지반 위 자유단 봉 모델, 해설그림 C.1.4) — λ₁L'=${(rs.lam1Lp ?? 0).toFixed(3)}, ν'=${(rs.nu_prime ?? 0).toFixed(4)}. 엑셀 수식 표현 불가.` })
    const rXi2 = pk.item({ label: '보정계수 (휨)', sym: 'ξ₂', value: rs.xi2, mark: true, note: `해석해 산정 상수 (탄성지반 위 자유단 보 모델, 해설그림 C.1.5) — λ₂L=${(rs.lam2L ?? 0).toFixed(2)}, ν=${(rs.nu_val ?? 0).toFixed(4)}. 엑셀 수식 표현 불가.` })
    const rSLp = pk.item({ label: '분절관 지진 축응력', sym: "σ'_L", formula: `${rXi1}*${rSL}`, result: rs.sigma_L_prime, unit: 'MPa', note: "σ'_L = ξ₁·σ_L (해설식 5.3.13)" })
    const rSBp = pk.item({ label: '분절관 지진 휨응력', sym: "σ'_B", formula: `${rXi2}*${rSB}`, result: rs.sigma_B_prime, unit: 'MPa', note: "σ'_B = ξ₂·σ_B (해설식 5.3.14)" })
    const rSx = pk.item({ label: '지진시 합성응력', sym: 'σ_x', formula: `SQRT(${rSLp}^2+${rSBp}^2)`, result: rs.sigma_x, unit: 'MPa', note: "σ_x = √(σ'_L²+σ'_B²) (해설식 5.3.12)" })
    const rSt = pk.item({ label: '관체 응력 합계', sym: 'σ_total', formula: `${rSi}+${rSo}+${rSx}`, result: rs.sigma_total, unit: 'MPa', bold: true, note: 'σ_total = σ_i + σ_o + σ_x' })
    const vSt = pk.verdict({ formula: `IF(${rSt}<=S_sa,"O.K.","N.G.")`, result: rs.stressOK ? 'O.K.' : 'N.G.', note: 'σ_total ≤ σ_a (표 C.1.3)' })
    vd.push(['관체 축응력 σ_total', vSt, rs.stressOK])

    // ── 분절관: 이음부 신축량 ──
    pk.sec('이음부 신축량 (해설식 5.3.24~5.3.35)').head()
    const rei = pk.item({ label: '내압에 의한 신축', sym: 'e_i', formula: `${rSi}/S_E*S_l`, result: rs.e_i, unit: 'm', note: 'e_i = σ_i·l/E' })
    const reo = pk.item({ label: '차량에 의한 신축', sym: 'e_o', formula: `${rSo}/S_E*S_l`, result: rs.e_o, unit: 'm', note: 'e_o = σ_o·l/E' })
    const ret = pk.item({ label: '온도에 의한 신축', sym: 'e_t', formula: `0.00001*S_dT*S_l`, result: rs.e_t, unit: 'm', note: 'e_t = α·ΔT·l (α주철=1.0×10⁻⁵/℃, 표 C.1.4)' })
    const red = pk.item({ label: '부등침하에 의한 신축', sym: 'e_d', value: rs.e_d ?? 0, unit: 'm', note: 'e_d = √(l²+δ²)−l (침하 미고려 시 0)' })
    const rUa = pk.item({ label: '이음부 지반변위 진폭', sym: 'U_a', formula: `${rUh}/SQRT(2)`, result: rs.Ua, unit: 'm', note: 'U_a = U_h/√2' })
    const rb1 = pk.item({ label: '', sym: 'β₁', formula: `SQRT(${rK1}/(S_E*1000*${rA}))*S_l`, result: rs.beta1, note: 'β₁ = √(K₁/EA)·l' })
    const rg1 = pk.item({ label: '', sym: 'γ₁', formula: `2*PI()*S_l/${rLp}`, result: rs.gamma1, note: "γ₁ = 2πl/L'" })
    const rja1 = pk.item({ label: '', sym: 'a₁', formula: `1/(1+(${rg1}/${rb1})^2)`, result: rs.a1_joint, note: 'a₁ = 1/(1+(γ₁/β₁)²)' })
    const ru0 = pk.item({ label: '', sym: 'u₀', formula: `${rja1}*${rUa}`, result: rs.u0, unit: 'm', note: 'u₀ = a₁·U_a' })
    const rujb = pk.item({ label: '무차원 신축량', sym: 'ū_J', formula: `2*${rg1}*ABS(COSH(${rb1})-COS(${rg1}))/(${rb1}*SINH(${rb1}))`, result: rs.uJ_bar, note: 'ū_J = 2γ₁|cosh β₁ − cos γ₁|/(β₁ sinh β₁)' })
    const ruj = pk.item({ label: '지진시 이음부 신축량', sym: '|u_J|', formula: `ABS(${ru0}*${rujb})`, result: rs.uJ, unit: 'm', bold: true, note: '|u_J| = u₀ × ū_J' })
    const rEt = pk.item({ label: '이음부 신축량 합계', sym: 'e_total', formula: `${rei}+${reo}+${ret}+${red}+${ruj}`, result: rs.e_total, unit: 'm', bold: true })
    const vEt = pk.verdict({ formula: `IF(${rEt}<=S_ea,"O.K.","N.G.")`, result: rs.dispOK ? 'O.K.' : 'N.G.', note: 'e_total ≤ 허용신축량' })
    vd.push(['이음부 신축량 e_total', vEt, rs.dispOK])

    pk.sec('이음부 굽힘각 (참고 — 2025 설계기준해설 §4.3.3)').head()
    const rth = pk.item({ label: '이음부 굽힘각', sym: 'θ_J', formula: `DEGREES(4*PI()^2*S_l*${rUh}/${rL}^2)`, result: rs.theta_J * 180 / Math.PI, unit: '°', note: 'θ_J = 4π²·l·U_h/L² (참고 검토 — 판정 제외)' })
    pk.item({ label: '허용 굽힘각 (제조사)', sym: 'θ_a', value: rs.theta_allow * 180 / Math.PI, unit: '°', note: 'KCIP Tyton 접합 카탈로그 기준 (지침 미규정)' })
  } else {
    // ── 연속관: 축변형률 ──
    pk.sec('상시 축변형률 (해설식 5.3.36~5.3.42)').head()
    const rei = pk.item({ label: '내압 변형률', sym: 'ε_i', formula: `-S_nu*S_P*(S_D-S_t0)/(2*S_t0)/S_E`, result: rs.epsilon_i, note: 'ε_i = −ν·P(D−t)/(2tE) (해설식 5.3.36)' })
    const reo = pk.item({ label: '차량 변형률', sym: 'ε_o', formula: `IF(OR(S_Pm<=0,S_Kv<=0),0,0.322*${rWm}*SQRT(S_E*1000*${rIm}/(S_Kv*S_D/1000))/${rZm}/(S_E*1000))`, result: rs.epsilon_o, note: 'ε_o = σ_o/E (해설식 5.3.37)' })
    const ret = pk.item({ label: '온도 변형률', sym: 'ε_t', formula: `0.000012*S_dT`, result: rs.epsilon_t, note: 'ε_t = α·ΔT (α강관=1.2×10⁻⁵/℃)' })
    // 부등침하
    const hasSettle = (inp.L_settle ?? 0) > 0
    let red
    if (hasSettle) {
      const rLs = pk.item({ label: '연약지반 구간', sym: 'L_d', value: inp.L_settle, unit: 'm', input: true })
      const rh2 = pk.item({ label: '성토고', sym: 'h″', value: inp.h2_settle ?? 0, unit: 'm', input: true })
      const rWd = pk.item({ label: '연직토하중', sym: 'W_d', formula: `S_gam*(S_hc+${rh2})*(S_D/1000)`, result: rs.settle_Wd, unit: 'kN/m', note: 'W_d = γ(h+h″)D' })
      const rbe = pk.item({ label: '특성값', sym: 'β', formula: `(${rK2}/(4*S_E*1000*${rIm}))^0.25`, result: rs.settle_beta, unit: '1/m', note: 'β = ⁴√(K₂/4EI)' })
      const rM1 = pk.item({ label: '', sym: 'M₁', formula: `${rWd}/(2*${rbe}^2)*EXP(-${rbe}*${rLs}/2)*SIN(${rbe}*${rLs}/2)`, result: rs.settle_M1, unit: 'kN·m' })
      const rM2 = pk.item({ label: '', sym: 'M₂', formula: `0.3877*${rWd}/${rbe}^2*(0.2079+EXP(-${rbe}*${rLs})*(SIN(${rbe}*${rLs})-COS(${rbe}*${rLs})))`, result: rs.settle_M2, unit: 'kN·m' })
      const rM = pk.item({ label: '설계 휨모멘트', sym: 'M', formula: `MAX(${rM1},${rM2})`, result: rs.settle_M, unit: 'kN·m' })
      red = pk.item({ label: '부등침하 변형률', sym: 'ε_d', formula: `${rM}*(S_D/1000)/(2*S_E*1000*${rIm})`, result: rs.epsilon_d, note: 'ε_d = M·D/(2EI) (해설식 5.3.42)' })
    } else {
      red = pk.item({ label: '부등침하 변형률', sym: 'ε_d', value: 0, note: '부등침하 미고려' })
    }

    pk.sec('지진시 축변형률 (해설식 5.3.43~5.3.53)').head()
    const rEa = pk.item({ label: '허용변형률', sym: 'ε_a', formula: `46*S_t0/S_D/100`, result: rs.epsilon_allow, note: 'ε_a = 46t/D [%] → 무차원 환산 ÷100 (부록C 표 C.2.3)' })
    const rG = pk.item({ label: '지반 변형률', sym: 'ε_G', formula: `PI()*${rUh}/${rL}`, result: rs.epsilon_G, note: 'ε_G = π·U_h/L (해설식 5.3.46)' })
    const rXf = pk.item({ label: '마찰 파라미터', sym: 'ξ', formula: `2*SQRT(2)*S_E*1000*(S_t0/1000)/S_tau`, result: rs.xi, unit: 'm', note: 'ξ = 2√2·E·t/τ (해설식 5.3.52)' })
    const rLy = pk.item({ label: '한계 파장', sym: 'L₁', formula: `${rXf}*${rEa}`, result: rs.Ly, unit: 'm', note: 'L₁ = ξ·ε_a (해설식 5.3.53)' })
    const rEL = pk.item({ label: '축방향 변형률', sym: 'ε_L', formula: `IF(${rL}>${rLy},${ra1}*${rG},${rL}/${rXf})`, result: rs.epsilon_L, note: 'L>L₁: α₁·ε_G (일반) / L≤L₁: L/ξ (마찰지배)' })
    const rEB = pk.item({ label: '휨 변형률', sym: 'ε_B', formula: `${ra2}*2*PI()*(S_D/1000)/${rL}*${rG}`, result: rs.epsilon_B, note: 'ε_B = α₂·(2πD/L)·ε_G (해설식 5.3.44)' })
    const rEx = pk.item({ label: '지진시 합성 변형률', sym: 'ε_x', formula: `SQRT(${rEL}^2+${rEB}^2)`, result: rs.epsilon_x, note: 'ε_x = √(ε_L²+ε_B²) (해설식 5.3.45)', bold: true })

    pk.sec('합산 및 판정').head()
    const rEt = pk.item({ label: '축변형률 합계', sym: 'ε_total', formula: `ABS(${rei})+ABS(${reo})+ABS(${ret})+ABS(${red})+ABS(${rEx})`, result: rs.epsilon_total, bold: true, note: '절댓값 합산 (보수적)' })
    pk.item({ label: '축변형률 합계 (%)', sym: '', formula: `${rEt}*100`, result: rs.epsilon_total * 100, unit: '%' })
    const vEt = pk.verdict({ formula: `IF(${rEt}<=${rEa},"O.K.","N.G.")`, result: rs.strainOK ? 'O.K.' : 'N.G.', note: 'ε_total ≤ ε_a = 46t/D' })
    vd.push(['축변형률 합계 ε_total', vEt, rs.strainOK])
  }

  // ══ 판정요약 시트 ═══════════════════════════════════════
  sm.title('4. 종합 내진안전성 판정').blank(0.5).head()
  vd.forEach(([label, ref, ok]) => {
    sm.item({ label, formula: ref, result: ok ? 'O.K.' : 'N.G.', note: '관체검토 시트 판정 셀 참조' })
  })
  sm.blank(0.5)
  sm.item({
    label: '종합 판정', bold: true,
    formula: vd.map(([, ref]) => `${ref}="O.K."`).length > 1
      ? `IF(AND(${vd.map(([, ref]) => `${ref}="O.K."`).join(',')}),"O.K.","N.G.")`
      : `IF(${vd[0][1]}="O.K.","O.K.","N.G.")`,
    result: rs.ok ? 'O.K.' : 'N.G.',
  })
  sm.note('※ 적용기준: 기존시설물(상수도) 내진성능 평가요령 부록 C — 응답변위법 본평가 (붕괴방지수준, ξ=20%)')
  sm.note('※ 노란 셀(ξ₁·ξ₂)은 해석해(연립방정식) 산정 상수로 입력 변경 시 자동 갱신되지 않습니다. λL·ν 파라미터가 크게 바뀌면 앱에서 재계산 후 다시 내보내십시오.')

  await downloadWorkbook(wb, `내진성능본평가_${isSeg ? '분절관' : '연속관'}_DN${inp.DN}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

// ══════════════════════════════════════════════════════════
// 예비평가 (취약도지수 VI)
// ══════════════════════════════════════════════════════════
export async function exportSeismicPrelimXlsx({ inp, r, indexLabels, projectName, facilityName }) {
  const wb = await createWorkbook()
  addCoverSheet(wb, {
    title: '매설관로 내진성능 예비평가 검토서',
    subtitle: '내진성능 우선순위 평가 (취약도지수 VI 산정)',
    standard: '기존시설물(상수도) 내진성능 평가요령 부록 A',
    projectName, facilityName,
  })
  const sw = new SW(wb, '예비평가')
  sw.title('내진성능 예비평가 (취약도지수 VI)').blank(0.5)
  sw.sec('입력').head()
  const rDN = sw.item({ label: '공칭관경', sym: 'DN', value: inp.DN, unit: 'mm', input: true, name: 'P_DN' })
  const rt = sw.item({ label: '관두께', sym: 't', value: inp.thickness, unit: 'mm', input: true, name: 'P_t' })
  sw.item({ label: '지진구역 / 권역 / 지반', value: `구역 ${inp.zone} / ${inp.isUrban ? '도시권역' : '기타지역'} / ${inp.soilType}` })

  sw.sec('지수 산정 (해설표 3.4.2)').head()
  const rRatio = sw.item({ label: '관경두께비', sym: 'D/t', formula: 'P_DN/P_t', result: r.ratio })
  const rFLEX = sw.item({ label: '유연도지수', sym: 'FLEX', formula: `IF(${rRatio}<5,10,IF(${rRatio}<20,8,6))`, result: r.FLEX, note: 'D/t<5→10, <20→8, 이상→6' })
  const idx = [
    ['KIND — 관종 지수', r.KIND, indexLabels?.KIND],
    ['EARTH — 지반상태 지수', r.EARTH, indexLabels?.EARTH],
    ['SIZE — 관경 지수', r.SIZE, indexLabels?.SIZE],
    ['CONNECT — 이음부 상태', r.CONNECT, indexLabels?.CONNECT],
    ['FACIL — 주요시설물', r.FACIL, indexLabels?.FACIL],
    ['MCONE — 이음처리방법', r.MCONE, indexLabels?.MCONE],
  ]
  const idxRefs = idx.map(([label, val, note]) => sw.item({ label, value: val, input: true, note: note ?? '평가요령 부록 A 지수표' }))
  sw.blank(0.5).head()
  const rSub = sw.item({ label: '세부지수 합계', sym: 'Σ', formula: idxRefs.join('+'), result: r.VI_sub, bold: true })
  const rVI = sw.item({ label: '취약도지수', sym: 'VI', formula: `${rFLEX}*${rSub}`, result: r.VI, bold: true, note: 'VI = FLEX × Σ(세부지수)' })

  sw.sec('판정 (해설그림 3.4.1)').head()
  sw.item({ label: '지진도 그룹', value: `${r.seismicityGroup}그룹 (${r.seismicityGroup === 1 ? '중점고려지역' : '관찰대상지역'})`, note: '해설표 3.4.1 — 지진구역·권역·지반종류로 결정' })
  sw.verdict({
    label: '최종 판정',
    formula: r.seismicityGroup === 1
      ? `IF(${rVI}>=40,"중요상수도 — 상세평가 필요","유보상수도 — 관찰 대상")`
      : `"유보상수도 — 관찰 대상 (2그룹)"`,
    result: r.isCritical ? '중요상수도 — 상세평가 필요' : '유보상수도 — 관찰 대상',
    note: '1그룹이면서 VI ≥ 40 → 내진성능 중요상수도',
  })

  await downloadWorkbook(wb, `내진예비평가_DN${inp.DN}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
