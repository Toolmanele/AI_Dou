import { app, BrowserWindow } from 'electron'
import { release } from 'os'
// 引入自定义模块
import { createWindow } from './utils/window'
import { registerShortcuts, unregisterAllShortcuts } from './utils/shortcuts'
import { ensureAppDirectories } from './utils/config'
import setupIPC from './ipc/index'
import { is } from '@electron-toolkit/utils'
import { checkbeforeAppRun } from './utils/check'
console.log('setupIPC', setupIPC, is.dev)
// 禁用 Windows 7 的 GPU 加速
if (release().startsWith('6.1')) app.disableHardwareAcceleration()
checkbeforeAppRun()
// 设置应用名称
app.setName('AI_dou')

// 单实例锁，确保应用只运行一个实例
const isSingleInstance = app.requestSingleInstanceLock()

// 如果获取锁失败，说明已经有一个实例在运行
if (!isSingleInstance) {
  console.log('应用已经在运行。退出当前实例。')
  app.quit()
  process.exit(0)
} else {
  // 监听第二个实例的启动事件
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // 如果用户尝试打开第二个实例，我们应该聚焦到当前窗口
    const mainWindow = windowManager.getWindow()
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore() // 如果窗口最小化，先恢复
      }
      mainWindow.focus() // 聚焦窗口
      mainWindow.show() // 确保窗口可见

      // 可选：在这里处理命令行参数，例如打开文件等
      console.log('第二个实例的命令行参数:', commandLine)
    }
  })
}

// 禁用 Windows 的自动缩略图
if (process.platform === 'win32') {
  app.setAppUserModelId(app.getName())
}

// 删除安全警告
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

// 当 Electron 完成初始化并准备创建窗口时，调用 createWindow 方法
app.whenReady().then(() => {
  // 设置 IPC 处理程序
  setupIPC()

  // 确保应用目录存在
  ensureAppDirectories()

  // 创建窗口
  createWindow()

  // 注册全局快捷键
  registerShortcuts()

  // 在 macOS 上点击 dock 图标重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 注销所有快捷键
app.on('will-quit', () => {
  unregisterAllShortcuts()
})

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// 在开发环境下，当父进程死亡时自动退出应用
if (is.dev) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
