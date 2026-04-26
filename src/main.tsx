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
  const [splashDone, setSplashDone] = useState(false)

  if (!splashDone) {
    return <SplashScreen onContinue={() => setSplashDone(true)} />
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
