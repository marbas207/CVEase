import { app, shell, BrowserWindow, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import log from 'electron-log/main'
import { initDatabase } from './db/database'
import { registerAllHandlers } from './ipc'
import { startFollowupNotifier } from './notifications'

// File-backed logging. Writes to:
//   Windows: %APPDATA%/cvease/logs/main.log
//   macOS:   ~/Library/Logs/cvease/main.log
//   Linux:   ~/.config/cvease/logs/main.log
//
// `initialize()` wires renderer-side logging through IPC; `console.log` calls
// in any main-process code will now also land in the file. Useful when a
// packaged build crashes and the user can't easily produce a stack trace.
log.initialize()
log.transports.file.level = 'info'
log.transports.console.level = is.dev ? 'debug' : 'info'
log.transports.file.maxSize = 5 * 1024 * 1024 // 5 MB before rotation
Object.assign(console, log.functions)

log.info('---')
log.info(`CVEase starting (${app.getVersion()}, electron ${process.versions.electron}, ${is.dev ? 'dev' : 'prod'})`)
log.info(`log file: ${log.transports.file.getFile().path}`)

process.on('uncaughtException', (err) => {
  log.error('uncaughtException:', err)
})
process.on('unhandledRejection', (reason) => {
  log.error('unhandledRejection:', reason)
})

const PROD_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://www.google.com",
  "font-src 'self' data:",
  "connect-src 'self' https://www.google.com",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'"
].join('; ')

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
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
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
  // Must match `build.appId` in package.json — Windows uses this AUMID to
  // tie native toast notifications back to the registered Start Menu
  // shortcut. A mismatch makes Windows silently drop every notification.
  electronApp.setAppUserModelId('com.cvease.app')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Apply a strict CSP in production. In dev, electron-vite's HMR needs
  // websocket + inline-eval support, so the meta tag is omitted there.
  if (!is.dev) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [PROD_CSP]
        }
      })
    })
  }

  // Refuse navigation away from the app's own pages.
  app.on('web-contents-created', (_e, contents) => {
    contents.on('will-navigate', (event, url) => {
      const parsed = new URL(url)
      const isDevServer =
        is.dev &&
        process.env['ELECTRON_RENDERER_URL'] &&
        url.startsWith(process.env['ELECTRON_RENDERER_URL'])
      if (parsed.protocol !== 'file:' && !isDevServer) {
        event.preventDefault()
        shell.openExternal(url)
      }
    })
  })

  // Initialize DB after app is ready (userData path available)
  log.info('initializing database')
  initDatabase()
  log.info('registering IPC handlers')
  registerAllHandlers()

  log.info('creating main window')
  createWindow()

  // Start the follow-up notification scheduler. The getter pattern means we
  // always grab the *current* main window — important on macOS where the
  // window can be recreated after a dock-click activation.
  startFollowupNotifier(() => BrowserWindow.getAllWindows()[0] ?? null)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
