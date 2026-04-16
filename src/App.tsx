import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import InputPage from './pages/InputPage'
import ResultPage from './pages/ResultPage'
import ReportPage from './pages/ReportPage'
import ReferencePage from './pages/ReferencePage'
import SeismicPrelimPage from './pages/SeismicPrelimPage'
import SeismicDetailPage from './pages/SeismicDetailPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />

        {/* 관로 구조안전성 검토 */}
        <Route path="structural">
          <Route index element={<Navigate to="input" replace />} />
          <Route path="input"     element={<InputPage />} />
          <Route path="result"    element={<ResultPage />} />
          <Route path="report"    element={<ReportPage />} />
          <Route path="reference" element={<ReferencePage />} />
        </Route>

        {/* 내진성능 예비평가 */}
        <Route path="seismic-prelim" element={<SeismicPrelimPage />} />

        {/* 내진성능 상세평가 */}
        <Route path="seismic-detail" element={<SeismicDetailPage />} />

        {/* 구 경로 호환 리다이렉트 */}
        <Route path="input"     element={<Navigate to="/structural/input" replace />} />
        <Route path="result"    element={<Navigate to="/structural/result" replace />} />
        <Route path="report"    element={<Navigate to="/structural/report" replace />} />
        <Route path="reference" element={<Navigate to="/structural/reference" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
