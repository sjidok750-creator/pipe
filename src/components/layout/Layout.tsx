import React, { useState } from 'react'
import { Outlet, NavLink, useLocation, Link } from 'react-router-dom'
import { T } from '../eng/tokens'
import { useProjectStore } from '../../store/useProjectStore.js'
import NewProjectModal from '../NewProjectModal'
import WIcon from '../WIcon'

const PIXEL_FONT = T.fontBrand

const MODULE_TABS = [
  { id: 'structural',    path: '/structural/overview',    matchBase: '/structural',    label: '관로 구조안전성 검토', sub: 'KDS 57 10 00' },
  { id: 'seismic-prelim',path: '/seismic-prelim/overview',matchBase: '/seismic-prelim', label: '내진성능 예비평가',   sub: 'KDS 57 17 00' },
  { id: 'seismic-detail', path: '/seismic-detail/overview',matchBase: '/seismic-detail', label: '내진성능 상세평가',   sub: 'KDS 57 17 00' },
]

const SUBNAV_MAP: Record<string, { to: string; label: string }[]> = {
  'structural':    [
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

  const { projectName, isDirty, lastSavedAt, save, setProjectName, openNewModal } = useProjectStore()
  const hasProject = projectName.length > 0

  const savedTimeLabel = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: T.bgApp, fontFamily: T.fontSans }}>

      {/* ── 최상단 헤더 ── */}
      <header style={{ background: T.bgHeader, flexShrink: 0 }}>
        <div style={{
          maxWidth: 960, margin: '0 auto', padding: '0 16px',
          height: 40, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <button
            style={{ display: 'none', padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: T.textOnDark }}
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(v => !v)}
          >
            ☰
          </button>

          {/* 로고 */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', flexShrink: 0 }}>
            <WIcon size={24} id="nav" />
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: '#FFE600', letterSpacing: 1 }}>STEP-</span>
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: '#44AAFF', letterSpacing: 1 }}>PIPE</span>
          </Link>

          <span style={{ fontSize: T.fs.xs, color: T.textOnDarkMuted, fontFamily: T.fontMono, flexShrink: 0 }}>
            KDS 57 00 00
          </span>

          {/* 프로젝트명 + 저장 상태 */}
          {pathname !== '/' && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              {hasProject ? (
                <input
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="프로젝트명"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: T.radiusSm,
                    color: T.textOnDark,
                    fontSize: T.fs.sm,
                    padding: '4px 10px',
                    fontFamily: T.fontSans,
                    maxWidth: 180, outline: 'none',
                    height: 28,
                    touchAction: 'manipulation',
                  }}
                />
              ) : (
                <button
                  onClick={openNewModal}
                  style={{
                    background: 'rgba(255,255,255,0.10)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: T.radiusSm,
                    color: T.textOnDarkMuted,
                    fontSize: T.fs.xs,
                    padding: '4px 12px',
                    height: 28,
                    cursor: 'pointer',
                    fontFamily: T.fontSans,
                    touchAction: 'manipulation',
                  }}
                >
                  + 프로젝트
                </button>
              )}

              {isDirty ? (
                <button
                  onClick={() => save()}
                  style={{
                    background: T.bgWarn,
                    border: `1px solid ${T.borderWarn}`,
                    borderRadius: T.radiusSm,
                    color: T.textWarn,
                    fontSize: T.fs.xs,
                    fontWeight: T.fw.bold,
                    padding: '4px 12px',
                    height: 28,
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                  }}
                >
                  저장
                </button>
              ) : savedTimeLabel ? (
                <span style={{ fontSize: T.fs.xs, color: T.textOnDarkMuted, fontFamily: T.fontSans }}>
                  저장됨 {savedTimeLabel}
                </span>
              ) : null}
            </div>
          )}
        </div>
      </header>

      {/* ── 모듈 탭바 ── */}
      <div className="no-print" style={{ background: T.bgHeaderDeep, borderBottom: `1px solid rgba(0,0,0,0.25)`, flexShrink: 0 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px', display: 'flex' }}>
          {MODULE_TABS.map(tab => {
            const isActive = pathname !== '/' && pathname.startsWith(tab.matchBase)
            return (
              <Link
                key={tab.id}
                to={tab.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '0 14px', height: T.tabH,
                  fontSize: T.fs.sm, fontFamily: T.fontSans,
                  color: isActive ? T.textOnDark : T.textOnDarkMuted,
                  fontWeight: isActive ? T.fw.semibold : T.fw.regular,
                  textDecoration: 'none',
                  borderBottom: isActive ? `2px solid #5599DD` : '2px solid transparent',
                  transition: 'color 120ms',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: T.fs.xs, opacity: 0.55 }}>{tab.sub}</span>
                <span>{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── 하위 탭 ── */}
      {subNav && (
        <div className="no-print" style={{ background: T.bgPanel, borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px', display: 'flex' }}>
            {subNav.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                style={({ isActive }) => ({
                  display: 'inline-flex', alignItems: 'center',
                  padding: '0 16px', height: 34,
                  fontSize: T.fs.sm,
                  fontFamily: T.fontSans,
                  fontWeight: isActive ? T.fw.semibold : T.fw.regular,
                  color: isActive ? T.bgActive : T.textMuted,
                  textDecoration: 'none',
                  borderBottom: isActive ? `2px solid ${T.bgActive}` : '2px solid transparent',
                  background: 'transparent',
                  transition: 'color 120ms',
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
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: T.bgScrim }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            style={{ background: T.bgHeader, position: 'absolute', top: 40, left: 0, right: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {MODULE_TABS.map(tab => (
              <Link
                key={tab.id} to={tab.path}
                style={{
                  display: 'block', padding: '12px 16px',
                  color: T.textOnDark, textDecoration: 'none',
                  fontSize: T.fs.base, fontFamily: T.fontSans,
                  borderBottom: `1px solid rgba(255,255,255,0.08)`,
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div style={{ fontWeight: T.fw.semibold }}>{tab.label}</div>
                <div style={{ fontSize: T.fs.xs, color: T.textOnDarkMuted, marginTop: 2 }}>{tab.sub}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── 본문 ── */}
      <main style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>

      <NewProjectModal />
    </div>
  )
}
