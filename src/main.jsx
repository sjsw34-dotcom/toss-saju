import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TDSMobileProvider } from '@toss/tds-mobile'
import './index.css'
import App from './App.jsx'

function getUserAgentVariables() {
  const ua = navigator.userAgent ?? '';
  return {
    fontA11y: undefined,
    fontScale: 1,
    isAndroid: /Android/i.test(ua),
    isIOS: /iPhone|iPad|iPod/i.test(ua),
    colorPreference: 'light',
    safeAreaBottomTransparency: undefined,
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TDSMobileProvider userAgent={getUserAgentVariables()} resetGlobalCss>
      <App />
    </TDSMobileProvider>
  </StrictMode>,
)
