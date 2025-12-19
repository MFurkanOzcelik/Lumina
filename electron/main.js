const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const isDev = process.env.NODE_ENV === 'development';

// Configure logging for auto-updater
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

let mainWindow;
let fileToOpen = null;
let isQuitting = false;

// Single instance lock - prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Another instance is already running, quit this one
  app.quit();
} else {
  // Handle second instance (when user tries to open another file)
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      
      // Check if a file was passed as argument
      const supportedExtensions = ['.lum', '.txt', '.md', '.json', '.pdf'];
      const filePath = commandLine.slice(1).find(arg => {
        const ext = path.extname(arg).toLowerCase();
        return supportedExtensions.includes(ext) && fs.existsSync(arg);
      });
      
      if (filePath) {
        log.info('File opened via second instance:', filePath);
        readAndSendFile(path.resolve(filePath));
      }
    }
  });
}

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

  // F12 key handler for fullscreen toggle
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown') {
      // F12 - Toggle fullscreen
      if (input.key === 'F12') {
        const isFullScreen = mainWindow.isFullScreen();
        mainWindow.setFullScreen(!isFullScreen);
        event.preventDefault();
      }
      // ESC - Exit fullscreen
      else if (input.key === 'Escape' && mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false);
        // Don't prevent default to allow other ESC handlers
      }
    }
  });

  // Handle window close event - Event Ping-Pong Pattern
  mainWindow.on('close', (event) => {
    console.log('[MAIN] Close event triggered');
    log.info('Close event triggered');
    
    // Step 2: If already authorized to quit, allow close
    if (isQuitting) {
      console.log('[MAIN] isQuitting=true, allowing close');
      log.info('isQuitting=true, allowing close');
      return;
    }

    // Step 3: BLOCK the closing immediately
    event.preventDefault();
    console.log('[MAIN] Close prevented, checking for unsaved changes');
    log.info('Close prevented, checking for unsaved changes');

    // Step 4: Send IPC to Renderer to check unsaved changes
    mainWindow.webContents.send('check-unsaved-changes');
    console.log('[MAIN] Sent check-unsaved-changes to renderer');
    log.info('Sent check-unsaved-changes to renderer');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Handle file opening on Windows/Linux (when app is not running)
if (process.platform === 'win32' || process.platform === 'linux') {
  // Check if any supported file was passed as argument
  // Skip electron executable and script paths
  const supportedExtensions = ['.lum', '.txt', '.md', '.json', '.pdf'];
  const filePath = process.argv.slice(1).find(arg => {
    const ext = path.extname(arg).toLowerCase();
    return supportedExtensions.includes(ext) && fs.existsSync(arg);
  });
  
  if (filePath) {
    fileToOpen = path.resolve(filePath);
    log.info('File to open on startup:', fileToOpen);
  }
}

// Handle file opening on macOS (open-file event)
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  const supportedExtensions = ['.lum', '.txt', '.md', '.json', '.pdf'];
  const ext = path.extname(filePath).toLowerCase();
  
  if (supportedExtensions.includes(ext)) {
    fileToOpen = filePath;
    log.info('File opened via open-file event:', filePath);
    if (mainWindow) {
      // If window is already open, send the file content
      readAndSendFile(filePath);
    }
  }
});

// Function to read and send file content to renderer
function readAndSendFile(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath, ext);
    
    // For PDF files, send the file path directly (renderer will handle display)
    if (ext === '.pdf') {
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('open-external-file', {
          fileName,
          content: '', // Empty for PDF
          filePath,
          fileType: ext,
          isPdf: true
        });
        
        // Focus the window
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
        
        log.info('PDF file sent to renderer:', filePath);
      }
      return;
    }
    
    // For text files, read content
    const content = fs.readFileSync(filePath, 'utf-8');
    
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('open-external-file', {
        fileName,
        content,
        filePath,
        fileType: ext,
        isPdf: false
      });
      
      // Focus the window
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      
      log.info('File sent to renderer:', filePath);
    }
  } catch (error) {
    log.error('Error reading file:', error);
    console.error('Error reading file:', error);
  }
}

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  log.info('Update available:', info);
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('update-available', info);
  }
});

autoUpdater.on('update-not-available', (info) => {
  log.info('Update not available:', info);
});

autoUpdater.on('error', (err) => {
  log.error('Error in auto-updater:', err);
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('update-error', err.message);
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  let logMessage = `Download speed: ${progressObj.bytesPerSecond}`;
  logMessage = `${logMessage} - Downloaded ${progressObj.percent}%`;
  logMessage = `${logMessage} (${progressObj.transferred}/${progressObj.total})`;
  log.info(logMessage);
  
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('download-progress', progressObj);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded:', info);
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('update-downloaded', info);
  }
});

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

  // Check for updates (only in production)
  if (!isDev) {
    // Wait a bit for the window to load before checking for updates
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 3000);
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

// Handle update installation
ipcMain.handle('install-update', () => {
  log.info('User requested to install update');
  autoUpdater.quitAndInstall(false, true);
});

// Storage IPC handlers
const userDataPath = app.getPath('userData');
const notesPath = path.join(userDataPath, 'notes.json');
const foldersPath = path.join(userDataPath, 'folders.json');
const settingsPath = path.join(userDataPath, 'settings.json');

// Ensure user data directory exists
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}

ipcMain.handle('storage:getNotes', async () => {
  try {
    if (fs.existsSync(notesPath)) {
      const data = fs.readFileSync(notesPath, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    log.error('Error reading notes:', error);
    return [];
  }
});

ipcMain.handle('storage:saveNotes', async (event, notes) => {
  try {
    fs.writeFileSync(notesPath, JSON.stringify(notes, null, 2), 'utf-8');
    return true;
  } catch (error) {
    log.error('Error saving notes:', error);
    return false;
  }
});

ipcMain.handle('storage:getFolders', async () => {
  try {
    if (fs.existsSync(foldersPath)) {
      const data = fs.readFileSync(foldersPath, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    log.error('Error reading folders:', error);
    return [];
  }
});

ipcMain.handle('storage:saveFolders', async (event, folders) => {
  try {
    fs.writeFileSync(foldersPath, JSON.stringify(folders, null, 2), 'utf-8');
    return true;
  } catch (error) {
    log.error('Error saving folders:', error);
    return false;
  }
});

ipcMain.handle('storage:getSettings', async () => {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf-8');
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    log.error('Error reading settings:', error);
    return {};
  }
});

ipcMain.handle('storage:saveSettings', async (event, settings) => {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
    return true;
  } catch (error) {
    log.error('Error saving settings:', error);
    return false;
  }
});

ipcMain.handle('storage:clearAll', async () => {
  try {
    if (fs.existsSync(notesPath)) fs.unlinkSync(notesPath);
    if (fs.existsSync(foldersPath)) fs.unlinkSync(foldersPath);
    if (fs.existsSync(settingsPath)) fs.unlinkSync(settingsPath);
    return true;
  } catch (error) {
    log.error('Error clearing storage:', error);
    return false;
  }
});

ipcMain.handle('storage:getUserDataPath', async () => {
  return userDataPath;
});

// EVENT PING-PONG PATTERN: Step 3 - Receive unsaved changes status from Renderer
ipcMain.on('unsaved-changes-status', async (event, data) => {
  const { isDirty, language } = data;
  console.log('[MAIN] Received unsaved-changes-status. isDirty:', isDirty, 'language:', language);
  log.info('Received unsaved-changes-status. isDirty:', isDirty, 'language:', language);

  // Get translations based on language
  const translations = {
    en: {
      title: 'Unsaved Changes',
      message: 'Do you want to save changes?',
      detail: 'Your changes will be lost if you don\'t save them.',
      save: 'Save',
      dontSave: 'Don\'t Save',
      cancel: 'Cancel'
    },
    tr: {
      title: 'Kaydedilmemiş Değişiklikler',
      message: 'Değişiklikler kaydedilsin mi?',
      detail: 'Kaydetmezseniz yaptığınız değişiklikler kaybolacak.',
      save: 'Kaydet',
      dontSave: 'Kaydetme',
      cancel: 'İptal'
    }
  };

  const t = translations[language] || translations.en;

  if (!isDirty) {
    // No unsaved changes, allow close
    console.log('[MAIN] No unsaved changes, closing app');
    log.info('No unsaved changes, closing app');
    isQuitting = true;
    mainWindow.close();
    return;
  }

  // Unsaved changes exist, show dialog
  console.log('[MAIN] Unsaved changes detected, showing dialog');
  log.info('Unsaved changes detected, showing dialog');

  try {
    const response = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: [t.save, t.dontSave, t.cancel],
      defaultId: 0,
      cancelId: 2,
      title: t.title,
      message: t.message,
      detail: t.detail,
    });

    console.log('[MAIN] User choice:', response.response);
    log.info('User choice:', response.response);

    if (response.response === 0) {
      // Save button clicked
      console.log('[MAIN] User chose to save, sending save-before-quit');
      log.info('User chose to save, sending save-before-quit');
      mainWindow.webContents.send('save-before-quit');
    } else if (response.response === 1) {
      // Don't Save button clicked
      console.log('[MAIN] User chose not to save, closing app');
      log.info('User chose not to save, closing app');
      isQuitting = true;
      mainWindow.close();
    } else {
      // Cancel button clicked (response === 2)
      console.log('[MAIN] User cancelled close');
      log.info('User cancelled close');
      // Do nothing, window stays open
    }
  } catch (error) {
    console.error('[MAIN] Error showing dialog:', error);
    log.error('Error showing dialog:', error);
    // On error, allow close
    isQuitting = true;
    mainWindow.close();
  }
});

// Handle save completed notification from renderer
ipcMain.on('save-completed', () => {
  console.log('[MAIN] Save completed, closing app');
  log.info('Save completed, closing app');
  isQuitting = true;
  if (mainWindow) {
    mainWindow.close();
  }
});

// Export to PDF handler
ipcMain.handle('export:pdf', async (event, { title, htmlContent }) => {
  try {
    // Show save dialog
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export as PDF',
      defaultPath: `${title || 'Untitled Note'}.pdf`,
      filters: [
        { name: 'PDF Document', extensions: ['pdf'] }
      ]
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    // Create a hidden window for PDF generation
    const pdfWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      }
    });

    // Load HTML content with styling
    const styledHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 40px auto;
              padding: 20px;
            }
            h1 {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 20px;
              color: #1a1a1a;
              border-bottom: 2px solid #e0e0e0;
              padding-bottom: 10px;
            }
            h2 {
              font-size: 24px;
              font-weight: bold;
              margin-top: 24px;
              margin-bottom: 12px;
              color: #2a2a2a;
            }
            h3 {
              font-size: 20px;
              font-weight: bold;
              margin-top: 20px;
              margin-bottom: 10px;
              color: #3a3a3a;
            }
            p {
              margin-bottom: 12px;
            }
            ul, ol {
              margin-bottom: 12px;
              padding-left: 30px;
            }
            li {
              margin-bottom: 6px;
            }
            strong {
              font-weight: bold;
            }
            em {
              font-style: italic;
            }
            code {
              background-color: #f5f5f5;
              padding: 2px 6px;
              border-radius: 3px;
              font-family: 'Courier New', monospace;
              font-size: 0.9em;
            }
            pre {
              background-color: #f5f5f5;
              padding: 16px;
              border-radius: 6px;
              overflow-x: auto;
              margin-bottom: 16px;
            }
            pre code {
              background-color: transparent;
              padding: 0;
            }
            blockquote {
              border-left: 4px solid #e0e0e0;
              padding-left: 16px;
              margin-left: 0;
              color: #666;
            }
          </style>
        </head>
        <body>
          <h1>${title || 'Untitled Note'}</h1>
          ${htmlContent}
        </body>
      </html>
    `;

    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(styledHtml)}`);

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate PDF
    const pdfData = await pdfWindow.webContents.printToPDF({
      printBackground: true,
      marginsType: 1, // Default margins
      pageSize: 'A4',
    });

    // Write PDF to file
    fs.writeFileSync(filePath, pdfData);

    // Close the hidden window
    pdfWindow.close();

    log.info('PDF exported successfully:', filePath);
    return { success: true, filePath };
  } catch (error) {
    log.error('Error exporting PDF:', error);
    return { success: false, error: error.message };
  }
});

