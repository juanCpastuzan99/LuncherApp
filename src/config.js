/**
 * Módulo de configuración con persistencia usando electron-store
 * Guarda: favoritos, historial, hotkeys, tema, preferencias de UI
 */

let Store;
let store;

// Inicializar store de forma asíncrona (electron-store es ES Module)
async function initStore() {
  if (!Store) {
    const electronStore = await import('electron-store');
    Store = electronStore.default;
    store = new Store({
      name: 'win11-launcher-config',
      defaults: getDefaults()
    });
  }
  return store;
}

function getDefaults() {
  return {
    // Favoritos
    favorites: [],
    
    // Historial de búsquedas (últimas 50)
    searchHistory: [],
    
    // Historial de aplicaciones lanzadas (últimas 20)
    launchHistory: [],
    
    // Hotkeys personalizados
    hotkeys: {
      openLauncher: 'Ctrl+Space',
      tileWindows: 'Ctrl+Alt+T',
      moveWindowLeft: 'Ctrl+Alt+H',
      moveWindowRight: 'Ctrl+Alt+L',
      centerWindow: 'Ctrl+Alt+C',
      maximizeWindow: 'Ctrl+Alt+M',
      minimizeWindow: 'Ctrl+Alt+N',
      switchWorkspaceNext: 'Ctrl+Alt+Right',
      switchWorkspacePrev: 'Ctrl+Alt+Left'
    },
    
    // Preferencias de UI
    ui: {
      theme: 'dark', // dark, light, auto
      windowWidth: 720,
      windowHeight: 400,
      maxResults: 10,
      showPath: true,
      animationSpeed: 'normal' // fast, normal, slow
    },
    
    // Configuración de escaneo
    scan: {
      includeUWP: true,
      includeRegistry: true,
      includeLocalApps: true,
      includeStartMenu: true,
      scanInterval: 3600000 // 1 hora en ms
    },
    
    // Configuración de ventanas
    windowManagement: {
      gap: 10,
      enableTiling: true,
      enableFloating: true,
      defaultLayout: 'grid' // grid, vertical, horizontal
    }
  };
}

class ConfigManager {
  constructor() {
    this._storeReady = false;
    this._initPromise = null;
  }
  
  async _ensureStore() {
    if (!this._storeReady) {
      if (!this._initPromise) {
        this._initPromise = initStore().then(s => {
          store = s;
          this._storeReady = true;
          return s;
        });
      }
      await this._initPromise;
    }
    return store;
  }
  
  _getStoreSync() {
    if (!this._storeReady) {
      throw new Error('Store not initialized. Call async method first or use sync methods after init.');
    }
    return store;
  }
  // Favoritos
  addFavorite(appId) {
    const favorites = this.getFavorites();
    if (!favorites.includes(appId)) {
      favorites.push(appId);
      this._getStoreSync().set('favorites', favorites);
    }
  }
  
  removeFavorite(appId) {
    const favorites = this.getFavorites();
    this._getStoreSync().set('favorites', favorites.filter(id => id !== appId));
  }
  
  getFavorites() {
    return this._getStoreSync().get('favorites', []);
  }
  
  isFavorite(appId) {
    return this.getFavorites().includes(appId);
  }
  
  // Historial de búsqueda
  addSearchHistory(query) {
    if (!query || query.trim().length === 0) return;
    
    const history = this.getSearchHistory();
    // Eliminar duplicados
    const filtered = history.filter(h => h.toLowerCase() !== query.toLowerCase());
    // Agregar al inicio
    filtered.unshift(query.trim());
    // Limitar a 50
    const limited = filtered.slice(0, 50);
    this._getStoreSync().set('searchHistory', limited);
  }
  
  getSearchHistory() {
    return this._getStoreSync().get('searchHistory', []);
  }
  
  clearSearchHistory() {
    this._getStoreSync().set('searchHistory', []);
  }
  
  // Historial de lanzamientos
  addLaunchHistory(app) {
    const history = this.getLaunchHistory();
    // Eliminar duplicados del mismo app
    const filtered = history.filter(h => h.id !== app.id);
    // Agregar al inicio
    filtered.unshift({
      id: app.id,
      name: app.name,
      path: app.path,
      timestamp: Date.now()
    });
    // Limitar a 20
    const limited = filtered.slice(0, 20);
    this._getStoreSync().set('launchHistory', limited);
  }
  
  getLaunchHistory() {
    return this._getStoreSync().get('launchHistory', []);
  }
  
  clearLaunchHistory() {
    this._getStoreSync().set('launchHistory', []);
  }
  
  // Hotkeys
  getHotkeys() {
    return this._getStoreSync().get('hotkeys');
  }
  
  setHotkey(key, value) {
    const hotkeys = this.getHotkeys();
    hotkeys[key] = value;
    this._getStoreSync().set('hotkeys', hotkeys);
  }
  
  setHotkeys(newHotkeys) {
    this._getStoreSync().set('hotkeys', { ...this.getHotkeys(), ...newHotkeys });
  }
  
  // UI
  getUI() {
    return this._getStoreSync().get('ui');
  }
  
  setUI(key, value) {
    const ui = this.getUI();
    ui[key] = value;
    this._getStoreSync().set('ui', ui);
  }
  
  // Scan
  getScanConfig() {
    return this._getStoreSync().get('scan');
  }
  
  setScanConfig(key, value) {
    const scan = this.getScanConfig();
    scan[key] = value;
    this._getStoreSync().set('scan', scan);
  }
  
  // Window Management
  getWindowConfig() {
    return this._getStoreSync().get('windowManagement');
  }
  
  setWindowConfig(key, value) {
    const config = this.getWindowConfig();
    config[key] = value;
    this._getStoreSync().set('windowManagement', config);
  }
  
  // Reset toda la configuración
  reset() {
    this._getStoreSync().clear();
  }
  
  // Exportar configuración
  export() {
    return this._getStoreSync().store;
  }
  
  // Importar configuración
  import(data) {
    try {
      Object.keys(data).forEach(key => {
        this._getStoreSync().set(key, data[key]);
      });
      return true;
    } catch (e) {
      console.error('Error importing config:', e);
      return false;
    }
  }
}

const configManager = new ConfigManager();

// Inicializar store al cargar el módulo
initStore().then(s => {
  store = s;
  configManager._storeReady = true;
}).catch(err => {
  console.error('Error inicializando store:', err);
});

module.exports = configManager;

