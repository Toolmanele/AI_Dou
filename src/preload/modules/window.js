import { ipcRenderer } from 'electron'

// Window control functionality
export default {
  // 显示目录选择对话框
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),

  // 最小化窗口
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),

  // 最大化/恢复窗口
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),

  // 关闭窗口
  closeWindow: () => ipcRenderer.invoke('close-window'),

  // 检查窗口是否最大化
  isMaximized: () => ipcRenderer.invoke('is-maximized'),

  // 监听窗口最大化状态变化
  onMaximizeChange: (callback) =>
    ipcRenderer.on('window-maximized', (_event, isMaximized) => callback(isMaximized)),

  // 切换开发者工具
  toggleDevTools: () => ipcRenderer.invoke('toggle-dev-tools')
}
