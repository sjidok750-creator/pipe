// ============================================================
// HWPX(.hwpx, 아래한글 개방형 포맷 OWPML) 브라우저 생성기
// 정적 부품(header/content.hpf/…)은 검증된 골든 템플릿(template.ts)에서 가져오고,
// 본문 section0.xml만 런타임에 생성한다. 수식은 native 한글 수식 객체(<hp:equation>)로
// 삽입되어 한글 수식편집기에서 편집 가능하다.
// 검증: 골든 템플릿은 python-hwpx round-trip 확인. 생성물은 동일 라이브러리로 역검증.
// ============================================================
import JSZip from 'jszip'
import { HWPX_TEMPLATE, SEC_OPEN, SECPR_BLOCK } from './template'

// ── 스타일 ID (골든 템플릿 header.xml에 고정) ──
const CHAR = { normal: 0, bold: 7, small: 2, smallBold: 9, heading: 8 }
const PARA = { left: 0, center: 30, right: 31 }
const BF = { cell: 3, headerCell: 4, headerShade: 5 }  // borderFill: 본문셀/헤더셀/헤더음영

const PAGE_USABLE_W = 42520   // HWPUNIT (pagePr width 59528 − 좌우 여백 8504×2)
const ROW_H = 2800

let _idc = 1000000000
const nextId = () => String(_idc++)

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ── 런(텍스트/수식) ──
// run: { text, bold, small, eq }  — eq가 있으면 수식 런
function runXml(run) {
  const charId = run.eq ? CHAR.normal
    : run.small ? (run.bold ? CHAR.smallBold : CHAR.small)
    : (run.bold ? CHAR.bold : CHAR.normal)
  const inner = run.eq ? equationXml(run.eq) : `<hp:t>${esc(run.text)}</hp:t>`
  return `<hp:run charPrIDRef="${charId}">${inner}</hp:run>`
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
function paraXml(runs, { align = 'left', para } = {}) {
  const paraId = para != null ? para : PARA[align] ?? PARA.left
  const rs = (runs.length ? runs : [{ text: '' }]).map(runXml).join('')
  return `<hp:p id="${nextId()}" paraPrIDRef="${paraId}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">${rs}</hp:p>`
}

// ── 표 셀 ──
// cell: string | { text, bold, align, eq, shade, small }
function cellXml(cell, colAddr, rowAddr, cellW) {
  const c = typeof cell === 'object' && cell !== null ? cell : { text: cell }
  const align = c.align || (c.eq ? 'left' : 'left')
  const bfId = c.shade ? BF.headerShade : BF.cell
  const runs = c.eq ? [{ eq: c.eq }] : [{ text: c.text ?? '', bold: c.bold, small: c.small }]
  const p = paraXml(runs, { align })
  return `<hp:tc name="" header="${c.shade ? 1 : 0}" hasMargin="1" protect="0" editable="0" dirty="0" borderFillIDRef="${bfId}">`
    + `<hp:subList id="" textDirection="HORIZONTAL" lineWrap="BREAK" vertAlign="CENTER" linkListIDRef="0" linkListNextIDRef="0" textWidth="0" textHeight="0" hasTextRef="0" hasNumRef="0">${p}</hp:subList>`
    + `<hp:cellAddr colAddr="${colAddr}" rowAddr="${rowAddr}"/>`
    + `<hp:cellSpan colSpan="1" rowSpan="1"/>`
    + `<hp:cellSz width="${cellW}" height="${ROW_H}"/>`
    + `<hp:cellMargin left="510" right="510" top="141" bottom="141"/>`
    + `</hp:tc>`
}

// ── 표 ──
// { headers?: cell[], rows: cell[][], weights?: number[] }
function tableXml({ headers, rows, weights }) {
  const nCol = (headers ? headers.length : (rows[0] ? rows[0].length : 1))
  const w = weights && weights.length === nCol ? weights : Array(nCol).fill(1)
  const wsum = w.reduce((a, b) => a + b, 0)
  const colW = w.map(x => Math.round(PAGE_USABLE_W * x / wsum))
  colW[nCol - 1] = PAGE_USABLE_W - colW.slice(0, -1).reduce((a, b) => a + b, 0)  // 합계 보정

  const allRows = []
  let r = 0
  if (headers) {
    allRows.push(headers.map((h, c) => (typeof h === 'object' ? { ...h, shade: true, bold: true, align: h.align || 'center' } : { text: h, shade: true, bold: true, align: 'center' })))
    r = 1
  }
  rows.forEach(row => allRows.push(row))
  const rowCnt = allRows.length

  const trs = allRows.map((row, ri) =>
    `<hp:tr>${row.map((cell, ci) => cellXml(cell, ci, ri, colW[ci])).join('')}</hp:tr>`
  ).join('')

  const tbl = `<hp:tbl id="${nextId()}" zOrder="0" numberingType="TABLE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" pageBreak="CELL" repeatHeader="${headers ? 1 : 0}" rowCnt="${rowCnt}" colCnt="${nCol}" cellSpacing="0" borderFillIDRef="${BF.cell}" noAdjust="0">`
    + `<hp:sz width="${PAGE_USABLE_W}" widthRelTo="ABSOLUTE" height="${rowCnt * ROW_H}" heightRelTo="ABSOLUTE" protect="0"/>`
    + `<hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="COLUMN" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/>`
    + `<hp:outMargin left="0" right="0" top="0" bottom="0"/><hp:inMargin left="0" right="0" top="0" bottom="0"/>`
    + trs + `</hp:tbl>`
  // 표는 문단 안 런에 담긴다
  return `<hp:p id="${nextId()}" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="0">${tbl}</hp:run></hp:p>`
}

// ── 문서 빌더 ──
export class HwpxBuilder {
  constructor() { this.body = [] }

  // 표제부(중앙 큰 제목 + 표제표)
  coverTitle(title, subtitle) {
    this.body.push(paraXml([{ text: title, bold: true }], { align: 'center' }))
    if (subtitle) this.body.push(paraXml([{ text: subtitle, small: true }], { align: 'center' }))
    this.body.push(paraXml([{ text: '' }]))
    return this
  }
  // 표제표(사업명 등)
  infoTable(rows) {  // rows: [[key,val], ...] → 2열
    this.body.push(tableXml({
      rows: rows.map(([k, v]) => [{ text: k, bold: true, shade: true, align: 'center' }, { text: String(v), align: 'left' }]),
      weights: [1, 3],
    }))
    this.spacer()
    return this
  }
  heading(text) { this.body.push(paraXml([{ text, bold: true }], { align: 'left' })); return this }
  sub(text) { this.body.push(paraXml([{ text, bold: true, small: true }], { align: 'left' })); return this }
  para(text, opts) { this.body.push(paraXml([{ text }], opts)); return this }
  note(text) { this.body.push(paraXml([{ text, small: true }], { align: 'left' })); return this }
  runs(runs, opts) { this.body.push(paraXml(runs, opts)); return this }
  // 수식 단독 문단 (라벨: 수식)
  equation(label, script) {
    const runs = []
    if (label) runs.push({ text: label + '   ' })
    runs.push({ eq: script })
    this.body.push(paraXml(runs, { align: 'left' }))
    return this
  }
  table(spec) { this.body.push(tableXml(spec)); return this }
  spacer() { this.body.push(paraXml([{ text: '' }])); return this }

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
  // mimetype: 무압축 & 선두
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
