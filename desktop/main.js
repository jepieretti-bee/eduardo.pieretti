const { app, BrowserWindow } = require('electron');
const path = require('node:path');

const PORT = process.env.PORT || '4750';

let win;

async function startServer() {
  process.env.DB_DIR = app.getPath('userData');
  process.env.STATIC_DIR = path.join(__dirname, 'server-src', 'public');
  process.env.PORT = PORT;

  const serverPath = path.join(__dirname, 'server-src', 'app.js');
  const { default: expressApp } = await import(`file://${serverPath}`);

  await new Promise((resolve, reject) => {
    const server = expressApp.listen(PORT, resolve);
    server.on('error', reject);
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1040,
    minHeight: 660,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadURL(`http://localhost:${PORT}`);
}

app.whenReady().then(async () => {
  await startServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
