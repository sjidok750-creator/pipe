// ============================================================
// HWPX(.hwpx, 아래한글 개방형 포맷 OWPML) 브라우저 생성기
// 정적 부품(header/content.hpf/…)은 검증된 골든 템플릿(template.ts)에서 가져오고,
// 본문 section0.xml만 런타임에 생성한다. 수식은 native 한글 수식 객체(<hp:equation>)로
// 삽입되어 한글 수식편집기에서 편집 가능하다.
// ============================================================
import JSZip from 'jszip'
import { HWPX_TEMPLATE, SEC_OPEN, SECPR_BLOCK } from './template'

// ── 스타일 ID (골든 템플릿 header.xml에 고정) ──
// ※ 한글은 IDRef를 배열 인덱스로 해석하므로 신설 ID는 연속 번호(간극 금지)
// ※ 표 안 굵게는 반드시 본문 크기(11)를 사용 — 7/8은 제목용 대형 글꼴
const CHAR = { normal: 0, bold: 11, small: 2, smallBold: 9, tiny: 13, title: 10, section: 12 }
const PARA = { left: 22, center: 20, right: 21, justify: 0 }
const BF = { cell: 3, headerShade: 5, none: 6, shadeBox: 7 }

// ── 표 테두리 규약 (안 0.12mm / 바깥 0.4mm) ──
// 참고 보고서(설계·진단보고서 표준 양식)와 동일한 12종 체계.
// band: head(머리행·음영) / body(본문행) / foot(끝행) / single(1행짜리 표)
// pos : first(첫 열) / mid(중간 열) / last(끝 열)
const BF_GRID = {
  head:   { first: 8,  mid: 9,  last: 10 },
  body:   { first: 11, mid: 12, last: 13 },
  foot:   { first: 14, mid: 15, last: 16 },
  single: { first: 17, mid: 18, last: 19 },
}

/** 셀 위치 → borderFill id (병합 후 위치로 판정) */
function gridBf(ri, ci, nRow, nCol, hasHeader) {
  const pos = ci === 0 ? 'first' : (ci === nCol - 1 ? 'last' : 'mid')
  let band
  if (nRow === 1) band = 'single'
  else if (hasHeader && ri === 0) band = 'head'
  else if (ri === nRow - 1) band = 'foot'
  else band = 'body'
  return BF_GRID[band][pos]
}

const PAGE_USABLE_W = 42520   // HWPUNIT (pagePr width 59528 − 좌우 여백 8504×2)
const ROW_H = 1600            // 셀 최소 높이 (내용에 따라 한글이 자동 확장)

let _idc = 1000000000
const nextId = () => String(_idc++)

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ── 런 ──
// run: { text, char?: keyof CHAR, bold?, small?, tiny?, eq? }
function charIdOf(run) {
  if (run.char && CHAR[run.char] != null) return CHAR[run.char]
  if (run.tiny) return CHAR.tiny
  if (run.small) return run.bold ? CHAR.smallBold : CHAR.small
  return run.bold ? CHAR.bold : CHAR.normal
}
function runXml(run) {
  const inner = run.eq ? equationXml(run.eq) : `<hp:t>${esc(run.text)}</hp:t>`
  return `<hp:run charPrIDRef="${charIdOf(run)}">${inner}</hp:run>`
}

// ── 수식 (한글 수식 스크립트) ──
function eqSize(script) {
  const depth = (script.match(/ over /g) || []).length
  const h = Math.min(1100 + 900 * depth + (script.includes('sqrt') ? 450 : 0), 4600)
  // 폭은 과소 지정 시 후행 텍스트와 겹치므로 넉넉히 (중괄호·공백 제외 실질 길이 기준)
  const core = script.replace(/[{}]/g, '').replace(/\s+/g, ' ')
  const w = Math.min(Math.max(core.length * 130, 3200), 14000)
  return { w, h }
}
function equationXml(script) {
  const { w, h } = eqSize(script)
  return `<hp:equation id="${nextId()}" textColor="#000000" baseLine="85" version="Equation Version 60" baseUnit="1000" lineMode="CHAR" font="HYhwpEQ">`
    + `<hp:sz width="${w}" widthRelTo="ABSOLUTE" height="${h}" heightRelTo="ABSOLUTE" protect="0"/>`
    + `<hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="PARA" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/>`
    + `<hp:script>${esc(script)}</hp:script>`
    + `</hp:equation>`
}

// ── 문단 ──
function paraXml(runs, { align = 'left', pageBreak = false } = {}) {
  const paraId = PARA[align] ?? PARA.left
  const rs = (runs.length ? runs : [{ text: '' }]).map(runXml).join('')
  const pb = pageBreak ? 1 : 0
  return `<hp:p id="${nextId()}" paraPrIDRef="${paraId}" styleIDRef="0" pageBreak="${pb}" columnBreak="0" merged="0">${rs}</hp:p>`
}

// ── 표 셀 ──
// cell: string | { text, runs?, bold, small, tiny, align, eq, shade, bf }
function cellXml(cell, colAddr, rowAddr, cellW, tableBf, gridBfId) {
  const c = typeof cell === 'object' && cell !== null ? cell : { text: cell }
  const align = c.align || 'left'
  // 우선순위: 셀 지정(bf) > 위치 기반 규약(gridBfId) > 표 기본값
  const bfId = c.bf != null ? c.bf : (gridBfId != null ? gridBfId : (c.shade ? BF.headerShade : tableBf))
  const runs = c.runs ? c.runs : (c.eq ? [{ eq: c.eq }] : [{ text: c.text ?? '', bold: c.bold, small: c.small, tiny: c.tiny, char: c.char }])
  const p = paraXml(runs, { align })
  return `<hp:tc name="" header="${c.shade ? 1 : 0}" hasMargin="1" protect="0" editable="0" dirty="0" borderFillIDRef="${bfId}">`
    + `<hp:subList id="" textDirection="HORIZONTAL" lineWrap="BREAK" vertAlign="CENTER" linkListIDRef="0" linkListNextIDRef="0" textWidth="0" textHeight="0" hasTextRef="0" hasNumRef="0">${p}</hp:subList>`
    + `<hp:cellAddr colAddr="${colAddr}" rowAddr="${rowAddr}"/>`
    + `<hp:cellSpan colSpan="1" rowSpan="1"/>`
    + `<hp:cellSz width="${cellW}" height="${ROW_H}"/>`
    + `<hp:cellMargin left="400" right="400" top="120" bottom="120"/>`
    + `</hp:tc>`
}

// ── 표 ──
// { headers?: cell[], rows: cell[][], weights?: number[], borderless?: bool, shadeBox?: bool }
function tableXml({ headers, rows, weights, borderless, shadeBox }) {
  const nCol = (headers ? headers.length : (rows[0] ? rows[0].length : 1))
  const w = weights && weights.length === nCol ? weights : Array(nCol).fill(1)
  const wsum = w.reduce((a, b) => a + b, 0)
  const colW = w.map(x => Math.round(PAGE_USABLE_W * x / wsum))
  colW[nCol - 1] = PAGE_USABLE_W - colW.slice(0, -1).reduce((a, b) => a + b, 0)
  const tableBf = shadeBox ? BF.shadeBox : (borderless ? BF.none : BF.cell)

  const allRows = []
  if (headers) {
    allRows.push(headers.map(h => (typeof h === 'object'
      ? { ...h, shade: true, bold: true, align: h.align || 'center' }
      : { text: h, shade: true, bold: true, align: 'center' })))
  }
  rows.forEach(row => allRows.push(row))
  const rowCnt = allRows.length

  // 테두리 없는 표(borderless/shadeBox)는 규약을 적용하지 않는다
  const useGrid = !borderless && !shadeBox
  const trs = allRows.map((row, ri) =>
    `<hp:tr>${row.map((cell, ci) => cellXml(
      cell, ci, ri, colW[ci], tableBf,
      useGrid ? gridBf(ri, ci, rowCnt, nCol, !!headers) : null,
    )).join('')}</hp:tr>`
  ).join('')

  const tbl = `<hp:tbl id="${nextId()}" zOrder="0" numberingType="TABLE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" pageBreak="CELL" repeatHeader="${headers ? 1 : 0}" rowCnt="${rowCnt}" colCnt="${nCol}" cellSpacing="0" borderFillIDRef="${tableBf}" noAdjust="0">`
    + `<hp:sz width="${PAGE_USABLE_W}" widthRelTo="ABSOLUTE" height="${rowCnt * ROW_H}" heightRelTo="ABSOLUTE" protect="0"/>`
    + `<hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="COLUMN" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/>`
    + `<hp:outMargin left="0" right="0" top="140" bottom="140"/><hp:inMargin left="0" right="0" top="0" bottom="0"/>`
    + trs + `</hp:tbl>`
  return `<hp:p id="${nextId()}" paraPrIDRef="${PARA.left}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="0">${tbl}</hp:run></hp:p>`
}

// ── 문서 빌더 ──
export class HwpxBuilder {
  constructor() { this.body = [] }

  // 표제부(중앙 큰 제목 + 부제)
  coverTitle(title, subtitle) {
    this.body.push(paraXml([{ text: title, char: 'title' }], { align: 'center' }))
    if (subtitle) this.body.push(paraXml([{ text: subtitle, small: true }], { align: 'center' }))
    this.body.push(paraXml([{ text: '' }]))
    return this
  }
  // 표제표: [[key,val],...] → 키는 작은 굵게, 값은 작은 글꼴
  infoTable(rows) {
    this.body.push(tableXml({
      rows: rows.map(([k, v]) => [
        { text: k, char: 'smallBold', shade: true, align: 'center' },
        { text: String(v), small: true, align: 'left' },
      ]),
      weights: [1, 4],
    }))
    this.spacer()
    return this
  }
  // ── 절 제목 ──────────────────────────────────────────────
  // 지침 1) 0.0절(대절)이 바뀔 때는 쪽을 바꿔도 된다 → 기본 쪽 나눔
  //   ※ 문서 첫 절은 앞이 비어 있으므로 쪽 나눔을 넣지 않는다(빈 쪽 방지).
  // 지침 2) 0.0.0절(소절)은 쪽을 바꾸지 않고 이어 쓴다.
  heading(text, opts = {}) {
    const first = this.body.length === 0
    const brk = opts.pageBreak != null ? opts.pageBreak : !first
    // 쪽 나눔 직전의 빈 문단은 빈 쪽을 만들므로 제거 (지침서 §11)
    if (brk) this._dropTrailingEmpty()
    this.body.push(paraXml([{ text, char: 'section' }], { align: 'left', pageBreak: brk }))
    return this
  }
  /** 소절 제목 — 쪽을 바꾸지 않고 이어 쓴다 (지침 2) */
  subheading(text) {
    this.body.push(paraXml([{ text, bold: true }], { align: 'left' }))
    return this
  }
  sub(text) { this.body.push(paraXml([{ text, bold: true }], { align: 'left' })); return this }

  /** 직전 빈 문단들을 제거 (연속 빈 문단·쪽 나눔 앞 빈 문단 방지) */
  _dropTrailingEmpty() {
    const EMPTY = /<hp:t><\/hp:t>|<hp:t\/>/
    while (this.body.length) {
      const last = this.body[this.body.length - 1]
      if (last.includes('<hp:tbl ') || last.includes('<hp:pic ')) break
      if (!EMPTY.test(last)) break
      this.body.pop()
    }
    return this
  }

  // ── 표·그림 제목 ─────────────────────────────────────────
  // 지침 6) 표제목은 항상 표 위    지침 3) 제목과 개체가 갈라지지 않게 붙여 넣는다
  /** 표제목 + 표를 한 묶음으로 (제목이 앞 쪽에 홀로 남지 않도록 함께 배치) */
  tableWithCaption(caption, spec) {
    this.body.push(paraXml([{ text: caption, char: 'smallBold' }], { align: 'center' }))
    this.body.push(tableXml(spec))
    return this
  }
  // 지침 7) 그림제목은 항상 그림 밑
  /** 그림(개체 XML) + 그림제목을 한 묶음으로 */
  figureWithCaption(figureXml, caption) {
    this.body.push(figureXml)
    this.body.push(paraXml([{ text: caption, char: 'smallBold' }], { align: 'center' }))
    return this
  }
  para(text, opts) { this.body.push(paraXml([{ text }], opts)); return this }
  note(text) { this.body.push(paraXml([{ text, tiny: true }], { align: 'left' })); return this }
  runs(runs, opts) { this.body.push(paraXml(runs, opts)); return this }
  spacer() { this.body.push(paraXml([{ text: '' }])); return this }
  table(spec) { this.body.push(tableXml(spec)); return this }

  // 수식 강조 박스: lines = [{label?, eq?|text?}, ...] — 음영 1열 표
  // ※ 수식 개체 폭 추정 오차로 인한 겹침 방지: 수식과 후행 텍스트는 별도 행으로 분리
  eqBox(lines) {
    const rows = []
    lines.forEach(l => {
      if (l.label || (l.text && !l.eq)) {
        rows.push([{
          runs: [
            ...(l.label ? [{ text: l.label + '  ', char: 'smallBold' }] : []),
            ...(!l.eq && l.text ? [{ text: l.text, small: true }] : []),
          ],
          bf: BF.shadeBox, align: 'left',
        }])
      }
      if (l.eq) {
        rows.push([{ runs: [{ eq: l.eq }], bf: BF.shadeBox, align: 'left' }])
        if (l.text) rows.push([{ runs: [{ text: l.text.trim(), small: true }], bf: BF.shadeBox, align: 'left' }])
      }
    })
    this.body.push(tableXml({ shadeBox: true, weights: [1], rows }))
    return this
  }

  // 수식 1건 강조 박스 (구버전 호환)
  equation(label, script) { return this.eqBox([{ label, eq: script }]) }

  // 계산 행 묶음(PIPER CalcRow 스타일): rows = [{label, expr, value}] — 무테두리 3열 표
  calcRows(rows) {
    this.body.push(tableXml({
      borderless: true,
      weights: [1.6, 2.6, 1.4],
      rows: rows.map(r => [
        { text: r.label, char: 'smallBold', align: 'left', bf: BF.none },
        { text: r.expr ?? '', small: true, align: 'left', bf: BF.none },
        { text: r.value != null ? `= ${r.value}` : '', char: 'smallBold', align: 'right', bf: BF.none },
      ]),
    }))
    return this
  }

  buildSection0() {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
      + SEC_OPEN + SECPR_BLOCK + this.body.join('') + '</hs:sec>'
  }
}

// content.hpf 제목 패치
function patchHpf(hpfStr, title) {
  if (!title) return hpfStr
  return hpfStr
    .replace(/<opf:title\/>/, `<opf:title>${esc(title)}</opf:title>`)
    .replace(/<opf:title>[\s\S]*?<\/opf:title>/, `<opf:title>${esc(title)}</opf:title>`)
}

function b64ToStr(b64) {
  const bin = atob(b64)
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0))
  return new TextDecoder('utf-8').decode(bytes)
}

// ── 패키징 & 다운로드 ──
export async function downloadHwpx(builder, filename, { title } = {}) {
  const zip = new JSZip()
  zip.file('mimetype', 'application/hwp+zip', { compression: 'STORE' })
  for (const [name, b64] of Object.entries(HWPX_TEMPLATE)) {
    if (name === 'mimetype') continue
    if (name === 'Contents/content.hpf') {
      zip.file(name, patchHpf(b64ToStr(b64), title), { compression: 'DEFLATE' })
    } else {
      zip.file(name, b64, { base64: true, compression: 'DEFLATE' })
    }
  }
  zip.file('Contents/section0.xml', builder.buildSection0(), { compression: 'DEFLATE' })

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/hwp+zip',
    compressionOptions: { level: 6 },
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
