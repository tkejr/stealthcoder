// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
  screenshot: {
    capture: () => ipcRenderer.invoke('take-screenshot'),
    onComplete: (callback: (base64: string) => void) =>
      ipcRenderer.on('screenshot-complete', (_event, base64) =>
        callback(base64),
      ),
  },
  windowControl: {
    setOpacity: (value: number) => ipcRenderer.invoke('set-opacity', value),
    getOpacity: () => ipcRenderer.invoke('get-opacity'),
  },
  api: {
    getOpenAIKey: () => ipcRenderer.invoke('get-openai-key'),
    setOpenAIKey: (key: string) => ipcRenderer.invoke('set-openai-key', key),
  },
  notifications: {
    onNotification: (callback: (message: string) => void) => 
      ipcRenderer.on('show-notification', (_event, message) => callback(message))
  }
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
