const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')
const fs = require('fs')

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public')

let mainWindow = null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

// Get the persistent user data directory
const USER_DATA_PATH = app.getPath('userData')
const NOTES_FILE = path.join(USER_DATA_PATH, 'notes.json')
const FOLDERS_FILE = path.join(USER_DATA_PATH, 'folders.json')
const SETTINGS_FILE = path.join(USER_DATA_PATH, 'settings.json')

// Ensure user data directory exists
if (!fs.existsSync(USER_DATA_PATH)) {
  fs.mkdirSync(USER_DATA_PATH, { recursive: true })
}

console.log('User data will be stored in:', USER_DATA_PATH)

// ============================================================================
// SINGLE INSTANCE LOCK - Prevent multiple app instances
// ============================================================================
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  // Başka bir örnek çalışıyorsa çık
  console.log('[MAIN] Another instance is already running. Exiting.')
  app.quit()
  process.exit(0)
}

// İkinci örnek açılmaya çalışırsa, mevcut pencereyi öne getir ve dosyayı aç
app.on('second-instance', (_event, commandLine) => {
  console.log('[MAIN] Second instance detected. Focusing primary window.')

  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }

  const filePath = extractFileArg(commandLine)
  if (filePath) {
    console.log('[MAIN] Opening file from second instance:', filePath)
    handleFileOpen(filePath)
  }
})

// ============================================================================
// FILE OPENING HELPER FUNCTION
// ============================================================================
function handleFileOpen(filePath) {
  if (!mainWindow || !fs.existsSync(filePath)) {
    console.warn('[MAIN] Dosya açılamıyor:', filePath)
    return
  }

  try {
    const fileType = path.extname(filePath).toLowerCase()
    const fileName = path.basename(filePath, path.extname(filePath))
    
    console.log('[MAIN] Dosya renderer\'a gönderiliyor:', fileName, fileType)
    
    // PDF dosyaları için özel işlem - dosya yolunu gönder, içeriğini değil
    if (fileType === '.pdf') {
      mainWindow.webContents.send('open-external-file', {
        fileName,
        content: '',
        fileType,
        filePath,
        isPdf: true
      })
      return
    }

    // .lum dosyaları: içeriği oku ve gönder
    if (fileType === '.lum') {
      const content = fs.readFileSync(filePath, 'utf-8')

      mainWindow.webContents.send('open-external-file', {
        fileName,
        content,
        fileType,
        filePath,
        isPdf: false
      })

      // Eski kanal uyumluluğu (varsa)
      mainWindow.webContents.send('open-lum-file', {
        fileName,
        content,
        filePath
      })
      return
    }

    // Diğer metin tabanlı dosyalar
    const content = fs.readFileSync(filePath, 'utf-8')

    mainWindow.webContents.send('open-external-file', {
      fileName,
      content,
      fileType,
      filePath: undefined,
      isPdf: false
    })
  } catch (error) {
    console.error('[MAIN] Dosya okunurken hata:', error)
  }
}

// Komut satırı argümanlarından açılacak dosyayı çıkarır (.lum / .pdf)
function extractFileArg(argv = []) {
  for (let i = argv.length - 1; i >= 0; i -= 1) {
    const arg = argv[i]
    if (typeof arg !== 'string') continue

    const lower = arg.toLowerCase()
    const isSupported = lower.endsWith('.lum') || lower.endsWith('.pdf')
    if (isSupported && fs.existsSync(arg)) {
      return arg
    }
  }
  return null
}

function createWindow() {
  const iconPath = process.platform === 'win32' 
    ? path.join(process.env.VITE_PUBLIC || '', 'icon.ico')
    : path.join(process.env.VITE_PUBLIC || '', 'logo.png')
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
    autoHideMenuBar: true,
    fullscreen: false,
    show: false,
  })

  // Maximize and show when ready
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.maximize()
      mainWindow.show()
      
      // Komut satırından gelen ilk dosyayı (pdf/lum) aç
      const filePath = extractFileArg(process.argv)
      if (filePath) {
        console.log('[MAIN] Opening file from startup:', filePath)
        setTimeout(() => handleFileOpen(filePath), 1000)
      }
    }
  })

  // Dereference the window object when closed
  mainWindow.on('closed', () => {
    console.log('[MAIN] Window closed event - dereferencing window')
    mainWindow = null
  })

  // Load the app
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(process.env.DIST || '', 'index.html'))
  }
}

// ============================================================================
// FILE OPENING - macOS SUPPORT
// ============================================================================
app.on('open-file', (event, filePath) => {
  event.preventDefault()
  console.log('[MAIN] macOS open-file event:', filePath)
  
  if (mainWindow) {
    handleFileOpen(filePath)
  } else {
    // Store file path to open after window is created
    app.once('ready', () => {
      setTimeout(() => handleFileOpen(filePath), 1000)
    })
  }
})

// ============================================================================
// STANDARD ELECTRON LIFECYCLE EVENTS - DO NOT MODIFY
// ============================================================================

// Quit when all windows are closed (Windows & Linux)
app.on('window-all-closed', () => {
  console.log('[MAIN] window-all-closed event fired')
  if (process.platform !== 'darwin') {
    console.log('[MAIN] Calling app.quit()')
    app.quit()
  }
})

// On macOS, re-create window when dock icon is clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Create window when app is ready
app.whenReady().then(() => {
  createWindow()
  
  // Register FORCE QUIT shortcut: Ctrl+Shift+Q (for debugging)
  globalShortcut.register('CommandOrControl+Shift+Q', () => {
    console.log('[MAIN] ⚡ FORCE QUIT shortcut pressed - calling app.exit(0)')
    app.exit(0) // Force immediate exit, bypassing all events
  })
  
  console.log('[MAIN] ✅ App ready. Force quit shortcut: Ctrl+Shift+Q')

  // Configure auto-updater
  try {
    autoUpdater.autoDownload = true
    autoUpdater.on('update-available', (info) => {
      if (mainWindow) mainWindow.webContents.send('update-available', info)
    })
    autoUpdater.on('update-downloaded', (info) => {
      if (mainWindow) mainWindow.webContents.send('update-downloaded', info)
    })
    autoUpdater.on('download-progress', (progress) => {
      if (mainWindow) mainWindow.webContents.send('download-progress', progress)
    })
    autoUpdater.on('error', (err) => {
      if (mainWindow) mainWindow.webContents.send('update-error', String(err))
    })
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.warn('[MAIN] autoUpdater check error:', err)
    })
  } catch (e) {
    console.warn('[MAIN] autoUpdater init failed:', e)
  }
})

// Unregister shortcuts on quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// ============================================================================
// STORAGE HELPER FUNCTIONS
// ============================================================================

function readJsonFile(filePath, defaultValue = null) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(data)
    }
    return defaultValue
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error)
    return defaultValue
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return true
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error)
    return false
  }
}

// ============================================================================
// IPC HANDLERS FOR PERSISTENT STORAGE
// ============================================================================

ipcMain.handle('storage:getNotes', async () => {
  return readJsonFile(NOTES_FILE, [])
})

ipcMain.handle('storage:saveNotes', async (_event, notes) => {
  return writeJsonFile(NOTES_FILE, notes)
})

ipcMain.handle('storage:getFolders', async () => {
  return readJsonFile(FOLDERS_FILE, [])
})

ipcMain.handle('storage:saveFolders', async (_event, folders) => {
  return writeJsonFile(FOLDERS_FILE, folders)
})

ipcMain.handle('storage:getSettings', async () => {
  return readJsonFile(SETTINGS_FILE, null)
})

ipcMain.handle('storage:saveSettings', async (_event, settings) => {
  return writeJsonFile(SETTINGS_FILE, settings)
})

ipcMain.handle('storage:clearAll', async () => {
  try {
    if (fs.existsSync(NOTES_FILE)) fs.unlinkSync(NOTES_FILE)
    if (fs.existsSync(FOLDERS_FILE)) fs.unlinkSync(FOLDERS_FILE)
    if (fs.existsSync(SETTINGS_FILE)) fs.unlinkSync(SETTINGS_FILE)
    return true
  } catch (error) {
    console.error('Error clearing storage:', error)
    return false
  }
})

ipcMain.handle('storage:getUserDataPath', async () => {
  return USER_DATA_PATH
})

// ============================================================================
// MISC IPC HANDLERS (App Info, Updater)
// ============================================================================

ipcMain.handle('get-app-version', async () => app.getVersion())
ipcMain.handle('get-app-path', async () => app.getAppPath())
ipcMain.handle('install-update', async () => {
  try {
    autoUpdater.quitAndInstall()
    return true
  } catch (e) {
    console.error('[MAIN] install-update error:', e)
    return false
  }
})

