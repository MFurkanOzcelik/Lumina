import { app, BrowserWindow } from 'electron'
import path from 'path'

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public')

let win: BrowserWindow | null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC, 'logo.png'), // Logo dosyan burada önemli
    webPreferences: {
      preload: path.join(__dirname, 'preload.ts'),
      nodeIntegration: true,
      contextIsolation: false, // Güvenlik için normalde true olmalı ama başlangıç için false kalabilir
    },
    autoHideMenuBar: true, // Üstteki dosya/düzen menüsünü gizler
  })

  // Geliştirme ortamındaysan localhost'u, build alındıysa html dosyasını yükle
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'))
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

app.whenReady().then(createWindow)