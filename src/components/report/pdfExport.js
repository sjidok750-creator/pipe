// ============================================================
// PDF 출력 — 브라우저 print API 사용
// html2canvas 방식은 하단 빈 공간·표 페이지 걸림을 해결 불가
// ============================================================

/**
 * #report-content 요소를 PDF로 출력 (브라우저 print)
 */
export async function exportToPDF() {
  window.print()
}
