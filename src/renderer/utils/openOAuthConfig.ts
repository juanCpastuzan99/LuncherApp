/**
 * Utilidad para abrir URLs de configuración de OAuth
 * Ayuda al usuario a configurar OAuth Client ID en Google Cloud Console
 */

/**
 * Obtiene el origen actual (puerto dinámico)
 */
function getCurrentOrigin(): string {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  // Fallback: usar puerto por defecto de Vite
  return 'http://localhost:3000';
}

export function openOAuthConfigUrls() {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  
  if (!projectId) {
    console.error('❌ VITE_FIREBASE_PROJECT_ID no está configurado en .env');
    const currentOrigin = getCurrentOrigin();
    return {
      message: 'Error: VITE_FIREBASE_PROJECT_ID no está configurado',
      urls: {},
      currentOrigin,
      instructions: {
        step1: 'Configura VITE_FIREBASE_PROJECT_ID en el archivo .env',
        step2: 'Obtén el Project ID desde Firebase Console > Configuración del proyecto',
        step3: 'Reinicia el servidor después de modificar .env'
      }
    };
  }
  const currentOrigin = getCurrentOrigin();

  const urls = {
    googleCloud: `https://console.cloud.google.com/apis/credentials?project=${projectId}`,
    firebaseAuth: `https://console.firebase.google.com/project/${projectId}/authentication/settings`,
    firebaseProviders: `https://console.firebase.google.com/project/${projectId}/authentication/providers`
  };

  // Abrir URLs en el navegador
  if (window.api && (window.api as any).openExternal) {
    // Usar Electron shell.openExternal si está disponible
    (window.api as any).openExternal(urls.googleCloud);
    setTimeout(() => {
      (window.api as any).openExternal(urls.firebaseAuth);
    }, 500);
    setTimeout(() => {
      (window.api as any).openExternal(urls.firebaseProviders);
    }, 1000);
  } else {
    // Fallback: usar window.open
    window.open(urls.googleCloud, '_blank');
    setTimeout(() => {
      window.open(urls.firebaseAuth, '_blank');
    }, 500);
    setTimeout(() => {
      window.open(urls.firebaseProviders, '_blank');
    }, 1000);
  }

  return {
    message: 'URLs de configuración abiertas en el navegador',
    urls,
    currentOrigin,
    instructions: {
      step1: `En Google Cloud Console, busca 'OAuth 2.0 Client IDs' y agrega ${currentOrigin} en Authorized JavaScript origins y Authorized redirect URIs`,
      step2: '💡 TIP: Puedes agregar múltiples puertos comunes (3000, 5173, 5174, 8080) para evitar reconfigurar',
      step3: 'En Firebase Console - Auth Settings, verifica que localhost esté en Authorized domains',
      step4: 'En Firebase Console - Sign-in Methods, verifica que Google esté habilitado',
      step5: 'Reinicia el servidor después de hacer cambios'
    }
  };
}

