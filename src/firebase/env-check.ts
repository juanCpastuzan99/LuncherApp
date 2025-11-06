/**
 * Utilidad para verificar y cargar variables de entorno de Firebase
 * Asegura que las variables estén disponibles en el proceso de renderizado
 */

/**
 * Verifica que todas las variables de entorno de Firebase estén disponibles
 */
export function verifyFirebaseEnv(): {
  isValid: boolean;
  missing: string[];
  values: Record<string, string | undefined>;
} {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  const missing: string[] = [];
  const values: Record<string, string | undefined> = {};

  for (const varName of requiredVars) {
    const value = import.meta.env[varName];
    values[varName] = value;

    if (!value || value.trim() === '' || value.startsWith('tu-')) {
      missing.push(varName);
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
    values
  };
}

/**
 * Imprime un reporte detallado de las variables de entorno
 */
export function printEnvReport(): void {
  const verification = verifyFirebaseEnv();

  console.group('🔍 Verificación de Variables de Entorno Firebase');
  console.log('Estado:', verification.isValid ? '✅ Todas las variables están configuradas' : '❌ Faltan variables');
  
  console.log('\n📋 Variables:');
  Object.entries(verification.values).forEach(([key, value]) => {
    const status = verification.missing.includes(key) ? '❌' : '✅';
    const displayValue = value 
      ? (key === 'VITE_FIREBASE_API_KEY' 
          ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}` 
          : value)
      : 'NO ENCONTRADO';
    console.log(`  ${status} ${key}: ${displayValue}`);
  });

  if (verification.missing.length > 0) {
    console.log('\n⚠️ Variables faltantes:');
    verification.missing.forEach(varName => {
      console.log(`  - ${varName}`);
    });
    console.log('\n💡 Solución:');
    console.log('  1. Verifica que el archivo .env existe en la raíz del proyecto');
    console.log('  2. Verifica que todas las variables empiezan con VITE_');
    console.log('  3. Reinicia el servidor después de modificar .env');
    console.log('  4. Verifica que envDir está configurado en vite.config.ts');
  }

  console.groupEnd();
}

/**
 * Obtiene las variables de entorno como objeto de configuración
 */
export function getFirebaseEnvConfig(): {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
} {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
  };
}

