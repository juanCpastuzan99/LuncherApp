const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getApps: () => ipcRenderer.invoke('get-apps'),
  reloadIndex: () => ipcRenderer.invoke('reload-index'),
  launch: (path, itemType) => ipcRenderer.invoke('launch', path, itemType),
  getConfig: () => ipcRenderer.invoke('get-config'),
  setHotkey: (hotkey) => ipcRenderer.invoke('set-hotkey', hotkey),
  onFocusSearch: (cb) => {
    ipcRenderer.on('focus-search', () => {
      cb();
    });
  },
  onAppsUpdated: (cb) => {
    ipcRenderer.on('apps-updated', (event, count) => {
      cb(count);
    });
  },
  onThemeChanged: (cb) => {
    ipcRenderer.on('theme-changed', (event, theme) => {
      cb(theme);
    });
  },
  // Window Management API
  tileWindows: (layout) => ipcRenderer.invoke('tile-windows', layout),
  moveWindowSide: (direction) => ipcRenderer.invoke('move-window-side', direction),
  centerWindow: () => ipcRenderer.invoke('center-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  switchWorkspace: (direction) => ipcRenderer.invoke('switch-workspace', direction),
  getWindows: () => ipcRenderer.invoke('get-windows'),
  getActiveWindow: () => ipcRenderer.invoke('get-active-window'),
  // Config API
  setConfig: (section, key, value) => ipcRenderer.invoke('set-config', section, key, value),
  getFavorites: () => ipcRenderer.invoke('get-favorites'),
  addFavorite: (appId) => ipcRenderer.invoke('add-favorite', appId),
  removeFavorite: (appId) => ipcRenderer.invoke('remove-favorite', appId),
  getSearchHistory: () => ipcRenderer.invoke('get-search-history'),
  getLaunchHistory: () => ipcRenderer.invoke('get-launch-history'),
  clearSearchHistory: () => ipcRenderer.invoke('clear-search-history'),
  clearLaunchHistory: () => ipcRenderer.invoke('clear-launch-history'),
  exportConfig: () => ipcRenderer.invoke('export-config'),
  importConfig: (config) => ipcRenderer.invoke('import-config', config),
  resetConfig: () => ipcRenderer.invoke('reset-config'),
  openSettings: () => ipcRenderer.invoke('open-settings'),
  // Icon API
  getAppIcon: (appPath, appType) => ipcRenderer.invoke('get-app-icon', appPath, appType),
  // Window control
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  // Theme
  updateTheme: (theme) => ipcRenderer.invoke('update-theme', theme)
});


