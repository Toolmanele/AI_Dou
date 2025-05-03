import { contextBridge } from 'electron'
import appApi from './modules/app'
import windowApi from './modules/window'
import filesystemApi from './modules/filesystem'
import seedApi from './modules/seed'
import environmentApi from './modules/environment'

// 通过上下文桥接暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 应用程序相关功能
  ...appApi,

  // 窗口控制功能
  ...windowApi,

  // 文件系统相关功能
  ...filesystemApi,

  // Seed 相关功能
  ...seedApi,

  // 环境相关功能
  ...environmentApi
})
