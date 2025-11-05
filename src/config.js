/**
 * Módulo de configuración con persistencia
 * Compatible con desarrollo y producción
 * Incluye: favoritos, historial, flashcards, notas, pomodoro, hotkeys, UI
 * Fallback automático a fs si electron-store no está disponible
 */

const { app } = require('electron');
const path = require('path');
const fs = require('fs');

// ============================================================================
// CONFIGURACIÓN POR DEFECTO
// ============================================================================

function getDefaults() {
  return {
    // Favoritos
    favorites: [],
    
    // Historial de búsquedas (últimas 50)
    searchHistory: [],
    
    // Historial de aplicaciones lanzadas (últimas 20)
    launchHistory: [],
    
    // Tarjetas de estudio (Flashcards)
    flashcards: [],
    
    // Notas educativas
    notes: [],
    
    // Sesiones de estudio
    studySessions: [],
    
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
      theme: 'dark',
      windowWidth: 720,
      windowHeight: 400,
      maxResults: 10,
      showPath: true,
      animationSpeed: 'normal'
    },
    
    // Configuración de escaneo
    scan: {
      includeUWP: true,
      includeRegistry: true,
      includeLocalApps: true,
      includeStartMenu: true,
      scanInterval: 3600000
    },
    
    // Configuración de ventanas
    windowManagement: {
      gap: 10,
      enableTiling: true,
      enableFloating: true,
      defaultLayout: 'grid'
    },
    
    // Estado del Pomodoro
    pomodoro: {
      state: 'idle',
      timeRemaining: 0,
      currentPomodoro: 0,
      totalPomodoros: 0,
      phase: 'work',
      startedAt: null,
      pausedAt: null,
      pausedDuration: 0,
      // Configuración de tiempos (en segundos)
      workDuration: 25 * 60,
      shortBreakDuration: 5 * 60,
      longBreakDuration: 15 * 60,
      pomodorosUntilLongBreak: 4
    }
  };
}

// ============================================================================
// STORAGE BACKEND
// ============================================================================

class StorageBackend {
  constructor() {
    this.useElectronStore = false;
    this.store = null;
    this.configPath = null;
    this.config = getDefaults();
    this.initialized = false;
  }
  
  async init() {
    if (this.initialized) return;
    
    try {
      const electronStore = await import('electron-store');
      this.store = new electronStore.default({
        name: 'win11-launcher-config',
        defaults: getDefaults(),
        clearInvalidConfig: true
      });
      this.useElectronStore = true;
      this.config = this.store.store;
      console.log('✅ Using electron-store');
    } catch (error) {
      console.warn('⚠️ Fallback to fs');
      this.useElectronStore = false;
      this.setupFsBackend();
      this.loadFromFs();
    }
    
    this.initialized = true;
  }
  
  setupFsBackend() {
    try {
      const userDataPath = app.getPath('userData');
      this.configPath = path.join(userDataPath, 'config.json');
      
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }
    } catch (error) {
      console.error('Error setup fs:', error);
      this.configPath = path.join(app.getPath('temp'), 'win11-launcher-config.json');
    }
  }
  
  loadFromFs() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        const parsed = JSON.parse(data);
        this.config = this.deepMerge(getDefaults(), parsed);
        console.log('✅ Config loaded from fs');
      } else {
        this.config = getDefaults();
        this.saveToFs();
      }
    } catch (error) {
      console.error('Error loading config:', error);
      this.config = getDefaults();
    }
  }
  
  saveToFs() {
    try {
      const data = JSON.stringify(this.config, null, 2);
      fs.writeFileSync(this.configPath, data, 'utf-8');
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      return false;
    }
  }
  
  deepMerge(target, source) {
    const output = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        output[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    }
    
    return output;
  }
  
  get(key, defaultValue) {
    if (!this.initialized) return defaultValue;
    
    if (this.useElectronStore) {
      return this.store.get(key, defaultValue);
    }
    
    const keys = key.split('.');
    let value = this.config;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }
    
    return value !== undefined ? value : defaultValue;
  }
  
  set(key, value) {
    if (!this.initialized) return false;
    
    if (this.useElectronStore) {
      this.store.set(key, value);
      return true;
    }
    
    const keys = key.split('.');
    let target = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in target) || typeof target[k] !== 'object') {
        target[k] = {};
      }
      target = target[k];
    }
    
    target[keys[keys.length - 1]] = value;
    return this.saveToFs();
  }
  
  getAll() {
    if (this.useElectronStore) {
      return this.store.store;
    }
    return { ...this.config };
  }
  
  clear() {
    if (this.useElectronStore) {
      this.store.clear();
    } else {
      this.config = getDefaults();
      this.saveToFs();
    }
  }
}

// ============================================================================
// CONFIG MANAGER
// ============================================================================

class ConfigManager {
  constructor() {
    this.storage = new StorageBackend();
    this.initPromise = null;
    this.ready = false;
  }
  
  async init() {
    if (this.ready) return;
    
    if (!this.initPromise) {
      this.initPromise = this.storage.init().then(() => {
        this.ready = true;
        console.log('✅ ConfigManager ready');
      }).catch(error => {
        console.error('❌ ConfigManager failed:', error);
        this.ready = true;
      });
    }
    
    return this.initPromise;
  }
  
  _ensureReady() {
    if (!this.ready) {
      console.warn('ConfigManager not ready');
    }
  }
  
  // ==========================================================================
  // FAVORITOS
  // ==========================================================================
  
  addFavorite(appId) {
    this._ensureReady();
    if (!appId || typeof appId !== 'string') return false;
    
    const favorites = this.getFavorites();
    if (!favorites.includes(appId)) {
      favorites.push(appId);
      return this.storage.set('favorites', favorites);
    }
    return true;
  }
  
  removeFavorite(appId) {
    this._ensureReady();
    const favorites = this.getFavorites();
    return this.storage.set('favorites', favorites.filter(id => id !== appId));
  }
  
  getFavorites() {
    this._ensureReady();
    const favorites = this.storage.get('favorites', []);
    return Array.isArray(favorites) ? favorites : [];
  }
  
  isFavorite(appId) {
    return this.getFavorites().includes(appId);
  }
  
  // ==========================================================================
  // HISTORIAL DE BÚSQUEDA
  // ==========================================================================
  
  addSearchHistory(query) {
    this._ensureReady();
    if (!query || typeof query !== 'string' || query.trim().length < 2) return false;
    
    const trimmed = query.trim();
    if (trimmed.length > 100) return false;
    
    const history = this.getSearchHistory();
    const filtered = history.filter(h => h.toLowerCase() !== trimmed.toLowerCase());
    filtered.unshift(trimmed);
    
    return this.storage.set('searchHistory', filtered.slice(0, 50));
  }
  
  getSearchHistory() {
    this._ensureReady();
    const history = this.storage.get('searchHistory', []);
    return Array.isArray(history) ? history : [];
  }
  
  clearSearchHistory() {
    this._ensureReady();
    return this.storage.set('searchHistory', []);
  }
  
  // ==========================================================================
  // HISTORIAL DE LANZAMIENTOS
  // ==========================================================================
  
  addLaunchHistory(app) {
    this._ensureReady();
    if (!app || !app.id || !app.name) return false;
    
    const history = this.getLaunchHistory();
    const filtered = history.filter(h => h.id !== app.id);
    
    filtered.unshift({
      id: app.id,
      name: app.name,
      path: app.path || '',
      timestamp: Date.now()
    });
    
    return this.storage.set('launchHistory', filtered.slice(0, 20));
  }
  
  getLaunchHistory() {
    this._ensureReady();
    const history = this.storage.get('launchHistory', []);
    return Array.isArray(history) ? history : [];
  }
  
  clearLaunchHistory() {
    this._ensureReady();
    return this.storage.set('launchHistory', []);
  }
  
  getMostUsed(limit = 5) {
    const history = this.getLaunchHistory();
    const frequency = {};
    
    history.forEach(entry => {
      frequency[entry.id] = (frequency[entry.id] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => history.find(h => h.id === id));
  }
  
  // ==========================================================================
  // FLASHCARDS (Tarjetas de Estudio)
  // ==========================================================================
  
  getFlashcards() {
    this._ensureReady();
    const flashcards = this.storage.get('flashcards', []);
    return Array.isArray(flashcards) ? flashcards : [];
  }
  
  addFlashcard(flashcard) {
    this._ensureReady();
    if (!flashcard || !flashcard.question || !flashcard.answer) {
      return false;
    }
    
    const flashcards = this.getFlashcards();
    const newCard = {
      id: Date.now().toString(),
      question: flashcard.question,
      answer: flashcard.answer,
      category: flashcard.category || 'general',
      difficulty: flashcard.difficulty || 'medium',
      tags: flashcard.tags || [],
      createdAt: Date.now(),
      lastReviewed: null,
      reviewCount: 0,
      correctCount: 0,
      ...flashcard
    };
    
    flashcards.push(newCard);
    return this.storage.set('flashcards', flashcards);
  }
  
  updateFlashcard(id, updates) {
    this._ensureReady();
    if (!id || !updates) return false;
    
    const flashcards = this.getFlashcards();
    const index = flashcards.findIndex(card => card.id === id);
    
    if (index === -1) return false;
    
    flashcards[index] = { ...flashcards[index], ...updates };
    return this.storage.set('flashcards', flashcards);
  }
  
  deleteFlashcard(id) {
    this._ensureReady();
    const flashcards = this.getFlashcards();
    return this.storage.set('flashcards', flashcards.filter(card => card.id !== id));
  }
  
  recordFlashcardReview(id, correct) {
    this._ensureReady();
    const flashcards = this.getFlashcards();
    const index = flashcards.findIndex(card => card.id === id);
    
    if (index === -1) return false;
    
    flashcards[index].lastReviewed = Date.now();
    flashcards[index].reviewCount = (flashcards[index].reviewCount || 0) + 1;
    
    if (correct) {
      flashcards[index].correctCount = (flashcards[index].correctCount || 0) + 1;
    }
    
    return this.storage.set('flashcards', flashcards);
  }
  
  // ==========================================================================
  // NOTAS EDUCATIVAS
  // ==========================================================================
  
  getNotes() {
    this._ensureReady();
    const notes = this.storage.get('notes', []);
    return Array.isArray(notes) ? notes : [];
  }
  
  addNote(note) {
    this._ensureReady();
    if (!note || !note.title || !note.content) {
      return false;
    }
    
    const notes = this.getNotes();
    const newNote = {
      id: Date.now().toString(),
      title: note.title,
      content: note.content,
      category: note.category || 'general',
      tags: note.tags || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...note
    };
    
    notes.push(newNote);
    return this.storage.set('notes', notes);
  }
  
  updateNote(id, updates) {
    this._ensureReady();
    if (!id || !updates) return false;
    
    const notes = this.getNotes();
    const index = notes.findIndex(note => note.id === id);
    
    if (index === -1) return false;
    
    notes[index] = {
      ...notes[index],
      ...updates,
      updatedAt: Date.now()
    };
    
    return this.storage.set('notes', notes);
  }
  
  deleteNote(id) {
    this._ensureReady();
    const notes = this.getNotes();
    return this.storage.set('notes', notes.filter(note => note.id !== id));
  }
  
  // ==========================================================================
  // SESIONES DE ESTUDIO
  // ==========================================================================
  
  getStudySessions() {
    this._ensureReady();
    const sessions = this.storage.get('studySessions', []);
    return Array.isArray(sessions) ? sessions : [];
  }
  
  addStudySession(session) {
    this._ensureReady();
    if (!session || !session.duration) {
      return false;
    }
    
    const sessions = this.getStudySessions();
    const newSession = {
      id: Date.now().toString(),
      duration: session.duration,
      topic: session.topic || 'General',
      cardsReviewed: session.cardsReviewed || 0,
      correctAnswers: session.correctAnswers || 0,
      startedAt: session.startedAt || Date.now(),
      completedAt: Date.now(),
      ...session
    };
    
    sessions.push(newSession);
    return this.storage.set('studySessions', sessions);
  }
  
  getStudyStats(days = 7) {
    const sessions = this.getStudySessions();
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const recentSessions = sessions.filter(s => s.completedAt >= cutoffTime);
    
    return {
      totalSessions: recentSessions.length,
      totalDuration: recentSessions.reduce((sum, s) => sum + s.duration, 0),
      totalCardsReviewed: recentSessions.reduce((sum, s) => sum + (s.cardsReviewed || 0), 0),
      averageAccuracy: recentSessions.length > 0
        ? recentSessions.reduce((sum, s) => {
            const accuracy = s.cardsReviewed > 0 
              ? (s.correctAnswers / s.cardsReviewed) * 100 
              : 0;
            return sum + accuracy;
          }, 0) / recentSessions.length
        : 0
    };
  }
  
  // ==========================================================================
  // POMODORO
  // ==========================================================================
  
  getPomodoroState() {
    this._ensureReady();
    const pomodoro = this.storage.get('pomodoro', getDefaults().pomodoro);
    return typeof pomodoro === 'object' ? pomodoro : getDefaults().pomodoro;
  }
  
  setPomodoroState(state) {
    this._ensureReady();
    if (!state || typeof state !== 'object') return false;
    
    const current = this.getPomodoroState();
    const updated = { ...current, ...state };
    
    return this.storage.set('pomodoro', updated);
  }
  
  resetPomodoroState() {
    this._ensureReady();
    return this.storage.set('pomodoro', getDefaults().pomodoro);
  }
  
  // ==========================================================================
  // HOTKEYS
  // ==========================================================================
  
  getHotkeys() {
    this._ensureReady();
    const hotkeys = this.storage.get('hotkeys', getDefaults().hotkeys);
    return typeof hotkeys === 'object' ? hotkeys : getDefaults().hotkeys;
  }
  
  setHotkey(key, value) {
    this._ensureReady();
    if (!key || !value) return false;
    
    const hotkeys = this.getHotkeys();
    hotkeys[key] = value;
    return this.storage.set('hotkeys', hotkeys);
  }
  
  setHotkeys(newHotkeys) {
    this._ensureReady();
    if (!newHotkeys || typeof newHotkeys !== 'object') return false;
    
    const current = this.getHotkeys();
    return this.storage.set('hotkeys', { ...current, ...newHotkeys });
  }
  
  // ==========================================================================
  // UI
  // ==========================================================================
  
  getUI() {
    this._ensureReady();
    const ui = this.storage.get('ui', getDefaults().ui);
    return typeof ui === 'object' ? ui : getDefaults().ui;
  }
  
  setUI(key, value) {
    this._ensureReady();
    if (!key) return false;
    
    const ui = this.getUI();
    ui[key] = value;
    return this.storage.set('ui', ui);
  }
  
  // ==========================================================================
  // SCAN
  // ==========================================================================
  
  getScanConfig() {
    this._ensureReady();
    const scan = this.storage.get('scan', getDefaults().scan);
    return typeof scan === 'object' ? scan : getDefaults().scan;
  }
  
  setScanConfig(key, value) {
    this._ensureReady();
    if (!key) return false;
    
    const scan = this.getScanConfig();
    scan[key] = value;
    return this.storage.set('scan', scan);
  }
  
  // ==========================================================================
  // WINDOW MANAGEMENT
  // ==========================================================================
  
  getWindowConfig() {
    this._ensureReady();
    const config = this.storage.get('windowManagement', getDefaults().windowManagement);
    return typeof config === 'object' ? config : getDefaults().windowManagement;
  }
  
  setWindowConfig(key, value) {
    this._ensureReady();
    if (!key) return false;
    
    const config = this.getWindowConfig();
    config[key] = value;
    return this.storage.set('windowManagement', config);
  }
  
  // ==========================================================================
  // UTILIDADES
  // ==========================================================================
  
  reset() {
    this._ensureReady();
    try {
      this.storage.clear();
      console.log('✅ Config reset');
      return true;
    } catch (error) {
      console.error('Error resetting:', error);
      return false;
    }
  }
  
  export() {
    this._ensureReady();
    try {
      return this.storage.getAll();
    } catch (error) {
      console.error('Error exporting:', error);
      return getDefaults();
    }
  }
  
  import(data) {
    this._ensureReady();
    if (!data || typeof data !== 'object') return false;
    
    try {
      const defaults = getDefaults();
      
      for (const key in data) {
        if (key in defaults) {
          this.storage.set(key, data[key]);
        }
      }
      
      console.log('✅ Config imported');
      return true;
    } catch (error) {
      console.error('Error importing:', error);
      return false;
    }
  }
  
  getStats() {
    return {
      favorites: this.getFavorites().length,
      searchHistory: this.getSearchHistory().length,
      launchHistory: this.getLaunchHistory().length,
      flashcards: this.getFlashcards().length,
      notes: this.getNotes().length,
      studySessions: this.getStudySessions().length,
      backend: this.storage.useElectronStore ? 'electron-store' : 'fs',
      ready: this.ready
    };
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

const configManager = new ConfigManager();

configManager.init().catch(error => {
  console.error('Failed to init ConfigManager:', error);
});

module.exports = configManager;