/**
 * Componente de Autenticación Firebase
 * Permite iniciar sesión para habilitar sincronización multi-dispositivo
 */

import React, { useState, useEffect } from 'react';
import { firebaseAuth } from '../../firebase/auth';
import type { User } from 'firebase/auth';
import './FirebaseAuth.css';

interface FirebaseAuthProps {
  initialAction?: 'login' | 'signup';
}

export const FirebaseAuth: React.FC<FirebaseAuthProps> = ({ initialAction = 'login' }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true); // Estado separado para carga de auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(initialAction === 'signup');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar estado de autenticación al montar
    let unsubscribe: (() => void) | null = null;
    let isMounted = true;
    let authChecked = false;
    let quickTimeout: NodeJS.Timeout | null = null;

    // Verificar si hay un resultado de redirect pendiente
    const checkRedirect = async () => {
      try {
        const redirectUser = await firebaseAuth.checkRedirectResult();
        if (redirectUser && isMounted) {
          setUser(redirectUser);
          finishLoading();
          return true;
        }
      } catch (error: any) {
        console.error('Error verificando redirect:', error);
      }
      return false;
    };
    
    // Verificar si Firebase está configurado
    const isFirebaseConfigured = () => {
      try {
        // Verificar variables de entorno directamente
        const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
        const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
        const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
        
        // Debug en desarrollo
        if (import.meta.env.DEV) {
          console.log('🔍 [FirebaseAuth] Verificando configuración:', {
            hasApiKey: !!apiKey,
            hasProjectId: !!projectId,
            hasAuthDomain: !!authDomain,
            apiKeyLength: apiKey?.length || 0,
            projectId: projectId || 'NO ENCONTRADO',
            authDomain: authDomain || 'NO ENCONTRADO'
          });
        }
        
        // Verificar que las variables críticas existan y no estén vacías
        if (!apiKey || !projectId || !authDomain) {
          if (import.meta.env.DEV) {
            console.warn('⚠️ [FirebaseAuth] Variables faltantes:', {
              apiKey: !apiKey,
              projectId: !projectId,
              authDomain: !authDomain
            });
          }
          return false;
        }
        
        if (apiKey.trim() === '' || projectId.trim() === '' || authDomain.trim() === '') {
          if (import.meta.env.DEV) {
            console.warn('⚠️ [FirebaseAuth] Variables vacías');
          }
          return false;
        }
        
        // Verificar que no sean valores placeholder
        if (apiKey.startsWith('tu-') || projectId.startsWith('tu-') || authDomain.startsWith('tu-')) {
          if (import.meta.env.DEV) {
            console.warn('⚠️ [FirebaseAuth] Variables con valores placeholder');
          }
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('❌ [FirebaseAuth] Error al verificar configuración:', error);
        return false;
      }
    };
    
    // Función para finalizar la carga
    const finishLoading = () => {
      if (isMounted && !authChecked) {
        authChecked = true;
        setAuthLoading(false);
        setLoading(false);
      }
    };
    
    // Verificar configuración primero
    const configured = isFirebaseConfigured();
    
    if (!configured) {
      console.warn('⚠️ Firebase no está configurado. Verifica las variables de entorno en .env');
      console.warn('   Reinicia el servidor después de modificar .env (npm run dev)');
      finishLoading();
      setError('Firebase no está configurado. Verifica las variables de entorno en .env y reinicia el servidor.');
    } else {
      // Solo inicializar Firebase si está configurado
      // Timeout de seguridad corto (1 segundo)
      const timeoutId = setTimeout(() => {
        if (!authChecked) {
          console.warn('⚠️ Firebase Auth timeout - mostrando formulario');
          finishLoading();
        }
      }, 1000); // 1 segundo máximo
      
      const initializeAuth = async () => {
        try {
          // PRIMERO: Verificar si hay un resultado de redirect (muy importante)
          const hasRedirect = await checkRedirect();
          if (hasRedirect) {
            console.log('✅ [FirebaseAuth] Redirect detectado y procesado');
            clearTimeout(timeoutId);
            return;
          }

          // SEGUNDO: Obtener usuario actual inmediatamente si está disponible
          const currentUser = firebaseAuth.getCurrentUser();
          if (currentUser && isMounted) {
            console.log('✅ [FirebaseAuth] Usuario ya autenticado:', currentUser.email);
            setUser(currentUser);
            finishLoading();
            clearTimeout(timeoutId);
            return;
          }

          // TERCERO: Si no hay usuario, mostrar formulario y suscribirse a cambios
          quickTimeout = setTimeout(() => {
            if (!authChecked) {
              finishLoading();
            }
          }, 300);
          
          // Suscribirse a cambios de autenticación
          unsubscribe = firebaseAuth.onAuthStateChange((user) => {
            console.log('🔄 [Auth State Change] Usuario:', user ? user.email : 'null');
            
            if (quickTimeout) {
              clearTimeout(quickTimeout);
            }
            if (isMounted) {
              setUser(user);
              // Asegurar que loading se resetee cuando hay cambio de auth
              setLoading(false);
              console.log('✅ [Auth State Change] Estado actualizado, loading resetado');
              finishLoading();
              clearTimeout(timeoutId);
            }
          });
        } catch (error: any) {
          console.error('❌ [FirebaseAuth] Error al inicializar auth:', error);
          finishLoading();
        }
      };

      initializeAuth();
    }

    return () => {
      isMounted = false;
      // Limpiar timeouts solo si existen
      if (quickTimeout) {
        clearTimeout(quickTimeout);
      }
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleGoogleSignIn = async () => {
    // Ref para mantener el timeout y poder limpiarlo
    let loadingTimeoutRef: NodeJS.Timeout | null = null;
    let redirectCheckTimeoutRef: NodeJS.Timeout | null = null;
    
    try {
      setError(null);
      setLoading(true);
      console.log('🔵 [Google Sign In] Iniciando autenticación...');
      
      // Timeout de seguridad para evitar que se quede pegado
      loadingTimeoutRef = setTimeout(() => {
        console.warn('⚠️ [Google Sign In] Timeout de 30 segundos. Reseteando estado...');
        setLoading(false);
        setError('La autenticación está tardando demasiado. Verifica tu conexión e intenta de nuevo.');
      }, 30000); // 30 segundos máximo
      
      try {
        const user = await firebaseAuth.signInWithGoogle();
        
        // Limpiar timeout principal si la autenticación completa
        if (loadingTimeoutRef) {
          clearTimeout(loadingTimeoutRef);
          loadingTimeoutRef = null;
        }
        
        // Si retorna null, significa que está usando redirect
        if (user === null) {
          console.log('🔄 [Google Sign In] Redirección iniciada. El usuario será redirigido a Google...');
          // No mostrar error, el redirect está funcionando
          // El listener de auth state change detectará cuando el usuario regrese
          // No resetear loading - se reseteará cuando el usuario regrese
          return;
        }
        
        // Si hay usuario (popup exitoso), el listener debería detectarlo
        if (user) {
          console.log('✅ [Google Sign In] Autenticación exitosa (popup). Usuario:', user.email);
          // Verificar inmediatamente si el listener ya actualizó el estado
          // Si no, resetear manualmente después de un breve delay
          setTimeout(() => {
            // Solo resetear si aún estamos en loading (el listener puede no haber activado aún)
            setLoading((prevLoading) => {
              if (prevLoading) {
                console.log('🔄 [Google Sign In] Reseteando loading manualmente (popup exitoso)');
                return false;
              }
              return prevLoading;
            });
          }, 500);
        }
      } catch (authError: any) {
        // Limpiar timeouts si hay error
        if (loadingTimeoutRef) {
          clearTimeout(loadingTimeoutRef);
        }
        if (redirectCheckTimeoutRef) {
          clearTimeout(redirectCheckTimeoutRef);
        }
        
        console.error('❌ [Google Sign In] Error en signInWithGoogle:', authError);
        throw authError;
      }
    } catch (err: any) {
      console.error('❌ [Google Sign In] Error completo:', err);
      
      // Limpiar todos los timeouts
      if (loadingTimeoutRef) {
        clearTimeout(loadingTimeoutRef);
      }
      if (redirectCheckTimeoutRef) {
        clearTimeout(redirectCheckTimeoutRef);
      }
      
      // Mostrar mensaje de error más amigable
      let errorMessage = err.message || 'Error al autenticar con Google';
      
      // Traducir mensajes comunes
      if (errorMessage.includes('popup-closed-by-user') || err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Autenticación cancelada. Intenta de nuevo.';
      } else if (errorMessage.includes('popup-blocked') || err.code === 'auth/popup-blocked') {
        errorMessage = 'El navegador bloqueó la ventana. Permite popups para este sitio.';
      } else if (errorMessage.includes('network') || err.code === 'auth/network-request-failed') {
        errorMessage = 'Error de conexión. Verifica tu internet.';
      } else if (errorMessage.includes('Redirigiendo') || errorMessage.includes('redirect')) {
        // No mostrar error si está redirigiendo - es normal
        console.log('🔄 [Google Sign In] Redirección en proceso, no mostrar error');
        return;
      } else if (err.code === 'auth/internal-error' && errorMessage.includes('redirect')) {
        // No mostrar error si es internal-error durante redirect
        console.log('🔄 [Google Sign In] Error interno durante redirect (normal), no mostrar al usuario');
        return;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const validateEmail = (email: string): { isValid: boolean; error?: string } => {
    if (!email || email.trim() === '') {
      return { isValid: false, error: 'El correo electrónico es requerido.' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { isValid: false, error: 'Por favor ingresa un correo electrónico válido.' };
    }
    
    return { isValid: true };
  };

  const validatePassword = (password: string, isSignUp: boolean): { isValid: boolean; error?: string; strength?: 'weak' | 'medium' | 'strong' } => {
    if (!password || password === '') {
      return { isValid: false, error: 'La contraseña es requerida.' };
    }
    
    if (isSignUp) {
      if (password.length < 6) {
        return { isValid: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
      }
      
      // Evaluar fortaleza de contraseña
      let strength: 'weak' | 'medium' | 'strong' = 'weak';
      if (password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
        strength = 'strong';
      } else if (password.length >= 6 && (/[a-z]/.test(password) || /[A-Z]/.test(password)) && /[0-9]/.test(password)) {
        strength = 'medium';
      }
      
      return { isValid: true, strength };
    }
    
    return { isValid: true };
  };

  const handleEmailSignIn = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Validaciones para registro
      if (isSignUp) {
        // Validar apodo
        if (!displayName || displayName.trim() === '') {
          setError('El apodo es requerido.');
          setLoading(false);
          return;
        }
        
        if (displayName.trim().length < 2) {
          setError('El apodo debe tener al menos 2 caracteres.');
          setLoading(false);
          return;
        }
        
        if (displayName.trim().length > 50) {
          setError('El apodo no puede tener más de 50 caracteres.');
          setLoading(false);
          return;
        }
        
        // Validar email
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
          setError(emailValidation.error!);
          setLoading(false);
          return;
        }
        
        // Validar contraseña
        const passwordValidation = validatePassword(password, true);
        if (!passwordValidation.isValid) {
          setError(passwordValidation.error!);
          setLoading(false);
          return;
        }
        
        // Validar confirmación de contraseña
        if (!confirmPassword || confirmPassword === '') {
          setError('Por favor confirma tu contraseña.');
          setLoading(false);
          return;
        }
        
        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden. Verifica que ambas sean iguales.');
          setLoading(false);
          return;
        }
        
        // Intentar crear cuenta
        try {
          await firebaseAuth.signUpWithEmail(email.trim().toLowerCase(), password, displayName.trim());
          console.log('✅ Cuenta creada exitosamente');
          // El usuario se establecerá automáticamente a través del listener
        } catch (signUpError: any) {
          // Los errores ya están traducidos en auth.ts
          throw signUpError;
        }
      } else {
        // Validaciones para login
        if (!email || email.trim() === '') {
          setError('Por favor ingresa tu correo electrónico.');
          setLoading(false);
          return;
        }
        
        if (!password || password === '') {
          setError('Por favor ingresa tu contraseña.');
          setLoading(false);
          return;
        }
        
        // Validar formato de email básico
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
          setError(emailValidation.error!);
          setLoading(false);
          return;
        }
        
        // Intentar iniciar sesión
        try {
          await firebaseAuth.signInWithEmail(email.trim().toLowerCase(), password);
          console.log('✅ Inicio de sesión exitoso');
          // El usuario se establecerá automáticamente a través del listener
        } catch (signInError: any) {
          // Traducir mensajes de error comunes de Firebase
          let errorMessage = signInError.message || 'Error al iniciar sesión';
          
          if (signInError.code === 'auth/user-not-found') {
            errorMessage = 'No existe una cuenta con este correo electrónico. ¿Quieres crear una cuenta?';
          } else if (signInError.code === 'auth/wrong-password') {
            errorMessage = 'Contraseña incorrecta. ¿Olvidaste tu contraseña?';
          } else if (signInError.code === 'auth/invalid-email') {
            errorMessage = 'El correo electrónico no es válido.';
          } else if (signInError.code === 'auth/user-disabled') {
            errorMessage = 'Esta cuenta ha sido deshabilitada. Contacta al soporte.';
          } else if (signInError.code === 'auth/too-many-requests') {
            errorMessage = 'Demasiados intentos fallidos. Intenta más tarde o restablece tu contraseña.';
          } else if (signInError.code === 'auth/network-request-failed') {
            errorMessage = 'Error de conexión. Verifica tu internet.';
          }
          
          throw new Error(errorMessage);
        }
      }
    } catch (err: any) {
      setError(err.message || (isSignUp ? 'Error al crear la cuenta' : 'Error al iniciar sesión'));
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setError(null);
      await firebaseAuth.signOut();
      console.log('✅ Sesión cerrada');
    } catch (err: any) {
      setError(err.message || 'Error al cerrar sesión');
      console.error('Error:', err);
    }
  };

  // Mostrar loading solo si está verificando y no hay error
  // Si hay error, mostrar el formulario con el error
  if (authLoading && !user && loading && !error) {
    return (
      <div className="firebase-auth">
        <div className="auth-loading">Verificando autenticación...</div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="firebase-auth">
        <div className="auth-user-info">
          <div className="user-avatar">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" />
            ) : (
              <div className="avatar-placeholder">
                {user.email?.[0].toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="user-details">
            <div className="user-name">{user.displayName || user.email}</div>
            <div className="sync-status">
              <span className="sync-indicator">🟢</span>
              Sincronización activa
            </div>
          </div>
          <button className="auth-btn sign-out" onClick={handleSignOut}>
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="firebase-auth">
      <div className="auth-container">
        <h3 className="auth-title">
          {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
        </h3>
        <p className="auth-description">
          {isSignUp 
            ? 'Crea una cuenta para sincronizar tus datos entre dispositivos'
            : 'Inicia sesión para sincronizar tus datos entre dispositivos'}
        </p>

        {error && (
          <div className="auth-error">
            {error}
            {(error.includes('Error interno de Firebase') || 
              error.includes('OAuth Client ID') || 
              error.includes('auth/internal-error') ||
              error.includes('redirect')) && (
              <div style={{ marginTop: '15px', fontSize: '0.9em', lineHeight: '1.6' }}>
                <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                  📋 Pasos para configurar:
                </div>
                <ol style={{ marginLeft: '20px', marginBottom: '15px', textAlign: 'left' }}>
                  <li style={{ marginBottom: '8px' }}>
                    <button
                      onClick={() => {
                        const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
                        if (!projectId) {
                          console.error('❌ VITE_FIREBASE_PROJECT_ID no está configurado en .env');
                          return;
                        }
                        const url = `https://console.firebase.google.com/project/${projectId}/authentication/providers`;
                        if (window.api && (window.api as any).openExternal) {
                          (window.api as any).openExternal(url);
                        } else {
                          window.open(url, '_blank');
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#1a73e8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85em',
                        marginRight: '8px'
                      }}
                    >
                      Verificar Google Sign-In
                    </button>
                    Verifica que Google esté habilitado en Firebase Console
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <button
                      onClick={() => {
                        const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
                        if (!projectId) {
                          console.error('❌ VITE_FIREBASE_PROJECT_ID no está configurado en .env');
                          return;
                        }
                        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
                        const url = `https://console.cloud.google.com/apis/credentials?project=${projectId}`;
                        if (window.api && (window.api as any).openExternal) {
                          (window.api as any).openExternal(url);
                        } else {
                          window.open(url, '_blank');
                        }
                        // Mostrar instrucciones adicionales
                        setTimeout(() => {
                          alert(`INSTRUCCIONES:\n\n1. Busca "OAuth 2.0 Client IDs" en la lista\n2. Haz clic en el que dice "Web client (auto created...)"\n3. En "Authorized JavaScript origins" agrega:\n   ${currentOrigin}\n   http://localhost:5173\n   http://localhost:5174\n\n4. En "Authorized redirect URIs" agrega:\n   ${currentOrigin}\n   http://localhost:5173\n   http://localhost:5174\n\n5. Guarda y espera 5-10 minutos`);
                        }, 500);
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#ea4335',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85em',
                        marginRight: '8px'
                      }}
                    >
                      🔧 Configurar OAuth Client ID
                    </button>
                    Agrega <code style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '3px' }}>{typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}</code> en Authorized JavaScript origins y Authorized redirect URIs
                    <br />
                    <small style={{ opacity: 0.8, fontSize: '0.85em', display: 'block', marginTop: '4px' }}>
                      💡 TIP: Puedes agregar múltiples puertos comunes (3000, 5173, 5174, 8080) para que funcione con cualquier puerto
                    </small>
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    Reinicia el servidor después de hacer cambios
                  </li>
                </ol>
                <div style={{ fontSize: '0.8em', opacity: 0.8, marginTop: '10px', padding: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                  💡 Usa el mismo login de Firebase para acceder a Google Cloud Console (es gratis)
                </div>
                <div style={{ fontSize: '0.75em', opacity: '0.7', marginTop: '8px', fontStyle: 'italic' }}>
                  ⏱️ Los cambios en Google Cloud Console pueden tardar 5-30 minutos en aplicarse
                </div>
              </div>
            )}
          </div>
        )}

        <div className="auth-methods">
          {/* Google Sign In - Funciona tanto para login como registro */}
          <button
            className="auth-btn google"
            onClick={handleGoogleSignIn}
            disabled={loading}
            title="Inicia sesión o crea una cuenta con Google"
          >
            <svg className="google-icon" width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <g fill="#000" fillRule="evenodd">
                <path d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z" fill="#EA4335"/>
                <path d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.21 1.18-.84 2.18-1.79 2.91l2.84 2.2c2.02-1.86 3.18-4.6 3.18-7.61z" fill="#4285F4"/>
                <path d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9.008 9.008 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z" fill="#FBBC05"/>
                <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.4-1.57-5.12-3.74L.96 13.04C2.45 15.98 5.48 18 9 18z" fill="#34A853"/>
              </g>
            </svg>
            {loading ? 'Conectando...' : 'Continuar con Google'}
          </button>

          <div className="auth-divider">
            <span>o</span>
          </div>

          {/* Email/Password */}
          <div className="auth-email-form">
            {isSignUp && (
              <input
                type="text"
                placeholder="Apodo (nombre de usuario)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="auth-input"
                disabled={loading}
                maxLength={50}
              />
            )}
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              disabled={loading}
            />
            {isSignUp && (
              <input
                type="password"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input"
                disabled={loading}
              />
            )}
            <button
              className="auth-btn email"
              onClick={handleEmailSignIn}
              disabled={
                loading || 
                !email || 
                !password || 
                (isSignUp && (!confirmPassword || !displayName))
              }
            >
              {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
            </button>
            <button
              className="auth-toggle"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                // Limpiar campos al cambiar de modo
                setPassword('');
                setConfirmPassword('');
                setDisplayName('');
              }}
              disabled={loading}
            >
              {isSignUp
                ? '¿Ya tienes cuenta? Inicia sesión'
                : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

