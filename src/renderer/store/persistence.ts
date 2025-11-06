/**
 * Sistema de persistencia para Jotai
 * Sincroniza automáticamente con electron-store
 */

// Mapeo de atomos a sus claves de almacenamiento
export const STORAGE_KEYS = {
  apps: 'apps',
  favorites: 'favorites',
  launchHistory: 'history',
  pomodoroConfig: 'pomodoro.config',
  pomodoroState: 'pomodoro.state',
  flashcards: 'flashcards.list',
  notes: 'notes',
  todos: 'todos.list',
  snippets: 'snippets',
  quizzes: 'quizzes'
} as const;

/**
 * Carga datos desde electron-store
 */
export async function loadFromStorage(key: string, defaultValue: any): Promise<any> {
  if (!window.api?.getConfig) {
    console.warn('window.api.getConfig no disponible');
    return defaultValue;
  }

  try {
    const config = await window.api.getConfig();
    const keys = key.split('.');
    let value = config;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value !== undefined ? value : defaultValue;
  } catch (error) {
    console.error(`Error cargando ${key} desde storage:`, error);
    return defaultValue;
  }
}

/**
 * Guarda datos en electron-store
 */
export async function saveToStorage(key: string, value: any): Promise<void> {
  if (!window.api?.setConfig) {
    console.warn('window.api.setConfig no disponible');
    return;
  }

  try {
    const keys = key.split('.');
    if (keys.length === 1) {
      // Clave simple (ej: 'favorites', 'notes')
      await window.api.setConfig(keys[0], 'value', value);
    } else {
      // Clave anidada (ej: 'pomodoro.config', 'flashcards.list')
      const section = keys[0];
      const subKey = keys.slice(1).join('.');
      await window.api.setConfig(section, subKey, value);
    }
  } catch (error) {
    console.error(`Error guardando ${key} en storage:`, error);
  }
}

/**
 * Inicializa todos los atomos desde storage
 */
export async function initializeStore(): Promise<void> {
  console.log('📦 Inicializando store desde persistencia...');
  
  if (!window.api?.getConfig) {
    console.warn('⚠️ window.api no disponible, usando valores por defecto');
    return;
  }

  try {
    const config = await window.api.getConfig();
    console.log('✅ Config cargada desde storage:', Object.keys(config));
  } catch (error) {
    console.error('❌ Error inicializando store:', error);
  }
}

