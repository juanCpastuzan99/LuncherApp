/**
 * Tipos seguros para IPC entre Main y Renderer
 */

import type { IPCChannel, IPCEvents } from './types';

// Declarar tipos globales para window.api
declare global {
  interface Window {
    api: {
      // Apps
      getApps: () => Promise<any[]>;
      reloadIndex: () => Promise<any[]>;
      launch: (path: string, itemType?: string) => Promise<void>;
      
      // Config
      getConfig: () => Promise<any>;
      setConfig: (section: string, key: string, value: any) => Promise<boolean>;
      getFavorites: () => Promise<string[]>;
      addFavorite: (appId: string) => Promise<boolean>;
      removeFavorite: (appId: string) => Promise<boolean>;
      getSearchHistory: () => Promise<string[]>;
      getLaunchHistory: () => Promise<any[]>;
      clearSearchHistory: () => Promise<boolean>;
      clearLaunchHistory: () => Promise<boolean>;
      exportConfig: () => Promise<any>;
      importConfig: (config: any) => Promise<boolean>;
      resetConfig: () => Promise<boolean>;
      openSettings: () => Promise<boolean>;
      
      // Window Management
      tileWindows: (layout?: string) => Promise<void>;
      moveWindowSide: (direction: string) => Promise<void>;
      centerWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      minimizeWindow: () => Promise<void>;
      switchWorkspace: (direction: string) => Promise<void>;
      getWindows: () => Promise<any[]>;
      getActiveWindow: () => Promise<any>;
      
      // Events
      onAppsUpdated: (callback: (count: number) => void) => void;
      onFocusSearch: (callback: () => void) => void;
      onThemeChanged?: (callback: (theme: string) => void) => void;
      
      // Icon API
      getAppIcon?: (appPath: string, appType?: string) => Promise<string>;
      
      // Window control
      hideWindow: () => Promise<boolean>;
    };
  }
}

export {};

