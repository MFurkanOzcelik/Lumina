const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron')
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

