# Electron Silent Printing Setup Guide

This guide explains how to set up silent printing in your Electron app for RestaurantOS.

## Overview

The app now supports automatic silent printing to POS printers when running in Electron. When you click any print button (POS Receipt, KOT Slip, Table Bill, Daily Sales Report), it will automatically print to the configured printer without showing the Windows print dialog.

## Features

- ✅ Silent printing (no dialog popup)
- ✅ Automatic printer detection
- ✅ Printer selection in Settings
- ✅ Fallback to browser print dialog if Electron is not available
- ✅ Works with all 4 slip types (POS Receipt, KOT, Table Bill, Daily Sales Report)

---

## Files Modified/Created for Printing Feature

### ✅ Frontend Files (Already Implemented)

#### 1. `src/utils/printUtils.ts` ✅ MODIFIED
**Status**: Already updated with Electron support
**What was changed**:
- Added `printerName` and `silentPrint` to `PrintSettings` interface
- Added `getElectronAPI()` function to detect and access Electron APIs
- Updated `printContent()` to use Electron silent printing when available
- Added `getAvailablePrinters()` function for printer detection
- Falls back to browser print dialog if Electron is not available

**Verification**: Check if file contains:
- `interface PrintSettings` with `printerName?: string` and `silentPrint: boolean`
- `getElectronAPI()` function
- `getAvailablePrinters()` function
- Electron detection logic in `printContent()`

#### 2. `src/pages/Settings.tsx` ✅ MODIFIED
**Status**: Already updated with printer settings UI
**What was changed**:
- Added printer settings state (`printerSettings`, `availablePrinters`)
- Added printer selection dropdown UI
- Added "Refresh Printers" button
- Added "Silent Printing" toggle switch
- Saves printer preferences to localStorage
- Only visible when Electron is detected

**Verification**: Check if file contains:
- Import: `getAvailablePrinters` from `@/utils/printUtils`
- State: `printerSettings`, `availablePrinters`, `isLoadingPrinters`
- UI section with printer dropdown and silent printing toggle
- Condition: `{(typeof window !== 'undefined' && ((window as any).electron || (window as any).require)) && (`

#### 3. `src/types/electron.d.ts` ✅ CREATED
**Status**: New file created
**What it does**:
- TypeScript type definitions for Electron IPC API
- Defines `ElectronAPI` interface with `print()` and `getPrinters()` methods
- Global window type augmentation

**Verification**: Check if file exists at `src/types/electron.d.ts` and contains:
- `interface ElectronAPI`
- `Window` interface augmentation

### 📋 Example Files (Reference Only - Need Electron Implementation)

#### 4. `electron-main.example.js` 📄 EXAMPLE FILE
**Status**: Example file - needs to be integrated into your actual Electron main process
**What it shows**:
- IPC handler for `get-printers` - returns list of available printers
- IPC handler for `print` - handles silent printing with HTML content
- Creates hidden BrowserWindow for printing

**Action Required**: 
- ✅ Check if you have an Electron main process file (e.g., `main.js`, `electron-main.js`, `main.ts`)
- ⚠️ If exists: Add IPC handlers from example to your existing file
- ⚠️ If not exists: Create main process file using example as template

**Key IPC Handlers Needed**:
```javascript
ipcMain.handle('get-printers', async () => { ... })
ipcMain.handle('print', async (event, { htmlContent, silent, printerName, paperSize }) => { ... })
```

#### 5. `electron-preload.example.js` 📄 EXAMPLE FILE
**Status**: Example file - needs to be integrated into your actual Electron preload script
**What it shows**:
- Exposes `window.electron` API securely via `contextBridge`
- Provides `print()` and `getPrinters()` methods to renderer process

**Action Required**:
- ✅ Check if you have a preload script file (e.g., `preload.js`, `preload.ts`)
- ⚠️ If exists: Add Electron API exposure to your existing preload file
- ⚠️ If not exists: Create preload file using example as template

**Key Code Needed**:
```javascript
contextBridge.exposeInMainWorld('electron', {
  print: (htmlContent, options) => ipcRenderer.invoke('print', { htmlContent, ...options }),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
});
```

---

## Verification Checklist for Windows Cursor AI

Use this checklist to verify what's already done and what needs to be implemented:

### Frontend Files (Should Already Exist) ✅

- [ ] **Check**: `src/utils/printUtils.ts` exists and contains:
  - [ ] `PrintSettings` interface with `printerName` and `silentPrint` fields
  - [ ] `getElectronAPI()` function
  - [ ] `getAvailablePrinters()` function
  - [ ] Electron detection in `printContent()`

- [ ] **Check**: `src/pages/Settings.tsx` exists and contains:
  - [ ] Import of `getAvailablePrinters` from `@/utils/printUtils`
  - [ ] Printer settings UI section (dropdown, toggle)
  - [ ] Electron detection condition for showing printer settings

- [ ] **Check**: `src/types/electron.d.ts` exists and contains:
  - [ ] `ElectronAPI` interface definition
  - [ ] Window interface augmentation

### Electron Files (Need to Verify/Create) ⚠️

- [ ] **Find**: Electron main process file
  - [ ] Check common locations: `main.js`, `electron-main.js`, `main.ts`, `electron-main.ts`
  - [ ] Check `package.json` for `"main"` field to find entry point
  - [ ] If found: Verify IPC handlers exist
  - [ ] If not found: Create using `electron-main.example.js` as template

- [ ] **Find**: Electron preload script file
  - [ ] Check common locations: `preload.js`, `preload.ts`
  - [ ] Check main process file for `preload` path in `webPreferences`
  - [ ] If found: Verify `window.electron` API is exposed
  - [ ] If not found: Create using `electron-preload.example.js` as template

- [ ] **Verify**: BrowserWindow configuration
  - [ ] `contextIsolation: true` is set
  - [ ] `nodeIntegration: false` is set
  - [ ] `preload` path points to your preload script

---

## Implementation Steps for Windows Cursor AI

### Step 1: Locate Your Electron Files

1. Check `package.json` for Electron configuration:
   ```json
   {
     "main": "main.js",  // or electron-main.js, etc.
     "scripts": {
       "electron": "electron ."
     }
   }
   ```

2. Find your main process file (the one specified in `package.json` → `main`)

3. Check if preload script is referenced in main process:
   ```javascript
   webPreferences: {
     preload: path.join(__dirname, 'preload.js')
   }
   ```

### Step 2: Add IPC Handlers to Main Process

If your main process file exists, add these handlers:

```javascript
// Get available printers
ipcMain.handle('get-printers', async () => {
  try {
    const printers = mainWindow.webContents.getPrinters();
    return printers.map(printer => ({
      name: printer.name,
      displayName: printer.displayName || printer.name,
    }));
  } catch (error) {
    console.error('Error getting printers:', error);
    return [];
  }
});

// Silent print
ipcMain.handle('print', async (event, { htmlContent, silent = true, printerName, paperSize }) => {
  try {
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    await printWindow.webContents.once('did-finish-load', async () => {
      const printOptions = {
        silent: silent,
        printBackground: true,
        deviceName: printerName || undefined,
        pageSize: paperSize === '58mm' ? '58mm' : '80mm',
      };

      printWindow.webContents.print(printOptions, (success, failureReason) => {
        if (!success) {
          console.error('Print failed:', failureReason);
        }
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      });
    });

    return { success: true };
  } catch (error) {
    console.error('Print error:', error);
    throw error;
  }
});
```

### Step 3: Add Preload Script API Exposure

If your preload script exists, add this code:

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  print: (htmlContent, options) => {
    return ipcRenderer.invoke('print', { htmlContent, ...options });
  },
  getPrinters: () => {
    return ipcRenderer.invoke('get-printers');
  },
});
```

### Step 4: Verify BrowserWindow Configuration

Ensure your main process creates BrowserWindow with:

```javascript
const mainWindow = new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'), // Your preload script path
    contextIsolation: true,  // Required
    nodeIntegration: false,   // Required
  },
});
```

## Setup Instructions

### 1. Install Electron (if not already installed)

```bash
npm install --save-dev electron
```

### 2. Create Main Process File

Create or update your Electron main process file (e.g., `main.js` or `electron-main.js`). See `electron-main.example.js` for a complete example.

Key points:
- Set up IPC handlers for `print` and `get-printers`
- Create a hidden BrowserWindow for printing
- Use `webContents.print()` with `silent: true` option

### 3. Create Preload Script

Create a preload script (e.g., `preload.js`). See `electron-preload.example.js` for a complete example.

This script exposes the Electron APIs securely to your React app via `window.electron`.

### 4. Update Your Main Process

In your main process file, make sure to:

```javascript
const mainWindow = new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true, // Required for security
    nodeIntegration: false, // Required for security
  },
});
```

### 5. Configure Printers in Settings

1. Open the app in Electron
2. Go to **Settings** → **System** tab
3. Scroll to **Invoice & Print Settings**
4. Click **"Refresh Printers"** to scan for available printers
5. Select your POS printer from the dropdown
6. Ensure **"Silent Printing"** toggle is enabled
7. Click **"Save Changes"**

## How It Works

1. **Detection**: The app automatically detects if it's running in Electron
2. **Print Request**: When you click print, the app checks if Electron is available
3. **Silent Print**: If Electron is available and silent printing is enabled, it uses Electron's `webContents.print()` API
4. **Fallback**: If Electron is not available, it falls back to the browser's print dialog

## Printer Selection

- **Default Printer**: Select "Default Printer" to use the system default printer
- **Specific Printer**: Select a specific printer name from the list
- **Refresh**: Click "Refresh Printers" to rescan for available printers

## Troubleshooting

### Printers not showing up?

1. Make sure your printer is installed and recognized by Windows
2. Click "Refresh Printers" button in Settings
3. Check Windows Printers & Scanners settings

### Still showing print dialog?

1. Check that "Silent Printing" toggle is enabled in Settings
2. Verify Electron is running (check `window.electron` in browser console)
3. Check Electron console for errors

### Print not working?

1. Check Electron main process console for errors
2. Verify IPC handlers are set up correctly
3. Check that printer name matches exactly (case-sensitive)

## API Reference

### Frontend API (printUtils.ts)

```typescript
// Print content silently
printContent(elementId: string, options?: PrintOptions): Promise<void>

// Get available printers
getAvailablePrinters(): Promise<Array<{ name: string; displayName: string }>>
```

### Electron IPC Handlers

```javascript
// Get printers
ipcMain.handle('get-printers', async () => {
  const printers = mainWindow.webContents.getPrinters();
  return printers.map(p => ({ name: p.name, displayName: p.displayName }));
});

// Print silently
ipcMain.handle('print', async (event, { htmlContent, silent, printerName, paperSize }) => {
  // Create hidden window and print
});
```

## Notes

- Silent printing only works in Electron (not in regular browser)
- Printer names are case-sensitive
- The app falls back gracefully to browser print dialog if Electron is not available
- All print settings are saved in localStorage for immediate use

