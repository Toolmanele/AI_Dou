import { BrowserWindow } from 'electron'
import path from 'path'
import { is } from '@electron-toolkit/utils'
let mainWindow = null

function createWindow() {
  // 获取图标路径
  const iconPath = path.join(__dirname, '../../build/icon.svg')

  // 创建窗口实例
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    icon: iconPath,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    // 无边框窗口设置
    frame: false, // 无标题栏和边框
    titleBarStyle: 'hidden', // 在macOS上隐藏标题栏
    titleBarOverlay: false, // 不使用系统覆盖标题栏
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // 启用沙箱模式提高安全性
      sandbox: true
    },
    // 窗口背景色，防止加载时闪烁
    backgroundColor: '#f5f5f5'
  })

  // 移除菜单栏
  // Menu.setApplicationMenu(null)
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
  // 设置 URL
  // if (isDevelopment) {
  //   // 优先使用环境变量中的 Vite 服务器 URL
  //   const url = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000/'
  //   console.log(`加载开发服务器 URL: ${url}`)
  //   mainWindow.loadURL(url)
  //   // 开发环境下打开开发者工具
  //   mainWindow.webContents.openDevTools()
  // } else {
  //   // 生产环境下从本地文件加载
  //   mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  // }

  // 当窗口准备好显示时，显示窗口并聚焦
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  // 监听窗口关闭事件
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 监听窗口最大化事件
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized', true)
  })

  // 监听窗口取消最大化事件
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-maximized', false)
  })

  return mainWindow
}

function getWindow() {
  return mainWindow
}

export { createWindow, getWindow }
