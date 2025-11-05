/**
 * Main process - Proceso principal de Electron
 * Migrado a TypeScript para tipado y seguridad
 */

import { app, BrowserWindow, globalShortcut, ipcMain, shell, screen } from 'electron';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';

// Importar módulos JS existentes (se migrarán gradualmente)
const windowManager = require('../windowManager');
const configManager = require('../config');

// Tipos
interface AppItem {
  id: string;
  name: string;
  path: string;
  ext: string;
  type: string;
}

// Determinar el directorio base correcto
const getBaseDir = (): string => {
  const isGlobal = __dirname.includes('node_modules') || __dirname.includes('AppData');
  return isGlobal ? path.dirname(__dirname) : process.cwd();
};

let mainWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let appIndex: AppItem[] = [];

// Configuración legacy (se mantiene por compatibilidad)
let config = {
  hotkey: 'Alt+Space',
  theme: 'dark',
  transparency: true,
  excludePatterns: ['uninstall', 'help', 'documentation'],
  windowHotkeys: {
    tileGrid: 'Ctrl+Alt+T',
    tileVertical: 'Ctrl+Alt+Shift+T',
    tileHorizontal: 'Ctrl+Alt+H',
    moveLeft: 'Ctrl+Alt+Left',
    moveRight: 'Ctrl+Alt+Right',
    center: 'Ctrl+Alt+C',
    maximize: 'Ctrl+Alt+Up',
    minimize: 'Ctrl+Alt+Down',
    workspaceNext: 'Ctrl+Alt+Right',
    workspacePrev: 'Ctrl+Alt+Left'
  }
};

const userDataDir = app.getPath('userData');
const configPath = path.join(userDataDir, 'config.json');

function loadConfig(): void {
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(raw);
      config = { ...config, ...parsed };
    } else {
      fs.mkdirSync(userDataDir, { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }
  } catch (err) {
    // keep defaults if parsing fails
  }
}

function saveConfig(partial: Partial<typeof config>): void {
  config = { ...config, ...partial };
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (_) {}
}

function isExcluded(name: string): boolean {
  const lower = name.toLowerCase();
  return config.excludePatterns.some((p) => lower.includes(p));
}

// Importar funciones de escaneo desde main.js original
// Por ahora, usar require para mantener compatibilidad
const originalMain = require('../main.js');

// Re-exportar funciones necesarias
const scanUWPApps = originalMain.scanUWPApps || function(callback: (apps: AppItem[]) => void) {
  callback([]);
};

const scanRegistryApps = originalMain.scanRegistryApps || function(callback: (apps: AppItem[]) => void) {
  callback([]);
};

const scanAllApps = originalMain.scanAllApps || function() {
  console.log('Escaneo de aplicaciones no disponible');
};

const launchItem = originalMain.launchItem || function(filePath: string, itemType?: string) {
  console.log('Launch not available');
};

const createWindow = originalMain.createWindow || function() {
  console.log('CreateWindow not available');
};

const registerHotkey = originalMain.registerHotkey || function() {
  console.log('RegisterHotkey not available');
};

const registerWindowHotkeys = originalMain.registerWindowHotkeys || function() {
  console.log('RegisterWindowHotkeys not available');
};

// Función para crear ventana de configuración
function createSettingsWindow(): void {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }
  
  const baseDir = getBaseDir();
  const uiConfig = configManager.getUI();
  
  settingsWindow = new BrowserWindow({
    width: uiConfig.windowWidth || 900,
    height: uiConfig.windowHeight || 600,
    backgroundColor: '#14141c',
    webPreferences: {
      preload: path.join(baseDir, 'dist-electron/preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'Configuración - Win11 Dev Launcher',
    show: false,
    frame: true,
    resizable: true
  });
  
  // En desarrollo usar Vite, en producción usar dist
  if (process.env.NODE_ENV === 'development') {
    settingsWindow.loadURL('http://localhost:5173/settings.html');
  } else {
    settingsWindow.loadFile(path.join(baseDir, 'dist-electron/renderer/settings.html'));
  }
  
  settingsWindow.once('ready-to-show', () => {
    settingsWindow?.show();
  });
  
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// IPC Handlers (tipados)
ipcMain.handle('get-apps', (): AppItem[] => {
  return appIndex;
});

ipcMain.handle('reload-index', (): AppItem[] => {
  scanAllApps();
  return appIndex;
});

ipcMain.handle('launch', async (_e, targetPath: string, itemType?: string): Promise<void> => {
  if (typeof targetPath === 'string') {
    const app = appIndex.find(a => a.path === targetPath || a.id === targetPath);
    if (app) {
      configManager.addLaunchHistory(app);
    }
    launchItem(targetPath, itemType);
  }
});

ipcMain.handle('get-config', () => {
  return {
    hotkeys: configManager.getHotkeys(),
    ui: configManager.getUI(),
    scan: configManager.getScanConfig(),
    windowManagement: configManager.getWindowConfig(),
    favorites: configManager.getFavorites(),
    searchHistory: configManager.getSearchHistory(),
    launchHistory: configManager.getLaunchHistory()
  };
});

// Config API Handlers
ipcMain.handle('set-config', (_e, section: string, key: string, value: any): boolean => {
  if (section === 'ui') {
    configManager.setUI(key, value);
  } else if (section === 'scan') {
    configManager.setScanConfig(key, value);
  } else if (section === 'windowManagement') {
    configManager.setWindowConfig(key, value);
  } else if (section === 'search' && key === 'lastQuery') {
    configManager.addSearchHistory(value);
  }
  return true;
});

ipcMain.handle('get-favorites', (): string[] => {
  return configManager.getFavorites();
});

ipcMain.handle('add-favorite', (_e, appId: string): boolean => {
  configManager.addFavorite(appId);
  return true;
});

ipcMain.handle('remove-favorite', (_e, appId: string): boolean => {
  configManager.removeFavorite(appId);
  return true;
});

ipcMain.handle('get-search-history', (): string[] => {
  return configManager.getSearchHistory();
});

ipcMain.handle('get-launch-history', () => {
  return configManager.getLaunchHistory();
});

ipcMain.handle('clear-search-history', (): boolean => {
  configManager.clearSearchHistory();
  return true;
});

ipcMain.handle('clear-launch-history', (): boolean => {
  configManager.clearLaunchHistory();
  return true;
});

ipcMain.handle('export-config', () => {
  return configManager.export();
});

ipcMain.handle('import-config', (_e, configData: any): boolean => {
  return configManager.import(configData);
});

ipcMain.handle('reset-config', (): boolean => {
  configManager.reset();
  return true;
});

ipcMain.handle('open-settings', (): boolean => {
  createSettingsWindow();
  return true;
});

// Window Management Handlers
ipcMain.handle('tile-windows', async (_e, layout?: string): Promise<void> => {
  await windowManager.tileWindows(layout || 'grid');
});

ipcMain.handle('move-window-side', async (_e, direction: string): Promise<void> => {
  await windowManager.moveWindowToSide(direction);
});

ipcMain.handle('center-window', async (): Promise<void> => {
  await windowManager.centerActiveWindow();
});

ipcMain.handle('maximize-window', async (): Promise<void> => {
  await windowManager.maximizeActiveWindow();
});

ipcMain.handle('minimize-window', async (): Promise<void> => {
  await windowManager.minimizeActiveWindow();
});

ipcMain.handle('switch-workspace', async (_e, direction: string): Promise<void> => {
  await windowManager.switchVirtualDesktop(direction);
});

ipcMain.handle('get-windows', async () => {
  return await windowManager.getAllWindows();
});

ipcMain.handle('get-active-window', async () => {
  return await windowManager.getActiveWindow();
});

app.whenReady().then(() => {
  try {
    loadConfig();
    scanAllApps();
    createWindow();
    registerHotkey();
    registerWindowHotkeys();
    console.log('Aplicación iniciada correctamente. Presiona Alt+Space para abrir/cerrar el launcher.');
  } catch (error) {
    console.error('Error al iniciar la aplicación:', error);
  }
});

process.on('uncaughtException', (error) => {
  console.error('Error no capturado:', error);
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  // keep app running in background
});

