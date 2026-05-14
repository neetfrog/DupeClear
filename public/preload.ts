import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openDirectory: () => ipcRenderer.invoke('open-directory'),
  openFile: () => ipcRenderer.invoke('open-file'),
  onShowAbout: (callback: () => void) => {
    ipcRenderer.on('show-about', callback);
  },
});

declare global {
  interface Window {
    electronAPI: {
      openDirectory: () => Promise<string[]>;
      openFile: () => Promise<string[]>;
      onShowAbout: (callback: () => void) => void;
    };
  }
}
