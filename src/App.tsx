import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import InputPage from './pages/InputPage'
import ResultPage from './pages/ResultPage'
import ReportPage from './pages/ReportPage'
import ReferencePage from './pages/ReferencePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="input" element={<InputPage />} />
        <Route path="result" element={<ResultPage />} />
        <Route path="report" element={<ReportPage />} />
        <Route path="reference" element={<ReferencePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
