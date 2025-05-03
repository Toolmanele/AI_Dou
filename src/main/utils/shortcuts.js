import { globalShortcut } from 'electron'
import { getWindow } from './window'

function registerShortcuts() {
  // 注册 F12 快捷键打开开发者工具
  globalShortcut.register('F12', () => {
    const mainWindow = getWindow()
    if (mainWindow) {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools()
      } else {
        mainWindow.webContents.openDevTools()
      }
    }
  })

  // 注册 Ctrl+R (Cmd+R on macOS) 刷新页面
  globalShortcut.register(process.platform === 'darwin' ? 'Command+R' : 'Control+R', () => {
    const mainWindow = getWindow()
    if (mainWindow) {
      mainWindow.webContents.reload()
    }
  })
}

function unregisterAllShortcuts() {
  globalShortcut.unregisterAll()
}

export { registerShortcuts, unregisterAllShortcuts }
