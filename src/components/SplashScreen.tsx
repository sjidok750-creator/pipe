import React from 'react'

interface Props {
  onContinue: () => void
}

// 원본 HTML에서 추출한 정확한 SVG 요소
function PiperIcon({ size = 90 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.13))' }}>
      <rect width="100" height="100" rx="18" fill="#F4EFE6"/>
      {/* 큰 원 (실선) */}
      <circle cx="50" cy="50" r="30" fill="none" stroke="#1F1B17" strokeWidth="3.5"/>
      {/* 작은 원 (점선) */}
      <circle cx="50" cy="50" r="22" fill="none" stroke="#1F1B17" strokeWidth="1.2" strokeDasharray="1.2 1.6"/>
      {/* 심박수 파형 */}
      <path d="M 8 50 L 28 50 L 33 50 L 36 38 L 40 62 L 44 32 L 48 68 L 52 44 L 56 56 L 60 50 L 92 50"
        fill="none" stroke="#D97757" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      {/* 중앙 점 */}
      <circle cx="50" cy="50" r="2" fill="#1F1B17"/>
    </svg>
  )
}

export default function SplashScreen({ onContinue }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#EDE6D6',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        background: '#FAF7F1',
        borderRadius: 24,
        padding: '48px 44px 36px',
        width: 300,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        boxShadow: '0 8px 48px rgba(31,27,23,0.12), 0 2px 8px rgba(31,27,23,0.06)',
      }}>
        {/* 아이콘 */}
        <div style={{ marginBottom: 28 }}>
          <PiperIcon size={92} />
        </div>

        {/* PIPER — Fraunces 폰트, 원본 정확한 스타일 */}
        <div style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 42,
          fontWeight: 600,
          color: 'rgb(31, 27, 23)',
          letterSpacing: '-0.84px',
          lineHeight: '44.1px',
          marginBottom: 16,
        }}>
          PIPER
        </div>

        {/* 서브타이틀 — JetBrains Mono */}
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          fontWeight: 500,
          color: 'rgb(31, 27, 23)',
          letterSpacing: '0.28px',
          lineHeight: 1.7,
          textAlign: 'center',
          opacity: 0.5,
          textTransform: 'uppercase',
          marginBottom: 36,
        }}>
          Pipeline Inspection &amp;<br />
          Performance Evaluation<br />
          Reviewer
        </div>

        {/* 시작하기 버튼 */}
        <button
          onClick={onContinue}
          style={{
            width: '100%',
            padding: '16px 0',
            background: 'rgb(31, 27, 23)',
            color: 'rgb(250, 247, 241)',
            border: 'none',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
            letterSpacing: 1,
            marginBottom: 20,
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          시작하기
        </button>

        {/* 크레딧 + 면책조항 */}
        <div style={{
          fontFamily: 'Inter, sans-serif',
          textAlign: 'center',
          lineHeight: 1.7,
        }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'rgb(31,27,23)', opacity: 0.55, letterSpacing: 0.4 }}>
            Crafted by <span style={{ fontWeight: 700 }}>YD ENG</span>
            <span style={{ fontWeight: 400, opacity: 0.8 }}> (2026)</span>
          </div>
          <div style={{ marginTop: 9, fontSize: 9, color: 'rgb(31,27,23)', opacity: 0.38, lineHeight: 1.7, letterSpacing: 0.15 }}>
            Results are for reference only. The user assumes<br />
            full responsibility for all engineering decisions.
          </div>
        </div>
      </div>

      {/* Fraunces 폰트 로드 */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
      `}</style>
    </div>
  )
}
