/**
 * Ventana de Configuración Completa
 * Incluye autenticación, opciones y configuraciones de la app
 */

import React, { useState } from 'react';
import { FirebaseAuth } from './FirebaseAuth';
import './SettingsWindow.css';

interface SettingsWindowProps {
  onClose: () => void;
}

type SettingsTab = 'account' | 'general' | 'sync' | 'about';

export const SettingsWindow: React.FC<SettingsWindowProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  // Verificar si estamos en una ventana independiente (hash #settings indica ventana independiente)
  const isStandaloneWindow = window.location.hash === '#settings' || 
                             window.location.hash === '#/settings';

  // Manejar cierre con ESC solo si no es ventana independiente
  React.useEffect(() => {
    if (!isStandaloneWindow) {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [onClose, isStandaloneWindow]);

  // Manejar cierre de ventana independiente
  const handleCloseStandalone = React.useCallback(async () => {
    if (window.api?.closeSettingsWindow) {
      try {
        await window.api.closeSettingsWindow();
      } catch (error) {
        console.error('Error cerrando ventana:', error);
      }
    } else {
      // Fallback: cerrar con window.close si está disponible
      if (window.close) {
        window.close();
      }
    }
  }, []);

  // Si es ventana independiente, no mostrar overlay
  if (isStandaloneWindow) {
    return (
      <div className="settings-window-standalone">
        {/* Header */}
        <div className="settings-header">
          <h2 className="settings-title">Configuración</h2>
        </div>

        {/* Tabs */}
        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Cuenta
          </button>
          <button
            className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            General
          </button>
          <button
            className={`settings-tab ${activeTab === 'sync' ? 'active' : ''}`}
            onClick={() => setActiveTab('sync')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            Sincronización
          </button>
          <button
            className={`settings-tab ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
            Acerca de
          </button>
        </div>

        {/* Content */}
        <div className="settings-content">
          {activeTab === 'account' && (
            <div className="settings-section">
              <h3 className="settings-section-title">Cuenta y Autenticación</h3>
              <p className="settings-section-description">
                Inicia sesión para sincronizar tus datos entre dispositivos
              </p>
              <FirebaseAuth />
            </div>
          )}

          {activeTab === 'general' && (
            <div className="settings-section">
              <h3 className="settings-section-title">Configuración General</h3>
              
              <div className="settings-item">
                <div className="settings-item-label">
                  <label>Atajo de teclado</label>
                  <span className="settings-item-hint">Ctrl+Alt+Space</span>
                </div>
                <div className="settings-item-description">
                  Presiona este atajo para abrir/cerrar el launcher
                </div>
              </div>

              <div className="settings-item">
                <div className="settings-item-label">
                  <label>Mostrar sugerencias</label>
                </div>
                <div className="settings-item-description">
                  Muestra aplicaciones sugeridas cuando no hay búsqueda activa
                </div>
                <label className="settings-toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="settings-toggle-slider"></span>
                </label>
              </div>

              <div className="settings-item">
                <div className="settings-item-label">
                  <label>Historial de aplicaciones</label>
                </div>
                <div className="settings-item-description">
                  Guarda las aplicaciones que has abierto recientemente
                </div>
                <label className="settings-toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="settings-toggle-slider"></span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="settings-section">
              <h3 className="settings-section-title">Sincronización</h3>
              <p className="settings-section-description">
                Sincroniza tus datos entre dispositivos usando Firebase
              </p>
              
              <div className="settings-item">
                <div className="settings-item-label">
                  <label>Sincronización automática</label>
                </div>
                <div className="settings-item-description">
                  Sincroniza automáticamente tus datos cuando cambian
                </div>
                <label className="settings-toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="settings-toggle-slider"></span>
                </label>
              </div>

              <div className="settings-item">
                <div className="settings-item-label">
                  <label>Datos sincronizados</label>
                </div>
                <div className="settings-item-description">
                  <ul className="settings-sync-list">
                    <li>✓ Flashcards</li>
                    <li>✓ Notas</li>
                    <li>✓ Todos</li>
                    <li>✓ Snippets de código</li>
                    <li>✓ Quizzes</li>
                    <li>✓ Estadísticas de Pomodoro</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="settings-section">
              <h3 className="settings-section-title">Acerca de</h3>
              
              <div className="settings-about">
                <div className="settings-about-logo">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h4>Dev Launcher</h4>
                <p>Versión 1.0.0</p>
                <p className="settings-about-description">
                  Un launcher de aplicaciones para desarrolladores con funciones avanzadas
                  de búsqueda, gestión de ventanas y sincronización multi-dispositivo.
                </p>
                
                <div className="settings-about-features">
                  <h5>Características principales:</h5>
                  <ul>
                    <li>🔍 Búsqueda inteligente de aplicaciones</li>
                    <li>📝 Gestión de notas, todos y flashcards</li>
                    <li>⏱️ Pomodoro timer</li>
                    <li>💻 Snippets de código</li>
                    <li>📊 Quizzes educativos</li>
                    <li>☁️ Sincronización en la nube</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Modal normal (para ventana principal)
  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-window" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-header">
          <h2 className="settings-title">Configuración</h2>
          <button 
            className="settings-close-btn"
            onClick={onClose}
            aria-label="Cerrar configuración"
            title="Cerrar (Esc)"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Cuenta
          </button>
          <button
            className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            General
          </button>
          <button
            className={`settings-tab ${activeTab === 'sync' ? 'active' : ''}`}
            onClick={() => setActiveTab('sync')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            Sincronización
          </button>
          <button
            className={`settings-tab ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
            Acerca de
          </button>
        </div>

        {/* Content */}
        <div className="settings-content">
          {activeTab === 'account' && (
            <div className="settings-section">
              <h3 className="settings-section-title">Cuenta y Autenticación</h3>
              <p className="settings-section-description">
                Inicia sesión para sincronizar tus datos entre dispositivos
              </p>
              <FirebaseAuth />
            </div>
          )}

          {activeTab === 'general' && (
            <div className="settings-section">
              <h3 className="settings-section-title">Configuración General</h3>
              
              <div className="settings-item">
                <div className="settings-item-label">
                  <label>Atajo de teclado</label>
                  <span className="settings-item-hint">Ctrl+Alt+Space</span>
                </div>
                <div className="settings-item-description">
                  Presiona este atajo para abrir/cerrar el launcher
                </div>
              </div>

              <div className="settings-item">
                <div className="settings-item-label">
                  <label>Mostrar sugerencias</label>
                </div>
                <div className="settings-item-description">
                  Muestra aplicaciones sugeridas cuando no hay búsqueda activa
                </div>
                <label className="settings-toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="settings-toggle-slider"></span>
                </label>
              </div>

              <div className="settings-item">
                <div className="settings-item-label">
                  <label>Historial de aplicaciones</label>
                </div>
                <div className="settings-item-description">
                  Guarda las aplicaciones que has abierto recientemente
                </div>
                <label className="settings-toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="settings-toggle-slider"></span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="settings-section">
              <h3 className="settings-section-title">Sincronización</h3>
              <p className="settings-section-description">
                Sincroniza tus datos entre dispositivos usando Firebase
              </p>
              
              <div className="settings-item">
                <div className="settings-item-label">
                  <label>Sincronización automática</label>
                </div>
                <div className="settings-item-description">
                  Sincroniza automáticamente tus datos cuando cambian
                </div>
                <label className="settings-toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="settings-toggle-slider"></span>
                </label>
              </div>

              <div className="settings-item">
                <div className="settings-item-label">
                  <label>Datos sincronizados</label>
                </div>
                <div className="settings-item-description">
                  <ul className="settings-sync-list">
                    <li>✓ Flashcards</li>
                    <li>✓ Notas</li>
                    <li>✓ Todos</li>
                    <li>✓ Snippets de código</li>
                    <li>✓ Quizzes</li>
                    <li>✓ Estadísticas de Pomodoro</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="settings-section">
              <h3 className="settings-section-title">Acerca de</h3>
              
              <div className="settings-about">
                <div className="settings-about-logo">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h4>Dev Launcher</h4>
                <p>Versión 1.0.0</p>
                <p className="settings-about-description">
                  Un launcher de aplicaciones para desarrolladores con funciones avanzadas
                  de búsqueda, gestión de ventanas y sincronización multi-dispositivo.
                </p>
                
                <div className="settings-about-features">
                  <h5>Características principales:</h5>
                  <ul>
                    <li>🔍 Búsqueda inteligente de aplicaciones</li>
                    <li>📝 Gestión de notas, todos y flashcards</li>
                    <li>⏱️ Pomodoro timer</li>
                    <li>💻 Snippets de código</li>
                    <li>📊 Quizzes educativos</li>
                    <li>☁️ Sincronización en la nube</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

