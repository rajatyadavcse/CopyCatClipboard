const { app, BrowserWindow, Tray, Menu, ipcMain, clipboard, nativeImage, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let tray;
const dbPath = path.join(__dirname, 'db.json');

// ---------- Safe DB Loader ----------
function loadHistory() {
  try {
    if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify([]));
    const data = fs.readFileSync(dbPath, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    fs.writeFileSync(dbPath, JSON.stringify([]));
    return [];
  }
}

function saveHistory(history) {
  fs.writeFileSync(dbPath, JSON.stringify(history, null, 2));
}

// ---------- Window ----------
function createWindow() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png'); // macOS-friendly tray icon

  tray = new Tray(iconPath);
  tray.setToolTip('CopyCat');

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
  mainWindow = new BrowserWindow({
    width: 350,
    height: 400,
    show: false,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('index.html');
  if (process.platform === 'darwin') app.dock.hide();
}

function toggleWindow() {
  if (mainWindow.isVisible()) mainWindow.hide();
  else mainWindow.show();
}


// ---------- Clipboard Monitor ----------
let lastText = '';
function monitorClipboard() {
  setInterval(() => {
    const text = clipboard.readText().trim();
    if (text && text !== lastText) {
      lastText = text;
      let history = loadHistory();
      if (!history.includes(text)) {
        history.unshift(text);
        if (history.length > 20) history.pop();
        saveHistory(history);
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send('update-history', history);
        }
      }
    }
  }, 1000);
}

// ---------- Handle Item Click ----------
ipcMain.on('paste-item', (event, text) => {
  clipboard.writeText(text);
});

//----------- Handle Close -----------
ipcMain.on('hide-window', () => {
  mainWindow.hide();
  // hide window
})

//----------- Handle Clear all -----------
ipcMain.on('clear-history', () => {
  saveHistory([]);
  mainWindow.webContents.send('update-history', []);
})

// ---------- App Ready ----------
app.whenReady().then(() => {
  createWindow();
  //createTray();
  monitorClipboard();

  const history = loadHistory();
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('update-history', history);
  });

  // Register global shortcut: Command + Shift + V
  globalShortcut.register('CommandOrControl+Shift+V', toggleWindow);
});

// ---------- Cleanup ----------
app.on('window-all-closed', (e) => e.preventDefault());
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
