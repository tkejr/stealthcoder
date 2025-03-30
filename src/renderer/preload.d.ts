declare namespace Electron {
  interface IpcRenderer {
    sendMessage(channel: string, args?: unknown[]): void;
    on(channel: string, func: (...args: unknown[]) => void): () => void;
    once(channel: string, func: (...args: unknown[]) => void): void;
  }

  interface Screenshot {
    capture: () => Promise<void>;
    onComplete: (callback: (path: string) => void) => void;
  }

  interface WindowControl {
    setOpacity: (value: number) => Promise<void>;
    getOpacity: () => Promise<number>;
  }

  interface API {
    getOpenAIKey: () => Promise<string>;
    setOpenAIKey: (key: string) => Promise<boolean>;
  }
}

declare global {
  interface Window {
    electron: {
      ipcRenderer: Electron.IpcRenderer;
      screenshot: Electron.Screenshot;
      windowControl: Electron.WindowControl;
      api: Electron.API;
    };
  }
}

export {}; 