// ============================================================
// HWPX(.hwpx, 아래한글 개방형 포맷 OWPML) 브라우저 생성기
// 정적 부품(header/content.hpf/…)은 검증된 골든 템플릿(template.ts)에서 가져오고,
// 본문 section0.xml만 런타임에 생성한다. 수식은 native 한글 수식 객체(<hp:equation>)로
// 삽입되어 한글 수식편집기에서 편집 가능하다.
// ============================================================
import JSZip from 'jszip'
import { HWPX_TEMPLATE, SEC_OPEN, SECPR_BLOCK } from './template'

// ── 스타일 ID (골든 템플릿 header.xml에 고정) ──
// ※ 표 안 굵게는 반드시 본문 크기(20)를 사용 — 7/8은 제목용 대형 글꼴
const CHAR = { normal: 0, bold: 20, small: 2, smallBold: 9, tiny: 23, title: 21, section: 22 }
const PARA = { left: 32, center: 30, right: 31, justify: 0 }
const BF = { cell: 3, headerShade: 5, none: 6, shadeBox: 7 }

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
  const h = Math.min(1000 + 850 * depth + (script.includes('sqrt') ? 400 : 0), 4200)
  const w = Math.min(Math.max(script.length * 95, 2600), 9000)
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
function paraXml(runs, { align = 'left' } = {}) {
  const paraId = PARA[align] ?? PARA.left
  const rs = (runs.length ? runs : [{ text: '' }]).map(runXml).join('')
  return `<hp:p id="${nextId()}" paraPrIDRef="${paraId}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">${rs}</hp:p>`
}

// ── 표 셀 ──
// cell: string | { text, runs?, bold, small, tiny, align, eq, shade, bf }
function cellXml(cell, colAddr, rowAddr, cellW, tableBf) {
  const c = typeof cell === 'object' && cell !== null ? cell : { text: cell }
  const align = c.align || 'left'
  const bfId = c.bf != null ? c.bf : (c.shade ? BF.headerShade : tableBf)
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

  const trs = allRows.map((row, ri) =>
    `<hp:tr>${row.map((cell, ci) => cellXml(cell, ci, ri, colW[ci], tableBf)).join('')}</hp:tr>`
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
  heading(text) { this.body.push(paraXml([{ text, char: 'section' }], { align: 'left' })); return this }
  sub(text) { this.body.push(paraXml([{ text, bold: true }], { align: 'left' })); return this }
  para(text, opts) { this.body.push(paraXml([{ text }], opts)); return this }
  note(text) { this.body.push(paraXml([{ text, tiny: true }], { align: 'left' })); return this }
  runs(runs, opts) { this.body.push(paraXml(runs, opts)); return this }
  spacer() { this.body.push(paraXml([{ text: '' }])); return this }
  table(spec) { this.body.push(tableXml(spec)); return this }

  // 수식 강조 박스: lines = [{label?, eq?|text?}, ...] — 음영 1열 표
  eqBox(lines) {
    this.body.push(tableXml({
      shadeBox: true,
      weights: [1],
      rows: lines.map(l => [{
        runs: [
          ...(l.label ? [{ text: l.label + '  ', char: 'smallBold' }] : []),
          ...(l.eq ? [{ eq: l.eq }] : []),
          ...(l.text ? [{ text: l.text, small: true }] : []),
        ],
        bf: BF.shadeBox, align: 'left',
      }]),
    }))
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
