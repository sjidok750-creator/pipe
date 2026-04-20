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
    items: ['내압 검토 (Barlow)', '링 휨응력 검토', '변형량 검토 (Iowa)', '좌굴 검토 (AWWA M11)', 'PDF 보고서 출력'],
    active: true,
  },
  {
    id: 'seismic-prelim',
    path: '/seismic-prelim',
    title: '내진성능 예비평가',
    sub: 'KDS 57 17 00 : 2022',
    desc: '기능수행 / 즉시복구 성능목표 예비 검토',
    items: ['내진등급 및 성능목표 설정', '지반분류 / 설계지반운동', 'PGV 기반 피해 예비평가', '상세평가 필요 여부 판단'],
    active: false,
  },
  {
    id: 'seismic-detail',
    path: '/seismic-detail',
    title: '내진성능 상세평가',
    sub: 'KDS 57 17 00 : 2022',
    desc: '축방향·굽힘응력·이음부 변형 상세 해석',
    items: ['축방향 응력 검토', '굽힘응력 검토', '지반액상화 부력 검토', '이음부 허용변형각 검토'],
    active: false,
  },
]

export default function Home() {
  const navigate = useNavigate()
  const { history, loadFromHistory, deleteHistory } = useStore()

  return (
    <div className="max-w-3xl mx-auto space-y-4">

      {/* 앱 타이틀 헤더 */}
      <div style={{
        background: 'linear-gradient(135deg, #003366 60%, #1a5c99)',
        borderRadius: 12,
        padding: '20px 28px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <svg width="44" height="44" viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
          <circle cx="32" cy="32" r="30" stroke="white" strokeWidth="3" fill="none"/>
          <circle cx="32" cy="32" r="18" stroke="white" strokeWidth="3" fill="none"/>
          <circle cx="32" cy="32" r="8" fill="white" opacity="0.3"/>
          <line x1="10" y1="32" x2="54" y2="32" stroke="white" strokeWidth="2" opacity="0.5"/>
          <line x1="32" y1="10" x2="32" y2="54" stroke="white" strokeWidth="2" opacity="0.5"/>
        </svg>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: 0.5 }}>PipeCheck KDS</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
            KDS 57 00 00 : 2022 기반 매설관로 구조·내진 안전성 자동 검토
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
            강관(KS D 3565) / 덕타일 주철관(KS D 4311) | DB-24 차량하중 | AWWA M11 / DIPRA
          </div>
        </div>
      </div>

      {/* 검토 모듈 */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#003366', padding: '0 2px 6px' }}>검토 모듈</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {MODULES.map((mod) => (
            <Link
              key={mod.id}
              to={mod.path}
              style={{
                display: 'block',
                background: 'white',
                borderRadius: 10,
                padding: '14px 18px',
                textDecoration: 'none',
                border: mod.active ? '1.5px solid #b0c8e8' : '1.5px solid #e0e0e0',
                opacity: mod.active ? 1 : 0.7,
                boxShadow: mod.active ? '0 1px 4px rgba(0,51,102,0.08)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#003366' }}>{mod.title}</span>
                    <span style={{ fontSize: 10, color: '#5580aa', fontWeight: 500 }}>{mod.sub}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>{mod.desc}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {mod.items.map((item) => (
                      <span key={item} style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 4,
                        background: mod.active ? '#f0f7ff' : '#f5f5f5',
                        color: mod.active ? '#003366' : '#999',
                        border: mod.active ? '1px solid #dde8f5' : '1px solid #e8e8e8',
                      }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ marginTop: 2, flexShrink: 0 }}>
                  <path d="M7 4L13 10L7 16" stroke={mod.active ? '#003366' : '#bbb'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 적용 기준 뱃지 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {[
          'KDS 57 10 00 : 2022',
          'KDS 57 17 00 : 2022',
          'KS D 3565 (강관)',
          'KS D 4311 (주철관)',
          'DB-24 차량하중',
          'AWWA M11',
          'DIPRA',
        ].map((badge) => (
          <span key={badge} style={{
            fontSize: 10, padding: '3px 10px', borderRadius: 20,
            background: '#003366', color: 'white', fontWeight: 500,
          }}>
            {badge}
          </span>
        ))}
      </div>

      {/* 최근 계산 이력 */}
      {history.length > 0 && (
        <div style={{ background: 'white', borderRadius: 10, padding: '16px 18px', border: '1.5px solid #dde8f5' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#003366', marginBottom: 10 }}>최근 계산 이력</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {history.slice(0, 5).map((entry: any) => (
              <div key={entry.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 6,
                border: '1px solid #eef2f8', background: '#fafcff',
              }}>
                <div style={{
                  width: 3, height: 36, borderRadius: 2,
                  background: entry.overallOK ? '#22c55e' : '#ef4444', flexShrink: 0,
                }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#003366' }}>
                    {entry.pipeType === 'steel' ? '강관' : '주철관'} DN{entry.DN}
                    <span style={{ color: '#999', fontWeight: 400, marginLeft: 6, fontSize: 11 }}>
                      {entry.grade}
                    </span>
                    <span style={{ color: '#999', fontWeight: 400, marginLeft: 8, fontSize: 11 }}>
                      Pd={entry.Pd}MPa / H={entry.H}m
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: '#aaa', marginTop: 1 }}>{entry.date}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                    background: entry.overallOK ? '#f0faf4' : '#fff0f0',
                    color: entry.overallOK ? '#1a6b3a' : '#c0392b',
                    border: `1px solid ${entry.overallOK ? '#a3d9b5' : '#f5b3b3'}`,
                  }}>
                    {entry.overallOK ? 'O.K.' : 'N.G.'}
                  </span>
                  <button
                    onClick={() => { loadFromHistory(entry.id); navigate('/structural/result') }}
                    style={{ fontSize: 11, padding: '3px 10px', borderRadius: 4, border: 'none', background: '#e8f0fb', color: '#003366', cursor: 'pointer', fontWeight: 600 }}
                  >
                    불러오기
                  </button>
                  <button
                    onClick={() => deleteHistory(entry.id)}
                    style={{ fontSize: 11, padding: '3px 6px', borderRadius: 4, border: 'none', background: 'none', color: '#ccc', cursor: 'pointer' }}
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
