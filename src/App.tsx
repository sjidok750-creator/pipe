import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import SessionAutoSaver from './components/SessionAutoSaver'
import Home from './pages/Home'
import StructuralOverviewPage  from './pages/StructuralOverviewPage'
import InputPage from './pages/InputPage'
import ResultPage from './pages/ResultPage'
import ReportPage from './pages/ReportPage'
import ReferencePage from './pages/ReferencePage'

import SeismicPrelimOverviewPage from './pages/seismic-prelim/OverviewPage'
import SeismicPrelimInputPage    from './pages/seismic-prelim/InputPage'
import SeismicPrelimResultPage   from './pages/seismic-prelim/ResultPage'
import SeismicPrelimReportPage   from './pages/seismic-prelim/ReportPage'

import SeismicDetailOverviewPage from './pages/seismic-detail/OverviewPage'
import SeismicDetailInputPage    from './pages/seismic-detail/InputPage'
import SeismicDetailResultPage   from './pages/seismic-detail/ResultPage'
import SeismicDetailReportPage   from './pages/seismic-detail/ReportPage'

export default function App() {
  return (
    <>
    <SessionAutoSaver />
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />

        {/* 관로 구조안전성 검토 */}
        <Route path="structural">
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview"  element={<StructuralOverviewPage />} />
          <Route path="input"     element={<InputPage />} />
          <Route path="result"    element={<ResultPage />} />
          <Route path="report"    element={<ReportPage />} />
          <Route path="reference" element={<ReferencePage />} />
        </Route>

        {/* 내진성능 예비평가 */}
        <Route path="seismic-prelim">
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<SeismicPrelimOverviewPage />} />
          <Route path="input"    element={<SeismicPrelimInputPage />} />
          <Route path="result"   element={<SeismicPrelimResultPage />} />
          <Route path="report"   element={<SeismicPrelimReportPage />} />
        </Route>

        {/* 내진성능 상세평가 */}
        <Route path="seismic-detail">
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<SeismicDetailOverviewPage />} />
          <Route path="input"    element={<SeismicDetailInputPage />} />
          <Route path="result"   element={<SeismicDetailResultPage />} />
          <Route path="report"   element={<SeismicDetailReportPage />} />
        </Route>

        {/* 구 경로 호환 */}
        <Route path="input"     element={<Navigate to="/structural/input" replace />} />
        <Route path="result"    element={<Navigate to="/structural/result" replace />} />
        <Route path="report"    element={<Navigate to="/structural/report" replace />} />
        <Route path="reference" element={<Navigate to="/structural/reference" replace />} />
        <Route path="seismic-prelim-old" element={<Navigate to="/seismic-prelim/overview" replace />} />
        <Route path="seismic-detail-old" element={<Navigate to="/seismic-detail/overview" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
    </>
  )
}
