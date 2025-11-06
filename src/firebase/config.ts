/**
 * Configuración de Firebase
 * Variables de entorno en .env:
 * VITE_FIREBASE_API_KEY
 * VITE_FIREBASE_AUTH_DOMAIN
 * VITE_FIREBASE_PROJECT_ID
 * VITE_FIREBASE_STORAGE_BUCKET
 * VITE_FIREBASE_MESSAGING_SENDER_ID
 * VITE_FIREBASE_APP_ID
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { verifyFirebaseEnv, printEnvReport, getFirebaseEnvConfig } from './env-check';

// Función para validar variables de entorno
function validateEnvVars(): { isValid: boolean; missing: string[] } {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  const missing: string[] = [];

  for (const varName of requiredVars) {
    const value = import.meta.env[varName];
    if (!value || value.trim() === '' || value.startsWith('tu-')) {
      missing.push(varName);
    }
  }

  return {
    isValid: missing.length === 0,
    missing
  };
}

// Verificar variables de entorno al cargar el módulo
if (typeof window !== 'undefined') {
  console.log('%c🔥 FIREBASE CONFIGURATION', 'color: #FF6B6B; font-size: 16px; font-weight: bold;');
  console.log('🔍 [Firebase Config] Iniciando verificación de Firebase...');
  console.log('🔍 [Firebase Config] Verificando si estamos en el navegador:', typeof window !== 'undefined');
  console.log('🔍 [Firebase Config] Vite env disponible:', typeof import.meta.env !== 'undefined');
  
  // Ejecutar verificación inmediatamente
  const envCheck = verifyFirebaseEnv();
  
  console.log('%c📊 VERIFICACIÓN DE VARIABLES', 'color: #4ECDC4; font-size: 14px; font-weight: bold;');
  console.log('🔍 [Firebase Config] Verificación completada:', {
    isValid: envCheck.isValid,
    missingCount: envCheck.missing.length,
    missing: envCheck.missing
  });
  
  if (import.meta.env.DEV) {
    // En desarrollo, mostrar reporte detallado
    printEnvReport();
    
    // También mostrar información adicional
    console.log('📦 [Firebase Config] Información del entorno:');
    console.log('  - Modo:', import.meta.env.MODE);
    console.log('  - Dev:', import.meta.env.DEV);
    console.log('  - Base URL:', import.meta.env.BASE_URL);
    console.log('  - Vite disponible:', typeof import.meta.env !== 'undefined');
    
    // Mostrar todas las variables de entorno relacionadas con Firebase
    console.log('%c📋 VARIABLES DE ENTORNO', 'color: #95E1D3; font-size: 14px; font-weight: bold;');
    console.log('🔍 [Firebase Config] Variables de entorno detectadas:');
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    console.log('  - VITE_FIREBASE_API_KEY:', apiKey ? `✅ Existe (${apiKey.substring(0, 10)}...)` : '❌ No existe');
    if (apiKey && !apiKey.startsWith('AIza')) {
      console.error('     ⚠️ ADVERTENCIA: API Key no empieza con "AIza" - debe empezar con "AIzaSy..."');
    }
    console.log('  - VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? `✅ ${import.meta.env.VITE_FIREBASE_AUTH_DOMAIN}` : '❌ No existe');
    console.log('  - VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID ? `✅ ${import.meta.env.VITE_FIREBASE_PROJECT_ID}` : '❌ No existe');
    console.log('  - VITE_FIREBASE_STORAGE_BUCKET:', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? '✅ Existe' : '❌ No existe');
    console.log('  - VITE_FIREBASE_MESSAGING_SENDER_ID:', import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '✅ Existe' : '❌ No existe');
    console.log('  - VITE_FIREBASE_APP_ID:', import.meta.env.VITE_FIREBASE_APP_ID ? '✅ Existe' : '❌ No existe');
  }
  
  if (!envCheck.isValid) {
    console.error('%c❌ ERROR DE CONFIGURACIÓN', 'color: #FF6B6B; font-size: 14px; font-weight: bold;');
    console.error('❌ [Firebase Config] Variables de entorno faltantes o incorrectas');
    console.error('   Verifica que el archivo .env existe y está en la raíz del proyecto');
    console.error('   Ruta esperada: parcial/.env');
    console.error('   Reinicia el servidor después de crear/modificar .env');
    console.error('');
    console.error('📋 Variables faltantes:');
    envCheck.missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
  } else {
    console.log('%c✅ CONFIGURACIÓN CORRECTA', 'color: #51CF66; font-size: 14px; font-weight: bold;');
    console.log('✅ [Firebase Config] Todas las variables de entorno están presentes');
  }
}

// Configuración de Firebase (usar variables de entorno)
// Usar la función helper para obtener las variables de forma segura
const firebaseConfig = getFirebaseEnvConfig();

// Inicializar Firebase de forma segura (con manejo de errores)
let app: ReturnType<typeof initializeApp> | null = null;
let dbInstance: ReturnType<typeof getFirestore> | null = null;
let authInstance: ReturnType<typeof getAuth> | null = null;

function initializeFirebase() {
  if (app && dbInstance && authInstance) {
    return { app, db: dbInstance, auth: authInstance };
  }

  try {
    // Validar variables de entorno
    const validation = validateEnvVars();
    
    if (!validation.isValid) {
      console.error('❌ Firebase no está configurado correctamente.');
      console.error('⚠️ Variables de entorno faltantes o vacías:');
      validation.missing.forEach(varName => {
        console.error(`   - ${varName}`);
      });
      console.error('💡 Solución: Verifica que el archivo .env existe y contiene todas las variables.');
      console.error('   Reinicia el servidor después de modificar .env (npm run dev)');
      throw new Error(`Firebase config missing: ${validation.missing.join(', ')}`);
    }

    // Verificar que las variables críticas no estén vacías
    const hasConfig = firebaseConfig.apiKey && 
                      firebaseConfig.projectId && 
                      firebaseConfig.authDomain;
    
    if (!hasConfig) {
      console.error('❌ Firebase: Configuración incompleta.');
      console.error('   Verifica que apiKey, projectId y authDomain estén configurados.');
      throw new Error('Firebase config incomplete');
    }

    // Validar formato de API Key (debe empezar con AIza)
    if (firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('AIza')) {
      console.error('❌ Firebase: API Key tiene formato incorrecto.');
      console.error('   La API Key debe empezar con "AIza"');
      console.error('   Obtén la API Key correcta desde: Firebase Console > Configuración del proyecto > Tus aplicaciones');
      throw new Error('Firebase API Key format invalid');
    }

    // Inicializar Firebase
    app = initializeApp(firebaseConfig);
    dbInstance = getFirestore(app);
    authInstance = getAuth(app);
    
    console.log('✅ Firebase inicializado correctamente');
    console.log(`   Proyecto: ${firebaseConfig.projectId}`);
    console.log(`   Auth Domain: ${firebaseConfig.authDomain}`);
    
    return { app, db: dbInstance, auth: authInstance };
  } catch (error: any) {
    console.error('❌ Error al inicializar Firebase:', error.message);
    // Retornar null para indicar que Firebase no está disponible
    // La app debe manejar esto gracefully
    return { app: null, db: null, auth: null };
  }
}

// Inicializar Firebase de forma segura
// Solo inicializar en el navegador, no durante el build de Vite
if (typeof window !== 'undefined') {
  console.log('%c🚀 INICIALIZANDO FIREBASE', 'color: #FFD93D; font-size: 16px; font-weight: bold;');
  console.log('🔍 [Firebase Config] Intentando inicializar Firebase...');
  try {
    const { app: appInstance, db: dbInst, auth: authInst } = initializeFirebase();
    if (appInstance) app = appInstance;
    if (dbInst) dbInstance = dbInst;
    if (authInst) authInstance = authInst;
    
    // Verificar que la inicialización fue exitosa
    if (!appInstance || !dbInst || !authInst) {
      console.warn('%c⚠️ INICIALIZACIÓN INCOMPLETA', 'color: #FFA500; font-size: 14px; font-weight: bold;');
      console.warn('⚠️ [Firebase Config] Firebase no se inicializó correctamente. Algunas funciones pueden no estar disponibles.');
      console.warn('   Esto generalmente significa que las variables de entorno no están configuradas.');
      console.warn('   Verifica que el archivo .env existe en la raíz del proyecto.');
      console.warn('   💡 Reinicia el servidor después de modificar .env (npm run dev)');
    } else {
      console.log('%c✅ FIREBASE INICIALIZADO', 'color: #51CF66; font-size: 16px; font-weight: bold;');
      console.log('✅ [Firebase Config] Firebase inicializado correctamente');
      console.log('   Proyecto:', firebaseConfig.projectId);
      console.log('   Auth Domain:', firebaseConfig.authDomain);
      console.log('   Firebase está listo para usar! 🔥');
    }
  } catch (error: any) {
    // Mostrar errores durante la inicialización
    console.error('%c❌ ERROR DE INICIALIZACIÓN', 'color: #FF6B6B; font-size: 14px; font-weight: bold;');
    console.error('❌ [Firebase Config] Firebase no pudo inicializarse:', error?.message || error);
    console.error('   Stack:', error?.stack);
  }
} else {
  // En el servidor (SSR) o durante el build, no inicializar
  if (import.meta.env.DEV) {
    console.log('ℹ️ [Firebase Config] Firebase no se inicializa durante el build (no estamos en el navegador)');
  }
}

// Exportar instancias - usar null si no están inicializados para detectar errores
// Esto permite que Vite compile sin errores incluso si Firebase no está configurado
export const db = dbInstance || null;
export const auth = authInstance || null;

// Conectar a emuladores en desarrollo (opcional)
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    if (dbInstance && authInstance) {
      connectFirestoreEmulator(dbInstance, 'localhost', 8080);
      connectAuthEmulator(authInstance, 'http://localhost:9099');
      console.log('🔥 Firebase emulators conectados');
    }
  } catch (error: any) {
    if (error?.message?.includes('already been connected')) {
      console.log('ℹ️ Emuladores ya conectados');
    } else {
      console.warn('⚠️ No se pudieron conectar los emuladores:', error?.message);
    }
  }
}

export default app;

