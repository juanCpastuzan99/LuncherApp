/**
 * Main Entry Point - Dev Launcher
 * 
 * Este es el punto de entrada principal de la aplicación React.
 * Incluye error handling, performance monitoring y optimizaciones.
 * 
 * @version 2.0.0
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// ============================================
// ERROR BOUNDARY COMPONENT
// ============================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log to external service in production
    if (process.env.NODE_ENV === 'production' && window.electronAPI?.logError) {
      window.electronAPI.logError({
        type: 'react-error',
        message: error.message,
        stack: error.stack ?? undefined,
        componentStack: errorInfo.componentStack ?? undefined,
        timestamp: Date.now()
      });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '2rem',
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
          color: 'white',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '600px',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 600 }}>
              Algo salió mal
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              La aplicación encontró un error inesperado. Puedes intentar recargar o reportar el problema.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                textAlign: 'left',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                cursor: 'pointer'
              }}>
                <summary style={{ 
                  marginBottom: '0.5rem', 
                  fontWeight: 600,
                  color: '#ef4444' 
                }}>
                  Detalles del error (solo en desarrollo)
                </summary>
                <pre style={{
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  color: '#fca5a5',
                  lineHeight: 1.4,
                  margin: 0
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#5568d3'}
                onMouseOut={(e) => e.currentTarget.style.background = '#667eea'}
              >
                🔄 Recargar App
              </button>
              
              <button
                onClick={this.handleReset}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              >
                ↻ Reintentar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================
// PERFORMANCE MONITORING
// ============================================

function reportWebVitals() {
  if (process.env.NODE_ENV === 'development') {
    // Dynamic import with type safety
    // Note: web-vitals v3+ uses onCLS, onFCP, etc. instead of getCLS, getFID, etc.
    import('web-vitals').then((module) => {
      const { onCLS, onFCP, onLCP, onTTFB, onINP } = module;
      onCLS(console.log);
      onFCP(console.log);
      onLCP(console.log);
      onTTFB(console.log);
      onINP(console.log);
    }).catch(() => {
      // web-vitals not available, skip silently
    });
  }
}

// ============================================
// ROOT MOUNTING WITH SAFETY CHECKS
// ============================================

function mountApp() {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('❌ Root element not found!');
    document.body.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: #1a1a2e;
        color: white;
        font-family: system-ui;
        text-align: center;
        padding: 2rem;
      ">
        <div>
          <h1 style="font-size: 2rem; margin-bottom: 1rem;">⚠️ Error Crítico</h1>
          <p style="color: rgba(255, 255, 255, 0.7);">
            No se pudo inicializar la aplicación.<br>
            Por favor, contacta al soporte técnico.
          </p>
        </div>
      </div>
    `;
    return;
  }

  try {
    const root = ReactDOM.createRoot(rootElement);
    
    // Render with Error Boundary
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );

    console.log('✅ React app mounted successfully');

    // Report web vitals
    reportWebVitals();

  } catch (error) {
    console.error('❌ Failed to mount React app:', error);
    
    // Fallback UI
    rootElement.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        text-align: center;
        padding: 2rem;
      ">
        <div>
          <div style="font-size: 3rem; margin-bottom: 1rem;">💥</div>
          <h1 style="font-size: 1.5rem; margin-bottom: 1rem;">Error al iniciar</h1>
          <p style="color: rgba(255, 255, 255, 0.7); margin-bottom: 1.5rem;">
            No se pudo cargar la aplicación.<br>
            Intenta recargar la página.
          </p>
          <button 
            onclick="window.location.reload()"
            style="
              padding: 0.75rem 1.5rem;
              background: #667eea;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 1rem;
              font-weight: 600;
              cursor: pointer;
            "
          >
            🔄 Recargar
          </button>
        </div>
      </div>
    `;
  }
}

// ============================================
// DEVELOPMENT HELPERS
// ============================================

if (process.env.NODE_ENV === 'development') {
  // Log React version
  console.log(`⚛️ React version: ${React.version}`);
  
  // Warn about performance issues
  if (typeof window !== 'undefined') {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn('⚠️ Long task detected:', entry.duration.toFixed(2) + 'ms');
        }
      }
    });
    
    try {
      observer.observe({ entryTypes: ['longtask'] });
    } catch {
      // longtask not supported
    }
  }

  // Enable React DevTools profiling
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.inject?.({ profilerMode: true });
  }
}

// ============================================
// HOT MODULE REPLACEMENT (HMR)
// ============================================

if (import.meta.hot) {
  import.meta.hot.accept();
  
  import.meta.hot.dispose(() => {
    console.log('🔥 Hot reload triggered');
  });
}

// ============================================
// INITIALIZE APP
// ============================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}

// ============================================
// GLOBAL ERROR HANDLERS (Backup)
// ============================================

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  // Prevent infinite error loops
  if (event.message.includes('ResizeObserver') || 
      event.message.includes('Loading chunk')) {
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Log to analytics in production
  if (process.env.NODE_ENV === 'production' && window.electronAPI?.logError) {
    window.electronAPI.logError({
      type: 'unhandled-rejection',
      message: event.reason?.message || 'Unhandled promise rejection',
      stack: event.reason?.stack ?? undefined,
      timestamp: Date.now()
    });
  }
});

// ============================================
// TYPE DECLARATIONS
// ============================================

declare global {
  interface Window {
    electronAPI?: {
      logError?: (error: {
        type?: string;
        message: string;
        stack?: string;
        componentStack?: string;
        timestamp: number;
      }) => void;
    };
  }
}

export {};