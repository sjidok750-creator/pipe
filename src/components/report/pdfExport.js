// ============================================================
// PDF 출력 — jsPDF + html2canvas
// ============================================================

import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/**
 * #report-content 요소를 PDF로 출력
 */
export async function exportToPDF() {
  const element = document.getElementById('report-content')
  if (!element) throw new Error('report-content 요소를 찾을 수 없습니다.')

  // 출력 전 스타일 조정
  const originalWidth = element.style.width
  element.style.width = '794px'

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  })

  element.style.width = originalWidth

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pdfW = pdf.internal.pageSize.getWidth()
  const pdfH = pdf.internal.pageSize.getHeight()

  const canvasW = canvas.width
  const canvasH = canvas.height
  const ratio = canvasW / canvasH

  const imgW = pdfW
  const imgH = pdfW / ratio

  let heightLeft = imgH
  let position = 0

  pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH)
  heightLeft -= pdfH

  while (heightLeft > 0) {
    position = heightLeft - imgH
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH)
    heightLeft -= pdfH
  }

  const date = new Date().toLocaleDateString('ko-KR').replace(/\./g, '').replace(/ /g, '')
  pdf.save(`PipeCheck_KDS_${date}.pdf`)
}
