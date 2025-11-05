/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEV_SERVER_PORT?: string;
  readonly PORT?: string;
  readonly NODE_ENV: 'development' | 'production' | 'test';
  readonly ELECTRON_DEBUG?: string;
  readonly ELECTRON_PREVIEW?: string;
  readonly ELECTRON_SIMPLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly hot?: {
    accept(): void;
    accept(cb: (mod: any) => void): void;
    accept(dep: string, cb: (mod: any) => void): void;
    accept(deps: string[], cb: (mods: any[]) => void): void;
    dispose(cb: (data: any) => void): void;
    decline(): void;
    invalidate(): void;
    on(event: string, cb: (...args: any[]) => void): void;
  };
}

