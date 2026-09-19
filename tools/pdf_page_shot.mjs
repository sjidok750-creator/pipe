// PDF 쪽을 이미지로 렌더링 (Chromium PDF 뷰어 사용)
//
// 왜 필요한가 — 「기존 시설물(상수도) 내진성능 평가요령」의 수식·예제 숫자는
// Type3 폰트(ToUnicode 없음)로 그려져 있어 pypdf 의 extract_text() 로는
// **숫자가 아예 나오지 않는다**. 텍스트만 뽑으면 "관경(외경) : m" 처럼
// 값이 통째로 빈칸으로 보이므로, 부록 C 예제값을 읽으려면 반드시 쪽을
// 이미지로 렌더링해서 직접 판독해야 한다.
//   (스캔본 PDF 는 CLAUDE.md 의 pypdf 이미지 추출 방법을 쓸 것 — 용도가 다르다)
//
// 사용: node tools/pdf_page_shot.mjs <pdf경로> <0부터 세는 쪽번호…>
//   예: node tools/pdf_page_shot.mjs "기존 시설물(상수도) 내진성능 평가요령.pdf" 169 181
//   결과: ./pdfshot/p<N>.png
import { chromium } from 'playwright-core'
import path from 'node:path'
import fs from 'node:fs'

const [pdfPath, ...pageArgs] = process.argv.slice(2)
if (!pdfPath || !pageArgs.length) {
  console.error('사용: node tools/pdf_page_shot.mjs <pdf경로> <쪽번호(0부터)…>')
  process.exit(1)
}
const OUT = process.env.PDFSHOT_OUT ?? 'pdfshot'
fs.mkdirSync(OUT, { recursive: true })

const url = 'file://' + encodeURI(path.resolve(pdfPath)).replace(/#/g, '%23')
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1100, height: 1500 } })
for (const n of pageArgs.map(Number)) {
  await p.goto('about:blank')                       // 같은 URL 재방문 시 해시만 바뀌면 이동하지 않는다
  await p.goto(`${url}#page=${n + 1}&zoom=125`, { waitUntil: 'load' })
  await p.waitForTimeout(2500)                      // 뷰어 렌더링 대기
  await p.screenshot({ path: `${OUT}/p${n}.png` })
  console.log('saved', `${OUT}/p${n}.png`)
}
await b.close()
