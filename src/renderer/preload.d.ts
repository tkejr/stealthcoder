import { ElectronHandler } from '../main/preload';

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    electron: ElectronHandler;
  }
}

export interface ElectronHandler {
  ipcRenderer: {
    // ... existing types ...
  };
  screenshot: {
    capture: () => Promise<void>;
    onComplete: (callback: (path: string) => void) => void;
  };
  windowControl: {
    setOpacity: (value: number) => Promise<void>;
  };
  store: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
  };
}

export {};
