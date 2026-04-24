import React, { useEffect, useState } from 'react'

const PIXEL_FONT = "'Press Start 2P', monospace"

const SCANLINE_STYLE: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
  pointerEvents: 'none',
  zIndex: 1,
}

const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 70}%`,
  size: Math.random() * 2 + 1,
  opacity: Math.random() * 0.6 + 0.2,
  animDelay: `${Math.random() * 3}s`,
}))

interface Props {
  onContinue: () => void
}

export default function SplashScreen({ onContinue }: Props) {
  const [blink, setBlink] = useState(true)
  const [scanY, setScanY] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setBlink(v => !v), 600)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    let raf: number
    let y = 0
    const tick = () => {
      y = (y + 0.4) % 100
      setScanY(y)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: '#05082a',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', userSelect: 'none',
      }}
    >
      {/* 배경 스타 */}
      {STARS.map(s => (
        <div key={s.id} style={{
          position: 'absolute',
          left: s.left, top: s.top,
          width: s.size, height: s.size,
          borderRadius: '50%',
          background: 'white',
          opacity: s.opacity,
          animation: `twinkle 2s ${s.animDelay} infinite alternate`,
        }} />
      ))}

      {/* 스캔라인 글로우 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(180deg, transparent ${scanY - 2}%, rgba(100,200,255,0.04) ${scanY}%, transparent ${scanY + 2}%)`,
        pointerEvents: 'none', zIndex: 1,
        transition: 'background 0.016s linear',
      }} />

      {/* 스캔라인 */}
      <div style={SCANLINE_STYLE} />

      {/* 메인 컨텐츠 */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 24px' }}>

        {/* 상단 장식 */}
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: '#4af', letterSpacing: 3, marginBottom: 24, opacity: 0.7 }}>
          ★ KDS 57 00 00 : 2022 ★
        </div>

        {/* 파이프 아이콘 픽셀 */}
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
          <svg width="80" height="40" viewBox="0 0 80 40" style={{ imageRendering: 'pixelated' }}>
            {/* 파이프 외곽 */}
            <rect x="0" y="10" width="80" height="20" fill="#1a3a6a" />
            <rect x="0" y="10" width="80" height="4" fill="#3a6aaa" />
            <rect x="0" y="26" width="80" height="4" fill="#0a1a3a" />
            {/* 파이프 내부 */}
            <rect x="4" y="14" width="72" height="12" fill="#0d2040" />
            {/* 연결부 */}
            <rect x="30" y="6" width="20" height="28" fill="#2a4a7a" />
            <rect x="30" y="6" width="20" height="4" fill="#4a7aaa" />
            <rect x="30" y="30" width="20" height="4" fill="#0a1a3a" />
            {/* 반짝임 */}
            <rect x="4" y="14" width="72" height="2" fill="rgba(100,180,255,0.15)" />
            {/* 픽셀 하이라이트 */}
            <rect x="36" y="8" width="2" height="2" fill="#6af" opacity="0.5" />
            <rect x="42" y="8" width="2" height="2" fill="#6af" opacity="0.5" />
          </svg>
        </div>

        {/* STEP-PIPE 메인 타이틀 */}
        <div style={{ position: 'relative', marginBottom: 8 }}>
          {/* 그림자 레이어 (파란색) */}
          <div style={{
            fontFamily: PIXEL_FONT,
            fontSize: 'clamp(24px, 6vw, 42px)',
            color: '#1a4aff',
            position: 'absolute',
            top: 5, left: 5,
            width: '100%',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
          }}>
            STEP-PIPE
          </div>
          {/* 그림자 레이어 (빨간색) */}
          <div style={{
            fontFamily: PIXEL_FONT,
            fontSize: 'clamp(24px, 6vw, 42px)',
            color: '#ff1a2a',
            position: 'absolute',
            top: -3, left: -3,
            width: '100%',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
          }}>
            STEP-PIPE
          </div>
          {/* 메인 텍스트 (노란색) */}
          <div style={{
            fontFamily: PIXEL_FONT,
            fontSize: 'clamp(24px, 6vw, 42px)',
            color: '#ffe600',
            position: 'relative',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
            textShadow: '0 0 20px rgba(255,230,0,0.5), 0 0 40px rgba(255,230,0,0.2)',
          }}>
            STEP-PIPE
          </div>
        </div>

        {/* 서브 타이틀 */}
        <div style={{
          fontFamily: PIXEL_FONT,
          fontSize: 'clamp(6px, 1.5vw, 9px)',
          color: '#7ac',
          letterSpacing: 2,
          marginBottom: 12,
          lineHeight: 2,
        }}>
          SEISMIC &amp; STRUCTURAL<br />PIPE EVALUATION TOOL
        </div>

        {/* 구분선 픽셀 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 36,
        }}>
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} style={{
              width: 6, height: 4,
              background: i % 3 === 0 ? '#ffe600' : i % 3 === 1 ? '#ff1a2a' : '#1a4aff',
              opacity: 0.8,
            }} />
          ))}
        </div>

        {/* 모듈 미리보기 */}
        <div style={{
          display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 40, flexWrap: 'wrap',
        }}>
          {[
            { label: 'MODULE 1', sub: '구조안전성', color: '#4af' },
            { label: 'MODULE 2', sub: '예비평가', color: '#fa4' },
            { label: 'MODULE 3', sub: '상세평가', color: '#f4a' },
          ].map(m => (
            <div key={m.label} style={{
              fontFamily: PIXEL_FONT,
              fontSize: 7,
              color: m.color,
              border: `1px solid ${m.color}`,
              padding: '6px 10px',
              lineHeight: 1.8,
              opacity: 0.75,
            }}>
              {m.label}<br />
              <span style={{ color: 'white', opacity: 0.6 }}>{m.sub}</span>
            </div>
          ))}
        </div>

        {/* CONTINUE 버튼 */}
        <div
          onClick={onContinue}
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 'clamp(10px, 2.5vw, 14px)',
            color: blink ? '#ffe600' : 'transparent',
            letterSpacing: 3,
            cursor: 'pointer',
            transition: 'color 0.05s',
            textShadow: blink ? '0 0 16px rgba(255,230,0,0.8)' : 'none',
            padding: '10px 0',
          }}
        >
          ▶ CONTINUE ◀
        </div>

        {/* 하단 버전 */}
        <div style={{
          fontFamily: PIXEL_FONT,
          fontSize: 6,
          color: 'rgba(100,150,200,0.4)',
          marginTop: 32,
          letterSpacing: 2,
        }}>
          VER 1.0.0 &nbsp;·&nbsp; © 2025
        </div>
      </div>

      <style>{`
        @keyframes twinkle {
          from { opacity: 0.1; transform: scale(0.8); }
          to   { opacity: 0.9; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
