import React, { useState } from 'react'
import { Outlet, NavLink, useLocation, Link } from 'react-router-dom'

// 3개 모듈 탭 정의
const MODULE_TABS = [
  {
    id: 'structural',
    path: '/structural/input',
    matchBase: '/structural',
    label: '관로 구조안전성',
    labelShort: '구조안전성',
    sub: 'KDS 57 10 00',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="9" cy="9" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="2" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1" opacity="0.6"/>
        <line x1="9" y1="2" x2="9" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.6"/>
      </svg>
    ),
  },
  {
    id: 'seismic-prelim',
    path: '/seismic-prelim',
    matchBase: '/seismic-prelim',
    label: '내진성능 예비평가',
    labelShort: '예비평가',
    sub: 'KDS 57 17 00',
    badge: '준비중',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 13 L5 8 L8 11 L11 5 L14 9 L16 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="2" y1="15" x2="16" y2="15" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
      </svg>
    ),
  },
  {
    id: 'seismic-detail',
    path: '/seismic-detail',
    matchBase: '/seismic-detail',
    label: '내진성능 상세평가',
    labelShort: '상세평가',
    sub: 'KDS 57 17 00',
    badge: '준비중',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="10" width="3" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="7.5" y="6" width="3" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="13" y="2" width="3" height="14" rx="0.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
]

// structural 하위 내비게이션
const STRUCTURAL_NAV = [
  { to: '/structural/input',     label: '입력' },
  { to: '/structural/result',    label: '결과' },
  { to: '/structural/report',    label: '보고서' },
  { to: '/structural/reference', label: '기준자료' },
]

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { pathname } = useLocation()

  const activeModule = MODULE_TABS.find((t) => pathname.startsWith(t.matchBase))

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f4f6fa' }}>

      {/* ── 최상단 헤더 ── */}
      <header style={{ background: '#003366' }} className="text-white shadow-lg flex-shrink-0">
        <div className="max-w-screen-xl mx-auto px-4 h-12 flex items-center gap-3">
          {/* 모바일 햄버거 */}
          <button
            className="md:hidden p-1.5 rounded hover:bg-white/10"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <rect y="2" width="18" height="1.8" rx="0.9"/>
              <rect y="8" width="18" height="1.8" rx="0.9"/>
              <rect y="14" width="18" height="1.8" rx="0.9"/>
            </svg>
          </button>

          {/* 로고 */}
          <Link to="/" className="flex items-center gap-2 font-black text-base tracking-tight">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="11" stroke="white" strokeWidth="1.8"/>
              <circle cx="12" cy="12" r="6.5" stroke="white" strokeWidth="1.8"/>
              <path d="M5 12 H19 M12 5 V19" stroke="white" strokeWidth="1.2" opacity="0.5"/>
            </svg>
            <span>PipeCheck KDS</span>
          </Link>

          <div className="ml-auto text-xs text-white/40 hidden md:block">
            KDS 57 00 00 : 2022
          </div>
        </div>
      </header>

      {/* ── 모듈 탭 바 ── */}
      <div style={{ background: '#002244', borderBottom: '1px solid #001833' }} className="flex-shrink-0">
        <div className="max-w-screen-xl mx-auto px-4 flex">
          {MODULE_TABS.map((tab) => {
            const isActive = pathname === '/'
              ? false
              : pathname.startsWith(tab.matchBase)
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/80'
                }`}
                style={isActive ? { borderBottom: '2px solid #5599dd' } : { borderBottom: '2px solid transparent' }}
              >
                <span className={isActive ? 'text-white' : 'text-white/40'}>{tab.icon}</span>
                <span className="hidden sm:block">{tab.label}</span>
                <span className="sm:hidden">{tab.labelShort}</span>
                {tab.badge && (
                  <span className="text-xs px-1.5 py-0.5 rounded font-semibold"
                        style={{ background: '#f0a500', color: '#003366', fontSize: 9 }}>
                    {tab.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── structural 하위 내비 (구조안전성 탭에서만 표시) ── */}
      {activeModule?.id === 'structural' && (
        <div style={{ background: '#f0f7ff', borderBottom: '1px solid #dde8f5' }} className="flex-shrink-0">
          <div className="max-w-screen-xl mx-auto px-4 flex gap-1 py-1">
            {STRUCTURAL_NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white'
                  }`
                }
                style={({ isActive }) => isActive ? { background: '#003366' } : {}}
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* ── 모바일 드롭다운 메뉴 ── */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="absolute top-12 left-0 right-0"
            style={{ background: '#002244' }}
            onClick={(e) => e.stopPropagation()}
          >
            {MODULE_TABS.map((tab) => (
              <Link
                key={tab.id}
                to={tab.path}
                className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => setMobileMenuOpen(false)}
              >
                {tab.icon}
                <div>
                  <div className="font-medium">{tab.label}</div>
                  <div className="text-xs text-white/40">{tab.sub}</div>
                </div>
                {tab.badge && (
                  <span className="ml-auto text-xs px-1.5 py-0.5 rounded font-semibold"
                        style={{ background: '#f0a500', color: '#003366' }}>
                    {tab.badge}
                  </span>
                )}
              </Link>
            ))}
            {activeModule?.id === 'structural' && (
              <div style={{ borderTop: '1px solid #ffffff20', background: '#001833' }}>
                {STRUCTURAL_NAV.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className="block px-6 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/10"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 본문 ── */}
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-screen-xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
