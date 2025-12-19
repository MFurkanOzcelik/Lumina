import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public')

let win: BrowserWindow | null
let isQuitting = false

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
  // Use high-resolution .ico file for Windows taskbar and desktop
  // In production, files are in VITE_PUBLIC (which points to dist or public)
  const iconPath = process.platform === 'win32' 
    ? path.join(process.env.VITE_PUBLIC || '', 'icon.ico')
    : path.join(process.env.VITE_PUBLIC || '', 'logo.png')
  
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true, // Security: isolate context
    },
    autoHideMenuBar: true, // Üstteki dosya/düzen menüsünü gizler
    fullscreen: false, // Don't start in fullscreen mode
    show: false, // Don't show until ready
  })

  // Maximize window when ready to show
  win.once('ready-to-show', () => {
    win?.maximize()
    win?.show()
  })

  // Handle window close event - check for unsaved changes
  win.on('close', async (event) => {
    console.log('[MAIN] Close event triggered, isQuitting:', isQuitting)
    
    if (isQuitting) {
      return // Allow close if quitting
    }

    // Prevent immediate close
    event.preventDefault()

    try {
      // Ask renderer if there are unsaved changes
      const hasUnsavedChanges = await win?.webContents.executeJavaScript(
        'window.__checkUnsavedChanges ? window.__checkUnsavedChanges() : false'
      )

      console.log('[MAIN] Unsaved changes check result:', hasUnsavedChanges)

      if (!hasUnsavedChanges) {
        // No unsaved changes, proceed with close
        console.log('[MAIN] No unsaved changes, closing app')
        isQuitting = true
        win?.close()
        return
      }

      // Has unsaved changes - tell renderer to show custom modal
      console.log('[MAIN] Unsaved changes detected, sending show-unsaved-changes-modal to renderer')
      win?.webContents.send('show-unsaved-changes-modal')
    } catch (error) {
      console.error('[MAIN] Error handling window close:', error)
      // On error, allow close
      isQuitting = true
      win?.close()
    }
  })

  // Geliştirme ortamındaysan localhost'u, build alındıysa html dosyasını yükle
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST || '', 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Storage helper functions
function readJsonFile(filePath: string, defaultValue: any = null): any {
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

function writeJsonFile(filePath: string, data: any): boolean {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return true
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error)
    return false
  }
}

// IPC Handlers for persistent storage
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

// Unsaved Changes Modal Actions
ipcMain.on('unsaved-changes:save', async () => {
  console.log('[MAIN] Received unsaved-changes:save')
  try {
    // Tell renderer to save changes
    await win?.webContents.executeJavaScript(
      'window.__saveChanges ? window.__saveChanges() : Promise.resolve()'
    )
    console.log('[MAIN] Save completed, closing app')
    isQuitting = true
    win?.close()
  } catch (error) {
    console.error('[MAIN] Error saving before quit:', error)
    isQuitting = true
    win?.close()
  }
})

ipcMain.on('unsaved-changes:dont-save', () => {
  console.log('[MAIN] Received unsaved-changes:dont-save, closing without saving')
  isQuitting = true
  win?.close()
})

app.whenReady().then(createWindow)