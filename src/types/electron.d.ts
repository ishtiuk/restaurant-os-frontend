// Type definitions for Electron IPC API (if available)
export interface ElectronAPI {
  print: (htmlContent: string, options: { silent?: boolean; printerName?: string; paperSize?: string }) => Promise<void>;
  getPrinters: () => Promise<Array<{ name: string; displayName: string }>>;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
    require?: (module: string) => any;
  }
}

export {};
