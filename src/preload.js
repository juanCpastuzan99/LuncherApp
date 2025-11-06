const { contextBridge, ipcRenderer } = require('electron');

const api = {
  version: '0.1.0',
  platform: process.platform,
  
  // IPC methods
  send: (channel, data) => {
    const validChannels = ['scan-apps', 'launch', 'hide-window', 'window-action', 'clear-cache', 'show-window'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  
  on: (channel, callback) => {
    const validChannels = ['apps-updated', 'focus-search', 'cache-cleared', 'focus-pomodoro'];
    if (validChannels.includes(channel)) {
      const handler = (event, ...args) => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error en callback de ${channel}:`, error);
        }
      };
      ipcRenderer.on(channel, handler);
      // Retornar función para poder remover el listener
      return () => ipcRenderer.removeListener(channel, handler);
    }
    return () => {}; // Retornar función vacía si el channel no es válido
  },
  
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Config methods
  setConfig: async (section, key, value) => {
    return ipcRenderer.invoke('config-set', { section, key, value });
  },

  getConfig: async () => {
    return ipcRenderer.invoke('config-get');
  },

  // Cache methods
  clearCache: () => {
    ipcRenderer.send('clear-cache');
  },

  // Settings window methods
  openSettingsWindow: async () => {
    return ipcRenderer.invoke('open-settings-window');
  },

  closeSettingsWindow: async () => {
    return ipcRenderer.invoke('close-settings-window');
  }
};

try {
  contextBridge.exposeInMainWorld('api', api);
  console.log('[Preload] ✅ API exposed');
} catch (error) {
  console.error('[Preload] ❌ Error:', error);
}
