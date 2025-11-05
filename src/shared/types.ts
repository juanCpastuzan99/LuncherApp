/**
 * Tipos compartidos entre Main y Renderer
 * Garantiza seguridad de tipos en la comunicación IPC
 */

// Tipos de aplicaciones
export type AppType = 'uwp' | 'shortcut' | 'registry' | 'installed' | 'localapp';

export interface App {
  id: string;
  name: string;
  path: string;
  ext: string;
  type: AppType;
}

// Configuración de UI
export interface UIConfig {
  theme: 'dark' | 'light' | 'auto';
  windowWidth: number;
  windowHeight: number;
  maxResults: number;
  showPath: boolean;
  animationSpeed: 'fast' | 'normal' | 'slow';
}

// Hotkeys
export interface HotkeysConfig {
  openLauncher: string;
  tileWindows: string;
  moveWindowLeft: string;
  moveWindowRight: string;
  centerWindow: string;
  maximizeWindow: string;
  minimizeWindow: string;
  switchWorkspaceNext: string;
  switchWorkspacePrev: string;
}

// Configuración de escaneo
export interface ScanConfig {
  includeUWP: boolean;
  includeRegistry: boolean;
  includeLocalApps: boolean;
  includeStartMenu: boolean;
  scanInterval: number;
}

// Configuración de gestión de ventanas
export interface WindowManagementConfig {
  gap: number;
  enableTiling: boolean;
  enableFloating: boolean;
  defaultLayout: 'grid' | 'vertical' | 'horizontal';
}

// Historial de lanzamientos
export interface LaunchHistoryItem {
  id: string;
  name: string;
  path: string;
  timestamp: number;
}

// Configuración completa
export interface AppConfig {
  favorites: string[];
  searchHistory: string[];
  launchHistory: LaunchHistoryItem[];
  hotkeys: HotkeysConfig;
  ui: UIConfig;
  scan: ScanConfig;
  windowManagement: WindowManagementConfig;
}

// API IPC - Tipos de mensajes
export interface IPCChannel {
  // Apps
  'get-apps': () => Promise<App[]>;
  'reload-index': () => Promise<App[]>;
  'launch': (path: string, itemType?: AppType) => Promise<void>;
  
  // Config
  'get-config': () => Promise<AppConfig>;
  'set-config': (section: 'ui' | 'scan' | 'windowManagement', key: string, value: any) => Promise<boolean>;
  'get-favorites': () => Promise<string[]>;
  'add-favorite': (appId: string) => Promise<boolean>;
  'remove-favorite': (appId: string) => Promise<boolean>;
  'get-search-history': () => Promise<string[]>;
  'get-launch-history': () => Promise<LaunchHistoryItem[]>;
  'clear-search-history': () => Promise<boolean>;
  'clear-launch-history': () => Promise<boolean>;
  'export-config': () => Promise<AppConfig>;
  'import-config': (config: AppConfig) => Promise<boolean>;
  'reset-config': () => Promise<boolean>;
  'open-settings': () => Promise<boolean>;
  
  // Window Management
  'tile-windows': (layout?: 'grid' | 'vertical' | 'horizontal') => Promise<void>;
  'move-window-side': (direction: 'left' | 'right') => Promise<void>;
  'center-window': () => Promise<void>;
  'maximize-window': () => Promise<void>;
  'minimize-window': () => Promise<void>;
  'switch-workspace': (direction: 'next' | 'previous') => Promise<void>;
  'get-windows': () => Promise<any[]>;
  'get-active-window': () => Promise<any>;
}

// Eventos IPC
export interface IPCEvents {
  'apps-updated': (count: number) => void;
  'focus-search': () => void;
}

