import { StrictMode, Component } from 'react'
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

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100dvh', background: '#F4F4F4',
          fontFamily: 'sans-serif', gap: '16px', padding: '24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '56px' }}>🔮</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#191F28' }}>
            운명테라피 사주
          </div>
          <div style={{ fontSize: '15px', color: '#8B95A1', lineHeight: '1.6' }}>
            이 서비스는 토스 앱에서만<br />이용할 수 있어요.
          </div>
          <a
            href="https://toss.im"
            style={{
              marginTop: '8px', padding: '14px 32px', background: '#3182F6',
              color: '#fff', borderRadius: '12px', fontSize: '15px',
              fontWeight: '600', textDecoration: 'none',
            }}
          >
            토스 앱 열기
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <TDSMobileProvider userAgent={getUserAgentVariables()} resetGlobalCss>
        <App />
      </TDSMobileProvider>
    </ErrorBoundary>
  </StrictMode>,
)
