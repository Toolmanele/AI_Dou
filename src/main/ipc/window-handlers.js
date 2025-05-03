import { ipcMain } from 'electron'
import { getWindow } from '../utils/window'

function setupWindowHandlers() {
  // 最小化窗口
  ipcMain.handle('minimize-window', () => {
    const mainWindow = getWindow()
    if (mainWindow) {
      mainWindow.minimize()
      return true
    }
    return false
  })

  // 最大化窗口
  ipcMain.handle('maximize-window', () => {
    const mainWindow = getWindow()
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
        return false
      } else {
        mainWindow.maximize()
        return true
      }
    }
    return false
  })

  // 关闭窗口
  ipcMain.handle('close-window', () => {
    const mainWindow = getWindow()
    if (mainWindow) {
      mainWindow.close()
      return true
    }
    return false
  })

  // 检查窗口是否最大化
  ipcMain.handle('is-maximized', () => {
    const mainWindow = getWindow()
    if (mainWindow) {
      return mainWindow.isMaximized()
    }
    return false
  })

  // 切换开发者工具
  ipcMain.handle('toggle-dev-tools', () => {
    const mainWindow = getWindow()
    if (mainWindow) {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools()
        return false
      } else {
        mainWindow.webContents.openDevTools()
        return true
      }
    }
    return false
  })
}

export default setupWindowHandlers
