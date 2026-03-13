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

// TDS 컴포넌트 에러를 잡아주는 내부 경계 (DEV 모드용)
class InnerErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
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
      // DEV 환경: TDS Provider 없이 앱 직접 렌더링
      if (import.meta.env.DEV) {
        return (
          <>
            <div style={{
              background: '#FF6B00', color: '#fff', padding: '8px 16px',
              fontSize: 12, textAlign: 'center', fontWeight: 700,
              position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
            }}>
              ⚠️ DEV 미리보기 — 토스 앱 아님 (결제·네이티브 기능 비활성)
            </div>
            <div style={{ paddingTop: 32 }}>
              <InnerErrorBoundary fallback={
                <div style={{ padding: 24, textAlign: 'center', color: '#8B95A1' }}>
                  TDS 컴포넌트 오류 — npm run dev:ait 로 확인하세요
                </div>
              }>
                <App />
              </InnerErrorBoundary>
            </div>
          </>
        );
      }
      // 프로덕션: 토스 앱에서만 이용 안내
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100dvh', background: '#F4F4F4',
          fontFamily: 'sans-serif', gap: '16px', padding: '24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '56px' }}>🔮</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#191F28' }}>
            사주 스포일러
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
