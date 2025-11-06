export interface ElectronAPI {
  version: string;
  platform: string;
  send: (channel: string, data?: any) => void;
  on: (channel: string, callback: (data: any) => void) => (() => void) | void;
  removeAllListeners: (channel: string) => void;
  setConfig?: (section: string, key: string, value: any) => Promise<any>;
  getConfig?: () => Promise<any>;
  clearCache?: () => void;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}

