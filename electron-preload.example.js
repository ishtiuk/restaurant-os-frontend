/**
 * Example Electron Preload Script
 * 
 * This file exposes Electron APIs to the renderer process securely.
 * 
 * To use this:
 * 1. Copy this file to preload.js in your Electron project
 * 2. Reference it in your main process file (see electron-main.example.js)
 * 3. Make sure contextIsolation is enabled in your BrowserWindow webPreferences
 * 
 * IMPORTANT: This is an EXAMPLE file. You need to integrate it with your actual Electron setup.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  print: (htmlContent, options) => {
    return ipcRenderer.invoke('print', { htmlContent, ...options });
  },
  getPrinters: () => {
    return ipcRenderer.invoke('get-printers');
  },
});

