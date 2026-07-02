// ============================================================
// 엑셀(.xlsx) 내보내기 공통 코어 — exceljs 동적 로딩 + 시트 작성 도우미
// 수식 셀은 { formula, result } 형태로 기록되어 열었을 때 값이 바로 보이고,
// 재계산 시 셀 참조(입력 시트 정의 이름)를 따라 갱신된다.
// ============================================================

const THIN = { style: 'thin', color: { argb: 'FF9A9A9A' } }
export const BORDER = { top: THIN, left: THIN, bottom: THIN, right: THIN }

export const FILL_HEAD  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F0EC' } }
export const FILL_SEC   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E4DC' } }
export const FILL_MARK  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2B8' } }  // 프로그램 산정 상수(수식 아님)
export const FILL_OK    = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF6EE' } }
export const FILL_INPUT = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF5FB' } }  // 입력값 셀

export async function createWorkbook() {
  const mod = await import('exceljs')
  const ExcelJS = mod.default ?? mod
  const wb = new ExcelJS.Workbook()
  wb.created = new Date()
  return wb
}

export async function downloadWorkbook(wb, filename) {
  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── 시트 작성기: [A 항목 | B 기호 | C 값 | D 단위 | E 근거·비고] 5열 ──
export class SW {
  constructor(wb, name) {
    this.wb = wb
    this.ws = wb.addWorksheet(name, { views: [{ showGridLines: false }] })
    this.ws.columns = [
      { width: 34 }, { width: 14 }, { width: 18 }, { width: 10 }, { width: 58 },
    ]
    this.r = 1
  }

  get name() { return this.ws.name }

  // 값 셀(C열) 절대참조 문자열
  refAt(row) { return `'${this.ws.name}'!$C$${row}` }

  title(text) {
    const row = this.ws.getRow(this.r)
    this.ws.mergeCells(this.r, 1, this.r, 5)
    row.getCell(1).value = text
    row.getCell(1).font = { size: 14, bold: true }
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
    row.height = 26
    this.r += 1
    return this
  }

  sec(text) {
    this.blank(0.5)
    const row = this.ws.getRow(this.r)
    this.ws.mergeCells(this.r, 1, this.r, 5)
    const c = row.getCell(1)
    c.value = text
    c.font = { size: 11, bold: true }
    c.fill = FILL_SEC
    c.border = BORDER
    row.height = 18
    this.r += 1
    return this
  }

  head() {
    const labels = ['항목', '기호', '값', '단위', '산정근거 / 수식']
    const row = this.ws.getRow(this.r)
    labels.forEach((t, i) => {
      const c = row.getCell(i + 1)
      c.value = t
      c.font = { size: 10, bold: true }
      c.fill = FILL_HEAD
      c.border = BORDER
      c.alignment = { horizontal: 'center' }
    })
    this.r += 1
    return this
  }

  // 항목 행. value(상수) 또는 formula+result(수식) 중 하나를 지정.
  // name: 워크북 정의 이름 부여(수식에서 참조), mark: 노란 표시(프로그램 산정 상수)
  // input: 입력값 셀 표시(파란 배경)
  item({ label, sym = '', value, formula, result, unit = '', note = '', name, mark, input, bold, numFmt }) {
    const row = this.ws.getRow(this.r)
    const cells = [label, sym, null, unit, note]
    cells.forEach((v, i) => {
      const c = row.getCell(i + 1)
      if (i !== 2) c.value = v
      c.border = BORDER
      c.font = { size: 10, bold: !!bold && i === 0 }
      if (i === 1) c.alignment = { horizontal: 'center' }
      if (i === 4) { c.font = { size: 9, color: { argb: 'FF555555' } }; c.alignment = { wrapText: true } }
    })
    const vc = row.getCell(3)
    if (formula != null) vc.value = { formula, result: result ?? undefined }
    else vc.value = value ?? null
    vc.font = { size: 10, bold: true }
    vc.alignment = { horizontal: 'right' }
    if (numFmt) vc.numFmt = numFmt
    if (mark) vc.fill = FILL_MARK
    else if (input) vc.fill = FILL_INPUT
    if (name) this.wb.definedNames.add(this.refAt(this.r), name)
    const ref = this.refAt(this.r)
    this.r += 1
    return ref
  }

  // 판정 행 — formula는 IF(...,"O.K.","N.G.") 형태
  verdict({ label = '판정', formula, result, note = '' }) {
    const row = this.ws.getRow(this.r)
    ;[label, '', null, '', note].forEach((v, i) => {
      const c = row.getCell(i + 1)
      if (i !== 2) c.value = v
      c.border = BORDER
      c.font = { size: 10, bold: i === 0 }
      c.fill = FILL_OK
      if (i === 4) c.font = { size: 9, color: { argb: 'FF555555' } }
    })
    const vc = row.getCell(3)
    vc.value = { formula, result }
    vc.font = { size: 10, bold: true, color: { argb: result === 'O.K.' ? 'FF1A6B3A' : 'FFC0392B' } }
    vc.alignment = { horizontal: 'center' }
    const ref = this.refAt(this.r)
    this.r += 1
    return ref
  }

  note(text) {
    const row = this.ws.getRow(this.r)
    this.ws.mergeCells(this.r, 1, this.r, 5)
    const c = row.getCell(1)
    c.value = text
    c.font = { size: 9, italic: true, color: { argb: 'FF777777' } }
    c.alignment = { wrapText: true }
    this.r += 1
    return this
  }

  blank(h) {
    this.ws.getRow(this.r).height = h === 0.5 ? 6 : 14
    this.r += 1
    return this
  }

  // 임의 표(참고표 등): rows = 2차원 배열, 첫 행 헤더
  table(rows, { startCol = 1, widths } = {}) {
    const startRow = this.r
    rows.forEach((cols, ri) => {
      const row = this.ws.getRow(this.r)
      cols.forEach((v, ci) => {
        const c = row.getCell(startCol + ci)
        c.value = v
        c.border = BORDER
        c.font = { size: 10, bold: ri === 0 }
        if (ri === 0) { c.fill = FILL_HEAD; c.alignment = { horizontal: 'center' } }
      })
      this.r += 1
    })
    if (widths) widths.forEach((w, i) => { this.ws.getColumn(startCol + i).width = w })
    return startRow  // 데이터 시작(헤더) 행 번호 반환
  }
}

// ── 표지 시트 ──────────────────────────────────────────────
export function addCoverSheet(wb, { title, subtitle, standard, projectName, facilityName }) {
  const ws = wb.addWorksheet('표지', { views: [{ showGridLines: false }] })
  ws.columns = [{ width: 14 }, { width: 34 }, { width: 12 }, { width: 24 }]
  ws.getRow(3).height = 30
  ws.mergeCells(3, 1, 3, 4)
  const t = ws.getCell(3, 1)
  t.value = title
  t.font = { size: 18, bold: true }
  t.alignment = { horizontal: 'center', vertical: 'middle' }
  if (subtitle) {
    ws.mergeCells(4, 1, 4, 4)
    const s = ws.getCell(4, 1)
    s.value = subtitle
    s.font = { size: 11, color: { argb: 'FF555555' } }
    s.alignment = { horizontal: 'center' }
  }
  const info = [
    ['사업명', projectName || '—'],
    ['시설물명', facilityName || '—'],
    ['적용기준', standard],
    ['작성일', new Date().toLocaleDateString('ko-KR')],
  ]
  info.forEach(([k, v], i) => {
    const row = ws.getRow(7 + i)
    const kc = row.getCell(1)
    kc.value = k
    kc.font = { size: 10, bold: true }
    kc.fill = FILL_HEAD
    kc.border = BORDER
    kc.alignment = { horizontal: 'center' }
    ws.mergeCells(7 + i, 2, 7 + i, 4)
    const vc = row.getCell(2)
    vc.value = v
    vc.font = { size: 10 }
    vc.border = BORDER
  })
  ws.mergeCells(13, 1, 13, 4)
  const legend = ws.getCell(13, 1)
  legend.value = '■ 파란 셀: 입력값 (수정 시 전체 재계산)   ■ 노란 셀: 프로그램 산정 상수(그래프 보정계수 등 해석해 산정값 — 수식 아님)'
  legend.font = { size: 9, color: { argb: 'FF666666' } }
  return ws
}
