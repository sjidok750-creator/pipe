import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import ReportPreview from '../components/report/ReportPreview'
import { exportToPDF } from '../components/report/pdfExport.js'

export default function ReportPage() {
  const navigate = useNavigate()
  const { result, inputs } = useStore()
  const [exporting, setExporting] = useState(false)

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-gray-400 text-lg">계산 결과가 없습니다.</div>
        <button onClick={() => navigate('/input')}
                className="px-6 py-2 rounded-lg text-white font-bold"
                style={{ background: '#003366' }}>
          입력 화면으로
        </button>
      </div>
    )
  }

  const handlePDF = async () => {
    setExporting(true)
    try {
      await exportToPDF()
    } catch (e) {
      alert('PDF 출력 중 오류가 발생했습니다.')
      console.error(e)
    } finally {
      setExporting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div>
      {/* 액션 버튼 */}
      <div className="flex gap-3 mb-6 no-print">
        <button
          onClick={() => navigate('/result')}
          className="px-4 py-2 rounded-lg border-2 text-sm font-bold"
          style={{ borderColor: '#003366', color: '#003366' }}
        >
          ← 결과 화면
        </button>
        <button
          onClick={handlePDF}
          disabled={exporting}
          className="px-6 py-2 rounded-lg text-white font-bold text-sm transition-opacity hover:opacity-90"
          style={{ background: '#003366', opacity: exporting ? 0.7 : 1 }}
        >
          {exporting ? 'PDF 생성 중...' : 'PDF 다운로드'}
        </button>
        <button
          onClick={handlePrint}
          className="px-6 py-2 rounded-lg text-white font-bold text-sm"
          style={{ background: '#555' }}
        >
          인쇄하기
        </button>
      </div>

      {/* 보고서 미리보기 */}
      <div className="bg-white shadow-lg rounded-xl overflow-auto" style={{ border: '1px solid #dde8f5' }}>
        <ReportPreview result={result} inputs={inputs}/>
      </div>
    </div>
  )
}
