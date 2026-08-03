const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const ini = require('ini');

// Keep a global reference of the window object
let mainWindow;

// Path to settings.ini (works in both dev and production)
const settingsPath = path.join(__dirname, '..', 'src', 'settings', 'settings.ini');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false, // Show when ready to avoid white flash
  });

  // Load the app
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Optional: open DevTools in development
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ========== Settings IPC ==========

// Read settings.ini and return as object
ipcMain.handle('settings:get', () => {
  try {
    if (!fs.existsSync(settingsPath)) {
      return {};
    }
    const content = fs.readFileSync(settingsPath, 'utf-8');
    return ini.parse(content);
  } catch (err) {
    console.error('Failed to read settings.ini:', err);
    return {};
  }
});

// Write settings object back to settings.ini
ipcMain.handle('settings:set', (event, newSettings) => {
  try {
    const content = ini.stringify(newSettings);
    fs.writeFileSync(settingsPath, content, 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to write settings.ini:', err);
    return false;
  }
});

// ========== App lifecycle ==========

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
