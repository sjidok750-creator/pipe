import React, { useState } from 'react'
import { Outlet, NavLink, useLocation, Link } from 'react-router-dom'
import { T } from '../eng/tokens'

const PIXEL_FONT = "'Press Start 2P', monospace"

const MODULE_TABS = [
  {
    id: 'structural',
    path: '/structural/overview',
    matchBase: '/structural',
    label: '관로 구조안전성 검토',
    labelShort: '구조안전성',
    sub: 'KDS 57 10 00',
  },
  {
    id: 'seismic-prelim',
    path: '/seismic-prelim/overview',
    matchBase: '/seismic-prelim',
    label: '내진성능 예비평가',
    labelShort: '예비평가',
    sub: 'KDS 57 17 00',
  },
  {
    id: 'seismic-detail',
    path: '/seismic-detail/overview',
    matchBase: '/seismic-detail',
    label: '내진성능 상세평가',
    labelShort: '상세평가',
    sub: 'KDS 57 17 00',
  },
]

const SUBNAV_MAP: Record<string, { to: string; label: string }[]> = {
  'structural': [
    { to: '/structural/overview',  label: '검토개요' },
    { to: '/structural/input',     label: '입력' },
    { to: '/structural/result',    label: '결과' },
    { to: '/structural/report',    label: '보고서' },
    { to: '/structural/reference', label: '기준자료' },
  ],
  'seismic-prelim': [
    { to: '/seismic-prelim/overview', label: '검토개요' },
    { to: '/seismic-prelim/input',    label: '입력' },
    { to: '/seismic-prelim/result',   label: '결과' },
    { to: '/seismic-prelim/report',   label: '보고서' },
  ],
  'seismic-detail': [
    { to: '/seismic-detail/overview', label: '검토개요' },
    { to: '/seismic-detail/input',    label: '입력' },
    { to: '/seismic-detail/result',   label: '결과' },
    { to: '/seismic-detail/report',   label: '보고서' },
  ],
}

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const activeModule = MODULE_TABS.find(t => pathname.startsWith(t.matchBase))
  const subNav = activeModule ? SUBNAV_MAP[activeModule.id] : null

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: T.bgApp }}>

      {/* ── 최상단 헤더 ── */}
      <header style={{ background: T.bgHeader, flexShrink: 0 }}>
        <div style={{
          maxWidth: 960, margin: '0 auto', padding: '0 16px',
          height: 38, display: 'flex', alignItems: 'center', gap: 14,
        }}>
          {/* 모바일 햄버거 */}
          <button
            style={{ display: 'none', padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(v => !v)}
          >
            ☰
          </button>

          {/* 로고 — 픽셀 폰트 STEP-PIPE */}
          <Link to="/" style={{
            display: 'flex', alignItems: 'center', gap: 0,
            color: 'white', textDecoration: 'none',
          }}>
            {/* STEP- 노란색, PIPE 청록색 */}
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 11, color: '#ffe600', letterSpacing: 1 }}>STEP-</span>
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 11, color: '#4af', letterSpacing: 1 }}>PIPE</span>
          </Link>

          {/* 버전 뱃지 */}
          <span style={{
            fontSize: 9, color: 'rgba(255,255,255,0.4)',
            fontFamily: T.fontMono,
          }}>
            KDS 57 00 00 : 2022
          </span>

          {/* 현재 모듈 표시 */}
          {activeModule && (
            <span style={{
              marginLeft: 'auto', fontSize: 10,
              color: 'rgba(255,255,255,0.5)', fontFamily: T.fontSans,
            }}>
              {activeModule.sub}
            </span>
          )}
        </div>
      </header>

      {/* ── 모듈 탭바 ── */}
      <div style={{
        background: '#0f2640',
        borderBottom: '1px solid #0a1d30',
        flexShrink: 0,
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px', display: 'flex' }}>
          {MODULE_TABS.map(tab => {
            const isActive = pathname !== '/' && pathname.startsWith(tab.matchBase)
            return (
              <Link
                key={tab.id}
                to={tab.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '0 12px', height: 30,
                  fontSize: 11, fontFamily: T.fontSans,
                  color: isActive ? 'white' : 'rgba(255,255,255,0.45)',
                  fontWeight: isActive ? 700 : 400,
                  textDecoration: 'none',
                  borderBottom: isActive ? '2px solid #4a90d9' : '2px solid transparent',
                  transition: 'color .15s',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: 9, opacity: 0.6 }}>{tab.sub}</span>
                <span>{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── 하위 탭 (해당 모듈에서만 표시) ── */}
      {subNav && (
        <div style={{
          background: '#f5f5f5',
          borderBottom: '1px solid #cccccc',
          flexShrink: 0,
        }}>
          <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px', display: 'flex', gap: 0 }}>
            {subNav.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                style={({ isActive }) => ({
                  display: 'inline-block',
                  padding: '4px 14px',
                  fontSize: 11,
                  fontFamily: T.fontSans,
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? T.bgActive : '#555',
                  textDecoration: 'none',
                  borderBottom: isActive ? `2px solid ${T.bgActive}` : '2px solid transparent',
                  background: isActive ? 'white' : 'transparent',
                  borderRight: '1px solid #ddd',
                })}
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* ── 모바일 드롭다운 ── */}
      {mobileMenuOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div style={{ background: T.bgHeader, position: 'absolute', top: 38, left: 0, right: 0 }}
            onClick={e => e.stopPropagation()}>
            {MODULE_TABS.map(tab => (
              <Link key={tab.id} to={tab.path}
                style={{ display: 'block', padding: '10px 16px', color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 12, fontFamily: T.fontSans, borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                onClick={() => setMobileMenuOpen(false)}>
                <div style={{ fontWeight: 700 }}>{tab.label}</div>
                <div style={{ fontSize: 10, opacity: 0.5 }}>{tab.sub}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── 본문 ── */}
      <main style={{ flex: 1, overflow: 'auto', padding: '10px 16px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
