const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let fileToOpen = null;

function createWindow() {
  // Determine icon path based on environment
  // Use ICO for Windows, PNG for others
  const iconPath = isDev 
    ? path.join(__dirname, '../public/logo.ico')
    : path.join(__dirname, '../dist/logo.ico');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: iconPath,
    backgroundColor: '#1a1f2e',
    show: false,
    frame: true,
    titleBarStyle: 'default',
    title: 'Lumina',
    autoHideMenuBar: true, // Hide menu bar (File, Edit, etc.)
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173').catch((err) => {
      console.error('Failed to load dev server:', err);
      // If dev server fails, show error
      mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
        <html>
          <body style="background: #1a1f2e; color: white; font-family: Arial; padding: 40px; text-align: center;">
            <h1>⚠️ Geliştirme Sunucusu Bulunamadı</h1>
            <p>Lütfen önce Vite dev server'ı başlatın:</p>
            <pre style="background: #2a2f3e; padding: 20px; border-radius: 8px; display: inline-block;">npm run dev</pre>
            <p>Veya doğru komutu kullanın:</p>
            <pre style="background: #2a2f3e; padding: 20px; border-radius: 8px; display: inline-block;">npm run electron:dev</pre>
            <p style="margin-top: 40px; color: #888;">Port: 5173 | Hata: ${err.message}</p>
          </body>
        </html>
      `)}`);
    });
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error('Failed to load production build:', err);
      mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
        <html>
          <body style="background: #1a1f2e; color: white; font-family: Arial; padding: 40px; text-align: center;">
            <h1>⚠️ Build Dosyası Bulunamadı</h1>
            <p>Lütfen önce production build alın:</p>
            <pre style="background: #2a2f3e; padding: 20px; border-radius: 8px; display: inline-block;">npm run build</pre>
            <p style="margin-top: 40px; color: #888;">Aranan dosya: ${indexPath}</p>
          </body>
        </html>
      `)}`);
    });
  }

  // Remove menu bar completely
  mainWindow.setMenu(null);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Set taskbar icon for Windows (better rendering)
    if (process.platform === 'win32') {
      mainWindow.setIcon(iconPath);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Handle file opening on Windows/Linux (when app is not running)
if (process.platform === 'win32' || process.platform === 'linux') {
  // Check if a .lum file was passed as argument
  const filePath = process.argv.find(arg => arg.endsWith('.lum'));
  if (filePath && fs.existsSync(filePath)) {
    fileToOpen = filePath;
  }
}

// Handle file opening on macOS (open-file event)
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (filePath.endsWith('.lum')) {
    fileToOpen = filePath;
    if (mainWindow) {
      // If window is already open, send the file content
      readAndSendFile(filePath);
    }
  }
});

// Function to read and send file content to renderer
function readAndSendFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.lum');
    
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('open-lum-file', {
        fileName,
        content,
        filePath
      });
      
      // Focus the window
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  } catch (error) {
    console.error('Error reading .lum file:', error);
  }
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  
  // If a file was queued to open, send it after window is ready
  if (fileToOpen) {
    mainWindow.webContents.once('did-finish-load', () => {
      setTimeout(() => {
        readAndSendFile(fileToOpen);
        fileToOpen = null;
      }, 1000); // Wait for React to initialize
    });
  }

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

// Handle IPC messages if needed
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

