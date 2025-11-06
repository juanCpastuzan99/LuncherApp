/**
 * Servicio de Autenticación Firebase
 */

import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  updateProfile,
  User
} from 'firebase/auth';
import { auth } from './config';

export class FirebaseAuth {
  private googleProvider: GoogleAuthProvider;

  constructor() {
    this.googleProvider = new GoogleAuthProvider();
    // Configurar permisos
    this.googleProvider.addScope('profile');
    this.googleProvider.addScope('email');
    // Configurar para que muestre el selector de cuenta siempre
    this.googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
  }

  /**
   * Verificar si hay un resultado de redirect pendiente
   * Útil cuando se usa signInWithRedirect
   */
  async checkRedirectResult(): Promise<User | null> {
    try {
      // Verificar que auth esté inicializado correctamente
      if (!auth || typeof auth !== 'object' || !('app' in auth)) {
        return null;
      }

      console.log('🔍 [checkRedirectResult] Verificando resultado de redirect...');
      const result = await getRedirectResult(auth);
      
      if (result && result.user) {
        console.log('✅ [checkRedirectResult] Autenticación con Google exitosa (redirect):', {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName
        });
        return result.user;
      } else {
        console.log('ℹ️ [checkRedirectResult] No hay resultado de redirect pendiente');
      }
      return null;
    } catch (error: any) {
      // No es un error crítico si no hay redirect pendiente
      if (error.code !== 'auth/operation-not-allowed' && error.code !== 'auth/internal-error') {
        console.warn('⚠️ [checkRedirectResult] Error verificando redirect:', error.message);
      }
      return null;
    }
  }

  /**
   * Iniciar sesión o registro con Google
   * Firebase crea automáticamente la cuenta si no existe
   */
  async signInWithGoogle(): Promise<User> {
    try {
      // Verificar que auth esté inicializado correctamente
      // Firebase Auth tiene propiedades específicas como 'app', 'currentUser', etc.
      const isAuthInitialized = auth && 
                                 typeof auth === 'object' && 
                                 'app' in auth && 
                                 auth.app !== null &&
                                 'currentUser' in auth;
      
      if (!isAuthInitialized) {
        console.error('❌ Firebase Auth no está inicializado correctamente');
        console.error('   Verifica que las variables de entorno estén configuradas en .env');
        console.error('   Verifica que el archivo .env esté en la raíz del proyecto');
        console.error('   Reinicia el servidor después de modificar .env');
        console.error('   Auth object:', auth);
        throw new Error('Firebase Auth no está configurado. Verifica las variables de entorno en .env y reinicia el servidor.');
      }

      // Verificar que el provider esté configurado
      if (!this.googleProvider) {
        console.error('❌ Google Provider no está configurado');
        throw new Error('Google Provider no está disponible');
      }

      // Verificar configuración de Firebase
      const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
      const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
      
      if (!authDomain || !apiKey) {
        console.error('❌ Variables de entorno faltantes:', {
          hasAuthDomain: !!authDomain,
          hasApiKey: !!apiKey
        });
        throw new Error('Configuración de Firebase incompleta. Verifica las variables de entorno.');
      }

      console.log('🔵 Iniciando autenticación con Google...');
      console.log('   Auth Domain:', authDomain);
      console.log('   API Key:', apiKey.substring(0, 10) + '...');
      
      // Usar redirect directamente - es más confiable y funciona mejor
      console.log('🔄 Usando método redirect (más confiable)...');
      console.log('   URL actual:', typeof window !== 'undefined' ? window.location.href : 'N/A');
      console.log('   Origin:', typeof window !== 'undefined' ? window.location.origin : 'N/A');
      
      // Verificar que auth no sea null antes de usar
      if (!auth || typeof auth !== 'object' || !('app' in auth)) {
        throw new Error('Firebase Auth no está inicializado. Verifica las variables de entorno en .env y reinicia el servidor.');
      }
      
      try {
        await signInWithRedirect(auth, this.googleProvider);
        
        // Con redirect, el usuario será redirigido y luego volverá
        // El resultado se obtendrá cuando regrese usando getRedirectResult
        console.log('✅ Redirección iniciada. El usuario será redirigido a Google...');
        console.log('   El usuario será redirigido y luego volverá automáticamente');
        
        // Retornar null para indicar que el redirect está en proceso
        // El componente verificará el resultado cuando regrese
        return null as any;
      } catch (redirectError: any) {
        console.warn('⚠️ Redirect falló, intentando popup como fallback...');
        console.warn('   Código de error:', redirectError.code);
        
        // Si redirect falla, intentar popup como último recurso
        // Auth ya está verificado arriba, así que es seguro usarlo
        try {
          const result = await signInWithPopup(auth, this.googleProvider);
          
          console.log('✅ Autenticación con Google exitosa (popup):', {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL
          });
          
          return result.user;
        } catch (popupError: any) {
          console.error('❌ Ambos métodos fallaron');
          console.error('   Popup error:', popupError.code, popupError.message);
          console.error('   Redirect error:', redirectError.code, redirectError.message);
          
          // Si ambos fallan, lanzar el error más descriptivo
          throw redirectError;
        }
      }
    } catch (error: any) {
      console.error('❌ Error al autenticar con Google:', error);
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      console.error('   Error stack:', error.stack);
      
      // Manejar errores específicos
      let errorMessage = 'Error al autenticar con Google';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'La ventana de autenticación fue cerrada. Intenta de nuevo.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'El popup fue bloqueado. Permite popups para este sitio en la configuración del navegador.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
      } else if (error.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        errorMessage = `Dominio no autorizado (${currentDomain}). Agrega este dominio en Firebase Console > Authentication > Settings > Authorized domains.`;
      } else if (error.code === 'auth/internal-error') {
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        console.warn('⚠️ Error interno de Firebase (puede ser normal si redirect está en proceso)');
        console.warn('   Si estás usando redirect, esto es normal y el usuario será redirigido');
        console.warn('   Si el error persiste después de volver del redirect, verifica:');
        console.warn('   1. Google Sign-In habilitado en Firebase Console');
        console.warn('   2. localhost en Authorized domains en Firebase');
        console.warn(`   3. OAuth Client ID con ${currentOrigin} en Authorized Redirect URIs`);
        console.warn('   4. Los cambios pueden tardar 5-30 minutos en aplicarse');
        errorMessage = 'Redirigiendo a Google para autenticación...';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Google Sign-In no está habilitado. Habilítalo en Firebase Console > Authentication > Sign-in method.';
      } else if (error.code === 'auth/api-key-not-valid' || error.code === 'auth/invalid-api-key') {
        console.error('❌ API Key de Firebase no válida');
        console.error('   Verifica que VITE_FIREBASE_API_KEY en .env sea correcta');
        console.error('   Obtén la API Key desde: Firebase Console > Configuración del proyecto > Tus aplicaciones');
        console.error('   Reinicia el servidor después de modificar .env');
        errorMessage = 'API Key de Firebase no válida. Verifica VITE_FIREBASE_API_KEY en el archivo .env y reinicia el servidor.';
      } else if (error.code === 'auth/configuration-not-found') {
        errorMessage = 'Configuración de Firebase no encontrada. Verifica las variables de entorno en .env y reinicia el servidor.';
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'Ya existe una cuenta con este email usando otro método de autenticación.';
      } else if (error.message) {
        // Si el mensaje contiene "api-key", mostrar mensaje más amigable
        if (error.message.includes('api-key') || error.message.includes('API key')) {
          errorMessage = 'API Key de Firebase no válida. Verifica VITE_FIREBASE_API_KEY en el archivo .env y reinicia el servidor.';
        } else {
          errorMessage = `Error de autenticación: ${error.message}`;
        }
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Iniciar sesión con email y contraseña
   */
  async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      // Verificar que auth esté inicializado
      if (!auth || typeof auth !== 'object' || !('app' in auth)) {
        throw new Error('Firebase Auth no está configurado. Verifica las variables de entorno en .env y reinicia el servidor.');
      }
      
      // Validaciones básicas
      if (!email || email.trim() === '') {
        throw new Error('El correo electrónico es requerido.');
      }
      
      if (!password || password === '') {
        throw new Error('La contraseña es requerida.');
      }
      
      const result = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      console.log('✅ Inicio de sesión exitoso:', result.user.email);
      return result.user;
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      
      // Traducir mensajes de error comunes
      let errorMessage = `Error de autenticación: ${error.message}`;
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No existe una cuenta con este correo electrónico.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El correo electrónico no es válido.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Esta cuenta ha sido deshabilitada.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos fallidos. Intenta más tarde.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Error de conexión. Verifica tu internet.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Correo electrónico o contraseña incorrectos.';
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Crear cuenta con email y contraseña
   * @param email - Correo electrónico del usuario
   * @param password - Contraseña del usuario
   * @param displayName - Nombre/apodo del usuario (opcional)
   */
  async signUpWithEmail(email: string, password: string, displayName?: string): Promise<User> {
    try {
      // Verificar que auth esté inicializado
      if (!auth || typeof auth !== 'object' || !('app' in auth)) {
        throw new Error('Firebase Auth no está configurado. Verifica las variables de entorno en .env y reinicia el servidor.');
      }
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Si se proporciona un displayName, actualizar el perfil del usuario
      if (displayName && displayName.trim()) {
        try {
          await updateProfile(result.user, {
            displayName: displayName.trim()
          });
          console.log('✅ Perfil actualizado con displayName:', displayName);
        } catch (profileError: any) {
          console.warn('⚠️ Error al actualizar perfil (no crítico):', profileError);
          // No lanzamos el error porque la cuenta ya se creó exitosamente
        }
      }
      
      return result.user;
    } catch (error: any) {
      console.error('Error al crear cuenta:', error);
      
      // Traducir mensajes de error comunes
      let errorMessage = `Error al crear cuenta: ${error.message}`;
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este correo electrónico ya está registrado. ¿Quieres iniciar sesión?';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El correo electrónico no es válido. Verifica que esté bien escrito.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es muy débil. Debe tener al menos 6 caracteres. Intenta usar mayúsculas, minúsculas y números.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'El registro con email/contraseña no está habilitado en Firebase. Contacta al administrador.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Error de conexión. Verifica tu internet e intenta de nuevo.';
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Cerrar sesión
   */
  async signOut(): Promise<void> {
    try {
      // Verificar que auth esté inicializado
      if (!auth || typeof auth !== 'object' || !('app' in auth)) {
        console.warn('⚠️ Firebase Auth no está inicializado. No se puede cerrar sesión.');
        return;
      }
      
      await signOut(auth);
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error);
      throw new Error(`Error al cerrar sesión: ${error.message}`);
    }
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): User | null {
    if (!auth || typeof auth !== 'object' || !('app' in auth)) {
      return null;
    }
    return auth.currentUser;
  }

  /**
   * Obtener ID del usuario actual
   */
  getCurrentUserId(): string | null {
    const user = this.getCurrentUser();
    return user ? user.uid : null;
  }

  /**
   * Verificar si hay un usuario autenticado
   */
  isAuthenticated(): boolean {
    if (!auth || typeof auth !== 'object' || !('app' in auth)) {
      return false;
    }
    return auth.currentUser !== null;
  }

  /**
   * Observar cambios en el estado de autenticación
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    if (!auth || typeof auth !== 'object' || !('app' in auth)) {
      // Retornar función no-op si auth no está inicializado
      console.warn('⚠️ Firebase Auth no está inicializado. onAuthStateChange no funcionará.');
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  }
}

export const firebaseAuth = new FirebaseAuth();

