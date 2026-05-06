import React from 'react'

interface Props {
  onContinue: () => void
}

function PiperIcon({ size = 90 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.18))' }}>
      <rect width="100" height="100" rx="22" fill="#f5f0e8"/>
      {/* 격자 */}
      {[20,40,60,80].map(v => (
        <React.Fragment key={v}>
          <line x1="0" y1={v} x2="100" y2={v} stroke="#e0d8cc" strokeWidth="0.8"/>
          <line x1={v} y1="0" x2={v} y2="100" stroke="#e0d8cc" strokeWidth="0.8"/>
        </React.Fragment>
      ))}
      {/* 외곽 원 (점선) */}
      <circle cx="50" cy="50" r="36" stroke="#1a1a1a" strokeWidth="2.2" strokeDasharray="3,3"/>
      {/* 중간 원 */}
      <circle cx="50" cy="50" r="24" stroke="#1a1a1a" strokeWidth="2"/>
      {/* 수평선 */}
      <line x1="10" y1="50" x2="90" y2="50" stroke="#e05a3a" strokeWidth="2.5"/>
      {/* 심박수 파형 */}
      <polyline points="18,50 28,50 33,38 37,62 41,38 46,50 54,50 58,42 63,50 82,50"
        stroke="#e05a3a" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round"/>
      {/* 중앙 점 */}
      <circle cx="50" cy="50" r="3.5" fill="#1a1a1a"/>
      {/* 상하 조준선 */}
      <line x1="50" y1="10" x2="50" y2="22" stroke="#1a1a1a" strokeWidth="2"/>
      <line x1="50" y1="78" x2="50" y2="90" stroke="#1a1a1a" strokeWidth="2"/>
    </svg>
  )
}

export default function SplashScreen({ onContinue }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#f0ebe0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* 카드 */}
      <div style={{
        background: '#faf7f2',
        borderRadius: 24,
        padding: '48px 40px 36px',
        width: 300,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        boxShadow: '0 8px 40px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)',
      }}>
        {/* 아이콘 */}
        <div style={{ marginBottom: 24 }}>
          <PiperIcon size={90} />
        </div>

        {/* PIPER */}
        <div style={{
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 40,
          fontWeight: 900,
          color: '#1a1a1a',
          letterSpacing: 6,
          marginBottom: 8,
        }}>
          PIPER
        </div>

        {/* 서브타이틀 */}
        <div style={{
          fontSize: 9,
          color: '#888',
          letterSpacing: 2,
          textAlign: 'center',
          lineHeight: 1.8,
          fontFamily: 'sans-serif',
          marginBottom: 36,
          textTransform: 'uppercase',
        }}>
          Pipeline Inspection &amp;<br />Performance Evaluation Reviewer
        </div>

        {/* 시작 버튼 */}
        <button
          onClick={onContinue}
          style={{
            width: '100%',
            padding: '15px 0',
            background: '#1a1a1a',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            fontFamily: 'sans-serif',
            cursor: 'pointer',
            letterSpacing: 2,
            marginBottom: 20,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          시작하기
        </button>

        {/* 버전 */}
        <div style={{
          fontSize: 11,
          color: '#bbb',
          fontFamily: 'sans-serif',
          letterSpacing: 1,
        }}>
          v1.0 · 한국수자원공사
        </div>
      </div>
    </div>
  )
}
