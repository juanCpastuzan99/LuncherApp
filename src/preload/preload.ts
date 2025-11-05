/**
 * Preload script - Puente seguro entre Main y Renderer
 * Tipado con TypeScript para garantizar seguridad IPC
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { IPCChannel, IPCEvents } from '../shared/types';

// Exponer API tipada al renderer
contextBridge.exposeInMainWorld('api', {
  // Apps
  getApps: () => ipcRenderer.invoke('get-apps') as Promise<any[]>,
  reloadIndex: () => ipcRenderer.invoke('reload-index') as Promise<any[]>,
  launch: (path: string, itemType?: string) => 
    ipcRenderer.invoke('launch', path, itemType) as Promise<void>,
  
  // Config
  getConfig: () => ipcRenderer.invoke('get-config') as Promise<any>,
  setConfig: (section: string, key: string, value: any) => 
    ipcRenderer.invoke('set-config', section, key, value) as Promise<boolean>,
  getFavorites: () => ipcRenderer.invoke('get-favorites') as Promise<string[]>,
  addFavorite: (appId: string) => 
    ipcRenderer.invoke('add-favorite', appId) as Promise<boolean>,
  removeFavorite: (appId: string) => 
    ipcRenderer.invoke('remove-favorite', appId) as Promise<boolean>,
  getSearchHistory: () => ipcRenderer.invoke('get-search-history') as Promise<string[]>,
  getLaunchHistory: () => ipcRenderer.invoke('get-launch-history') as Promise<any[]>,
  clearSearchHistory: () => 
    ipcRenderer.invoke('clear-search-history') as Promise<boolean>,
  clearLaunchHistory: () => 
    ipcRenderer.invoke('clear-launch-history') as Promise<boolean>,
  exportConfig: () => ipcRenderer.invoke('export-config') as Promise<any>,
  importConfig: (config: any) => 
    ipcRenderer.invoke('import-config', config) as Promise<boolean>,
  resetConfig: () => ipcRenderer.invoke('reset-config') as Promise<boolean>,
  openSettings: () => ipcRenderer.invoke('open-settings') as Promise<boolean>,
  
  // Window Management
  tileWindows: (layout?: string) => 
    ipcRenderer.invoke('tile-windows', layout) as Promise<void>,
  moveWindowSide: (direction: string) => 
    ipcRenderer.invoke('move-window-side', direction) as Promise<void>,
  centerWindow: () => ipcRenderer.invoke('center-window') as Promise<void>,
  maximizeWindow: () => ipcRenderer.invoke('maximize-window') as Promise<void>,
  minimizeWindow: () => ipcRenderer.invoke('minimize-window') as Promise<void>,
  switchWorkspace: (direction: string) => 
    ipcRenderer.invoke('switch-workspace', direction) as Promise<void>,
  getWindows: () => ipcRenderer.invoke('get-windows') as Promise<any[]>,
  getActiveWindow: () => ipcRenderer.invoke('get-active-window') as Promise<any>,
  
  // Events
  onAppsUpdated: (callback: (count: number) => void) => {
    ipcRenderer.on('apps-updated', (_event, count) => {
      callback(count);
    });
  },
  onFocusSearch: (callback: () => void) => {
    ipcRenderer.on('focus-search', () => {
      callback();
    });
  },
  onThemeChanged: (callback: (theme: string) => void) => {
    ipcRenderer.on('theme-changed', (_event, theme) => {
      callback(theme);
    });
  },
  
  // Icon API
  getAppIcon: (appPath: string, appType?: string) =>
    ipcRenderer.invoke('get-app-icon', appPath, appType) as Promise<string>,
  
  // Window control
  hideWindow: () => ipcRenderer.invoke('hide-window') as Promise<boolean>
});

