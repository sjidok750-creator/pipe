import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import SplashScreen from './components/SplashScreen'
import './styles/index.css'
import { runStartup } from './lib/startup.js'

// Synchronously restore last session + run migrations before any component mounts
runStartup()

function Root() {
  // 스플래시는 브라우저 세션당 1회만 표시 (새로고침·페이지 이동 시 재표시 방지)
  const [splashDone, setSplashDone] = useState(() => {
    try { return sessionStorage.getItem('piper:splashSeen') === '1' } catch { return false }
  })

  const handleContinue = () => {
    try { sessionStorage.setItem('piper:splashSeen', '1') } catch { /* ignore */ }
    setSplashDone(true)
  }

  if (!splashDone) {
    return <SplashScreen onContinue={handleContinue} />
  }

  return (
    <BrowserRouter basename="/pipe">
      <App />
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
