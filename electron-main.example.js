/**
 * Example Electron Main Process File
 * 
 * This file shows how to set up Electron IPC handlers for silent printing.
 * 
 * To use this:
 * 1. Install electron: npm install --save-dev electron
 * 2. Copy this file to your Electron main process file (e.g., main.js)
 * 3. Update your package.json to point to this file as the main entry
 * 4. Create a preload.js file (see electron-preload.example.js)
 * 
 * IMPORTANT: This is an EXAMPLE file. You need to integrate it with your actual Electron setup.
 */

const { app, BrowserWindow, ipcMain, webContents } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Path to your preload script
      contextIsolation: true, // Recommended for security
      nodeIntegration: false, // Recommended for security
    },
  });

  // Load your React app (adjust URL based on your setup)
  // For production: mainWindow.loadFile('dist/index.html')
  // For development: mainWindow.loadURL('http://localhost:8080')
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:8080');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler: Get available printers
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

// IPC Handler: Silent print
ipcMain.handle('print', async (event, { htmlContent, silent = true, printerName, paperSize }) => {
  try {
    // Create a hidden BrowserWindow for printing
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // Load HTML content
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    // Wait for content to load
    await printWindow.webContents.once('did-finish-load', async () => {
      // Get printer options
      const printOptions = {
        silent: silent,
        printBackground: true,
        deviceName: printerName || undefined, // Use default if not specified
        pageSize: paperSize === '58mm' ? '58mm' : '80mm',
      };

      // Print
      printWindow.webContents.print(printOptions, (success, failureReason) => {
        if (!success) {
          console.error('Print failed:', failureReason);
        }
        
        // Close the print window after printing
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

