import { ipcRenderer } from 'electron'
// import { is } from '@electron-toolkit/utils'

// Application related functionality
export default {
  // 开发模式检测
  isDevelopmentMode: () => ipcRenderer.invoke('is-development-mode'),

  // 获取应用版本
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // 获取Node.js版本
  getNodeVersion: () => process.versions.node,

  // 获取系统信息
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

  // 获取操作系统和GPU信息
  getGpuOsInfo: () => ipcRenderer.invoke('get-gpu-os-info'),

  // 获取应用列表
  getAppsData: () => ipcRenderer.invoke('get-apps-data'),

  // 检查应用名称是否存在
  checkAppName: (params) => ipcRenderer.invoke('check-app-name', params),

  // 创建应用
  createApp: (params) => ipcRenderer.invoke('create-app', params)
}
