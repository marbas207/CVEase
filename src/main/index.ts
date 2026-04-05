import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initDatabase } from './db/database'
import { registerAllHandlers } from './ipc'

function createWindow(): void {
  // In dev: build/icon.ico relative to project root
  // In production: resources/icon.ico next to the app
  const iconPath = is.dev
    ? join(__dirname, '../../build/icon.ico')
    : join(process.resourcesPath, 'icon.ico')

  const mainWindow = new BrowserWindow({
    title: 'CVEase',
    icon: iconPath,
    width: 1600,
    height: 900,
    minWidth: 1200,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.cvease')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize DB after app is ready (userData path available)
  initDatabase()
  registerAllHandlers()

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
