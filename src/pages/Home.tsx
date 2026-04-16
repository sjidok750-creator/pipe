import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useStore } from '../store/useStore.js'

const MODULES = [
  {
    id: 'structural',
    path: '/structural/input',
    title: '관로 구조안전성 검토',
    sub: 'KDS 57 10 00 : 2022',
    desc: '내압·링휨·처짐·좌굴 6단계 자동 검토',
    badge: null,
    items: ['내압 검토 (Barlow)', '링 휨응력 검토', '변형량 검토 (Iowa)', '좌굴 검토 (AWWA M11)', 'PDF 보고서 출력'],
    active: true,
  },
  {
    id: 'seismic-prelim',
    path: '/seismic-prelim',
    title: '내진성능 예비평가',
    sub: 'KDS 57 17 00 : 2022',
    desc: '기능수행 / 즉시복구 성능목표 예비 검토',
    badge: '개발 예정',
    items: ['내진등급 및 성능목표 설정', '지반분류 / 설계지반운동', 'PGV 기반 피해 예비평가', '상세평가 필요 여부 판단'],
    active: false,
  },
  {
    id: 'seismic-detail',
    path: '/seismic-detail',
    title: '내진성능 상세평가',
    sub: 'KDS 57 17 00 : 2022',
    desc: '축방향·굽힘응력·이음부 변형 상세 해석',
    badge: '개발 예정',
    items: ['축방향 응력 검토', '굽힘응력 검토', '지반액상화 부력 검토', '이음부 허용변형각 검토'],
    active: false,
  },
]

export default function Home() {
  const navigate = useNavigate()
  const { history, loadFromHistory, deleteHistory, resetInputs } = useStore()

  const handleNew = () => {
    resetInputs()
    navigate('/structural/input')
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
          KDS 57 00 00 : 2022 기반 매설관로 구조·내진 안전성 자동 검토
        </p>
        <p className="text-white/60 text-xs mb-6">
          강관(KS D 3565) / 덕타일 주철관(KS D 4311) | DB-24 차량하중 | AWWA M11 / DIPRA
        </p>
        <button
          onClick={handleNew}
          className="px-8 py-3 rounded-xl font-bold text-lg bg-white transition-transform hover:scale-105"
          style={{ color: '#003366' }}
        >
          구조안전성 검토 시작
        </button>
      </div>

      {/* 3개 모듈 카드 */}
      <div className="space-y-3">
        <div className="text-sm font-bold px-1" style={{ color: '#003366' }}>검토 모듈</div>
        {MODULES.map((mod) => (
          <Link
            key={mod.id}
            to={mod.path}
            className="block bg-white rounded-xl shadow-sm p-5 transition-all hover:shadow-md"
            style={{
              border: mod.active ? '1.5px solid #b0c8e8' : '1.5px solid #e0e0e0',
              opacity: mod.active ? 1 : 0.75,
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold" style={{ color: '#003366' }}>{mod.title}</span>
                  {mod.badge && (
                    <span className="text-xs px-2 py-0.5 rounded font-semibold"
                          style={{ background: '#fff0cc', color: '#8a6000', border: '1px solid #f0c040' }}>
                      {mod.badge}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mb-2">{mod.sub} — {mod.desc}</div>
                <div className="flex flex-wrap gap-2">
                  {mod.items.map((item) => (
                    <span key={item} className="text-xs px-2 py-0.5 rounded"
                          style={{ background: '#f0f7ff', color: '#003366', border: '1px solid #dde8f5' }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0 mt-1">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7 4L13 10L7 16" stroke={mod.active ? '#003366' : '#aaa'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 기준 뱃지 */}
      <div className="flex flex-wrap gap-2">
        {[
          'KDS 57 00 00 : 2022',
          'KDS 57 17 00 : 2022',
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
                    <span className="text-gray-400 font-normal ml-1 text-xs">
                      {entry.grade}
                    </span>
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
                    onClick={() => { loadFromHistory(entry.id); navigate('/structural/result') }}
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
    </div>
  )
}
