import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'

export default function Home() {
  const navigate = useNavigate()
  const { history, loadFromHistory, deleteHistory, resetInputs } = useStore()

  const handleNew = () => {
    resetInputs()
    navigate('/input')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* 히어로 */}
      <div className="rounded-2xl p-8 text-white text-center"
           style={{ background: 'linear-gradient(135deg, #003366 60%, #1a5c99)' }}>
        <div className="mb-3">
          <svg width="64" height="64" viewBox="0 0 64 64" className="mx-auto">
            <circle cx="32" cy="32" r="30" stroke="white" strokeWidth="3" fill="none"/>
            <circle cx="32" cy="32" r="18" stroke="white" strokeWidth="3" fill="none"/>
            <circle cx="32" cy="32" r="8" fill="white" opacity="0.3"/>
            <line x1="10" y1="32" x2="54" y2="32" stroke="white" strokeWidth="2" opacity="0.5"/>
            <line x1="32" y1="10" x2="32" y2="54" stroke="white" strokeWidth="2" opacity="0.5"/>
          </svg>
        </div>
        <h1 className="text-3xl font-black mb-2">PipeCheck KDS</h1>
        <p className="text-white/80 text-sm mb-1">
          KDS 57 00 00 : 2022 기반 매설관로 구조안전성 자동 검토
        </p>
        <p className="text-white/60 text-xs mb-6">
          강관(KS D 3565) / 덕타일 주철관(KS D 4311) | DB-24 차량하중 | AWWA M11 / DIPRA
        </p>
        <button
          onClick={handleNew}
          className="px-8 py-3 rounded-xl font-bold text-lg bg-white transition-transform hover:scale-105"
          style={{ color: '#003366' }}
        >
          새 프로젝트 시작
        </button>
      </div>

      {/* 기능 소개 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: '📐', title: '내압 검토', desc: 'Barlow 공식\nHoop Stress' },
          { icon: '⬇', title: '처짐 검토', desc: 'Modified Iowa\n변형율 산정' },
          { icon: '🔄', title: '좌굴 검토', desc: 'AWWA M11\nEq.5-5' },
          { icon: '📄', title: 'PDF 보고서', desc: '예제집 스타일\n자동 생성' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="bg-white rounded-xl p-4 text-center shadow-sm"
               style={{ border: '1.5px solid #dde8f5' }}>
            <div className="text-2xl mb-2">{icon}</div>
            <div className="text-sm font-bold mb-1" style={{ color: '#003366' }}>{title}</div>
            <div className="text-xs text-gray-500 whitespace-pre-line">{desc}</div>
          </div>
        ))}
      </div>

      {/* 기준 뱃지 */}
      <div className="flex flex-wrap gap-2">
        {[
          'KDS 57 00 00 : 2022',
          'KS D 3565 (강관)',
          'KS D 4311 (주철관)',
          'DB-24 차량하중',
          'AWWA M11',
          'DIPRA',
        ].map((badge) => (
          <span key={badge}
                className="px-3 py-1 rounded-full text-xs font-medium text-white"
                style={{ background: '#003366' }}>
            {badge}
          </span>
        ))}
      </div>

      {/* 최근 계산 이력 */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5" style={{ border: '1.5px solid #dde8f5' }}>
          <h2 className="text-base font-bold mb-4" style={{ color: '#003366' }}>최근 계산 이력</h2>
          <div className="space-y-2">
            {history.slice(0, 5).map((entry: any) => (
              <div key={entry.id}
                   className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                   style={{ border: '1px solid #eef2f8' }}>
                <div className={`w-2 h-10 rounded-full ${entry.overallOK ? 'bg-green-500' : 'bg-red-500'}`}/>
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: '#003366' }}>
                    {entry.pipeType === 'steel' ? '강관' : '주철관'} DN{entry.DN}
                    <span className="text-gray-400 font-normal ml-2 text-xs">
                      Pd={entry.Pd}MPa / H={entry.H}m
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">{entry.date}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={entry.overallOK ? 'badge-ok' : 'badge-ng'}>
                    {entry.overallOK ? 'OK' : 'NG'}
                  </span>
                  <button
                    onClick={() => { loadFromHistory(entry.id); navigate('/result') }}
                    className="text-xs px-3 py-1 rounded font-medium transition-colors"
                    style={{ background: '#e8f0fb', color: '#003366' }}
                  >
                    불러오기
                  </button>
                  <button
                    onClick={() => deleteHistory(entry.id)}
                    className="text-xs px-2 py-1 rounded font-medium text-gray-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 확장 계획 */}
      <div className="rounded-xl p-4 text-sm"
           style={{ background: '#fff8e8', borderLeft: '4px solid #f0a500' }}>
        <strong style={{ color: '#003366' }}>향후 확장 계획:</strong>
        <span className="text-gray-600 ml-2">
          내진예비평가 (KDS 57 17 00) / 내진성능 상세평가 / 관로망 통합 검토
        </span>
      </div>
    </div>
  )
}
