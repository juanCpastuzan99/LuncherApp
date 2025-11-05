/**
 * Preload Script - Secure Bridge between Main and Renderer
 * TypeScript with full type safety, validation, and error handling
 */

import { contextBridge, ipcRenderer } from 'electron';

// ============================================================================
// TYPES
// ============================================================================

interface App {
  id: string;
  name: string;
  path: string;
  ext: string;
  type: string;
}

interface WindowInfo {
  Handle: number;
  Title: string;
  X: number;
  Y: number;
  Width: number;
  Height: number;
}

interface Config {
  hotkeys: Record<string, string>;
  ui: {
    theme: 'dark' | 'light' | 'auto';
    windowWidth: number;
    windowHeight: number;
    maxResults: number;
    showPath: boolean;
    animationSpeed: 'fast' | 'normal' | 'slow';
  };
  scan: {
    includeUWP: boolean;
    includeRegistry: boolean;
    includeLocalApps: boolean;
    includeStartMenu: boolean;
    scanInterval: number;
  };
  windowManagement: {
    gap: number;
    enableTiling: boolean;
    enableFloating: boolean;
    defaultLayout: 'grid' | 'vertical' | 'horizontal';
  };
  favorites: string[];
  searchHistory: string[];
  launchHistory: Array<{
    id: string;
    name: string;
    path: string;
    timestamp: number;
  }>;
}

type Layout = 'grid' | 'vertical' | 'horizontal';
type Direction = 'left' | 'right' | 'next' | 'previous' | 'prev';
type Theme = 'dark' | 'light' | 'auto';

type CleanupFunction = () => void;

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate string parameter
 */
function validateString(value: unknown, paramName: string): value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    console.warn(`[Preload] Invalid ${paramName}: expected non-empty string`);
    return false;
  }
  return true;
}

/**
 * Validate path (prevent path traversal)
 */
function validatePath(path: unknown): path is string {
  if (!validateString(path, 'path')) return false;
  
  const pathStr = path as string;
  if (pathStr.includes('..') || pathStr.includes('~')) {
    console.warn('[Preload] Suspicious path detected:', pathStr);
    return false;
  }
  
  return true;
}

/**
 * Validate direction
 */
function validateDirection(direction: unknown): direction is Direction {
  const validDirections: Direction[] = ['left', 'right', 'next', 'previous', 'prev'];
  if (!validDirections.includes(direction as Direction)) {
    console.warn('[Preload] Invalid direction:', direction);
    return false;
  }
  return true;
}

/**
 * Validate layout
 */
function validateLayout(layout: unknown): layout is Layout {
  const validLayouts: Layout[] = ['grid', 'vertical', 'horizontal'];
  if (!validLayouts.includes(layout as Layout)) {
    console.warn('[Preload] Invalid layout:', layout);
    return false;
  }
  return true;
}

/**
 * Validate theme
 */
function validateTheme(theme: unknown): theme is Theme {
  const validThemes: Theme[] = ['dark', 'light', 'auto'];
  if (!validThemes.includes(theme as Theme)) {
    console.warn('[Preload] Invalid theme:', theme);
    return false;
  }
  return true;
}

/**
 * Validate callback function
 */
function validateCallback(callback: unknown, channelName: string): callback is Function {
  if (typeof callback !== 'function') {
    console.error(`[Preload] Callback for ${channelName} must be a function`);
    return false;
  }
  return true;
}

// ============================================================================
// IPC UTILITIES
// ============================================================================

/**
 * Safe invoke wrapper with error handling
 */
async function safeInvoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  try {
    return await ipcRenderer.invoke(channel, ...args);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Preload] Error in ${channel}:`, errorMessage);
    throw error;
  }
}

/**
 * Safe listener registration with cleanup
 */
function safeOn<T extends unknown[]>(
  channel: string,
  callback: (...args: T) => void
): CleanupFunction {
  if (!validateCallback(callback, channel)) {
    return () => {}; // Return no-op cleanup
  }
  
  const listener = (_event: Electron.IpcRendererEvent, ...args: T) => {
    try {
      callback(...args);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Preload] Error in ${channel} callback:`, errorMessage);
    }
  };
  
  ipcRenderer.on(channel, listener as any);
  
  // Return cleanup function
  return () => {
    ipcRenderer.removeListener(channel, listener as any);
  };
}

// ============================================================================
// API IMPLEMENTATION
// ============================================================================

const api = {
  // ==========================================================================
  // APP MANAGEMENT
  // ==========================================================================
  
  /**
   * Get all available applications
   */
  getApps: (): Promise<App[]> => {
    return safeInvoke<App[]>('get-apps');
  },
  
  /**
   * Reload application index
   */
  reloadIndex: (): Promise<App[]> => {
    return safeInvoke<App[]>('reload-index');
  },
  
  /**
   * Launch an application
   */
  launch: async (path: string, itemType?: string): Promise<void> => {
    if (!validatePath(path)) {
      throw new Error('Invalid application path');
    }
    
    if (itemType !== undefined && !validateString(itemType, 'itemType')) {
      throw new Error('Invalid item type');
    }
    
    return safeInvoke<void>('launch', path, itemType);
  },
  
  /**
   * Get application icon
   */
  getAppIcon: async (appPath: string, appType?: string): Promise<string | null> => {
    if (!validatePath(appPath)) {
      return null;
    }
    
    return safeInvoke<string | null>('get-app-icon', appPath, appType);
  },
  
  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================
  
  /**
   * Get complete configuration
   */
  getConfig: (): Promise<Config> => {
    return safeInvoke<Config>('get-config');
  },
  
  /**
   * Set configuration value
   */
  setConfig: async (section: string, key: string, value: unknown): Promise<boolean> => {
    if (!validateString(section, 'section') || !validateString(key, 'key')) {
      throw new Error('Invalid config parameters');
    }
    
    if (value === undefined) {
      throw new Error('Config value cannot be undefined');
    }
    
    return safeInvoke<boolean>('set-config', section, key, value);
  },
  
  /**
   * Export configuration
   */
  exportConfig: (): Promise<Config> => {
    return safeInvoke<Config>('export-config');
  },
  
  /**
   * Import configuration
   */
  importConfig: async (config: unknown): Promise<boolean> => {
    if (!config || typeof config !== 'object') {
      throw new Error('Invalid config object');
    }
    
    return safeInvoke<boolean>('import-config', config);
  },
  
  /**
   * Reset configuration to defaults
   */
  resetConfig: (): Promise<boolean> => {
    return safeInvoke<boolean>('reset-config');
  },
  
  /**
   * Open settings window
   */
  openSettings: (): Promise<boolean> => {
    return safeInvoke<boolean>('open-settings');
  },
  
  // ==========================================================================
  // FAVORITES
  // ==========================================================================
  
  /**
   * Get favorite apps
   */
  getFavorites: (): Promise<string[]> => {
    return safeInvoke<string[]>('get-favorites');
  },
  
  /**
   * Add app to favorites
   */
  addFavorite: async (appId: string): Promise<boolean> => {
    if (!validateString(appId, 'appId')) {
      throw new Error('Invalid app ID');
    }
    
    return safeInvoke<boolean>('add-favorite', appId);
  },
  
  /**
   * Remove app from favorites
   */
  removeFavorite: async (appId: string): Promise<boolean> => {
    if (!validateString(appId, 'appId')) {
      throw new Error('Invalid app ID');
    }
    
    return safeInvoke<boolean>('remove-favorite', appId);
  },
  
  // ==========================================================================
  // HISTORY
  // ==========================================================================
  
  /**
   * Get search history
   */
  getSearchHistory: (): Promise<string[]> => {
    return safeInvoke<string[]>('get-search-history');
  },
  
  /**
   * Get launch history
   */
  getLaunchHistory: (): Promise<Config['launchHistory']> => {
    return safeInvoke<Config['launchHistory']>('get-launch-history');
  },
  
  /**
   * Clear search history
   */
  clearSearchHistory: (): Promise<boolean> => {
    return safeInvoke<boolean>('clear-search-history');
  },
  
  /**
   * Clear launch history
   */
  clearLaunchHistory: (): Promise<boolean> => {
    return safeInvoke<boolean>('clear-launch-history');
  },
  
  // ==========================================================================
  // WINDOW MANAGEMENT
  // ==========================================================================
  
  /**
   * Tile windows in specified layout
   */
  tileWindows: async (layout: Layout = 'grid'): Promise<void> => {
    if (!validateLayout(layout)) {
      throw new Error('Invalid layout');
    }
    
    return safeInvoke<void>('tile-windows', layout);
  },
  
  /**
   * Move active window to side
   */
  moveWindowSide: async (direction: Direction): Promise<void> => {
    if (!validateDirection(direction)) {
      throw new Error('Invalid direction');
    }
    
    return safeInvoke<void>('move-window-side', direction);
  },
  
  /**
   * Center active window
   */
  centerWindow: (): Promise<void> => {
    return safeInvoke<void>('center-window');
  },
  
  /**
   * Maximize active window
   */
  maximizeWindow: (): Promise<void> => {
    return safeInvoke<void>('maximize-window');
  },
  
  /**
   * Minimize active window
   */
  minimizeWindow: (): Promise<void> => {
    return safeInvoke<void>('minimize-window');
  },
  
  /**
   * Switch virtual workspace
   */
  switchWorkspace: async (direction: Direction): Promise<void> => {
    if (!validateDirection(direction)) {
      throw new Error('Invalid direction');
    }
    
    return safeInvoke<void>('switch-workspace', direction);
  },
  
  /**
   * Get all windows
   */
  getWindows: (): Promise<WindowInfo[]> => {
    return safeInvoke<WindowInfo[]>('get-windows');
  },
  
  /**
   * Get active window
   */
  getActiveWindow: (): Promise<WindowInfo | null> => {
    return safeInvoke<WindowInfo | null>('get-active-window');
  },
  
  // ==========================================================================
  // UI CONTROL
  // ==========================================================================
  
  /**
   * Hide main window
   */
  hideWindow: (): Promise<boolean> => {
    return safeInvoke<boolean>('hide-window');
  },
  
  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================
  
  /**
   * Listen for apps updated event
   * @returns Cleanup function to remove the listener
   */
  onAppsUpdated: (callback: (count: number) => void): CleanupFunction => {
    return safeOn<[number]>('apps-updated', callback);
  },
  
  /**
   * Listen for focus search event
   * @returns Cleanup function to remove the listener
   */
  onFocusSearch: (callback: () => void): CleanupFunction => {
    return safeOn<[]>('focus-search', callback);
  },
  
  /**
   * Listen for theme changed event
   * @returns Cleanup function to remove the listener
   */
  onThemeChanged: (callback: (theme: Theme) => void): CleanupFunction => {
    return safeOn<[Theme]>('theme-changed', callback);
  },
  
  // ==========================================================================
  // UTILITIES
  // ==========================================================================
  
  /**
   * Get Electron versions (useful for debugging)
   */
  getVersions: () => ({
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
    v8: process.versions.v8,
  }),
  
  /**
   * Check if app is packaged (production mode)
   */
  isPackaged: (): boolean => {
    return process.env.NODE_ENV === 'production';
  },
  
  /**
   * Get platform information
   */
  getPlatform: () => ({
    platform: process.platform,
    arch: process.arch,
    version: process.version,
  }),
};

// ============================================================================
// TYPE DEFINITION FOR RENDERER
// ============================================================================

export type ElectronAPI = typeof api;

// ============================================================================
// EXPOSE API TO RENDERER
// ============================================================================

try {
  contextBridge.exposeInMainWorld('api', api);
  console.log('[Preload] ✅ API exposed successfully');
  console.log('[Preload] Context isolation:', process.contextIsolated);
  console.log('[Preload] Sandbox:', process.sandboxed);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error('[Preload] ❌ Failed to expose API:', errorMessage);
}

// ============================================================================
// CLEANUP ON UNLOAD
// ============================================================================

window.addEventListener('beforeunload', () => {
  // Remove all listeners to prevent memory leaks
  ipcRenderer.removeAllListeners('apps-updated');
  ipcRenderer.removeAllListeners('focus-search');
  ipcRenderer.removeAllListeners('theme-changed');
  console.log('[Preload] Cleaned up listeners');
});

// ============================================================================
// SECURITY
// ============================================================================

// Freeze process object to prevent tampering
Object.freeze(process);

// Log security status
if (process.contextIsolated) {
  console.log('[Preload] ✅ Context isolation enabled');
} else {
  console.warn('[Preload] ⚠️ Context isolation is disabled - security risk!');
}

if (process.sandboxed) {
  console.log('[Preload] ✅ Sandbox enabled');
} else {
  console.warn('[Preload] ⚠️ Sandbox is disabled');
}