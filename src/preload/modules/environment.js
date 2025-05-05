import { ipcRenderer } from 'electron'

// Environment related functionality
export default {
  // 安装 Python 环境
  installPythonEnvironment: (params) => ipcRenderer.invoke('install-python-environment', params),

  // 监听 Python 安装进度
  onPythonInstallProgress: (callback) =>
    ipcRenderer.on('python-install-progress', (_event, data) => callback(data)),

  // 查找最快的URL
  findFastestUrl: (urls, timeout) => ipcRenderer.invoke('find-fastest-url', urls, timeout),

  // 运行应用命令
  runAppCommand: (params) => ipcRenderer.invoke('run-app-command', params),

  // 监听 GitHub 安装进度
  onGithubInstallProgress: (callback) =>
    ipcRenderer.on('github-install-progress', (_event, data) => callback(data)),

  // 监听安装进度
  onInstallProgress: (callback) =>
    ipcRenderer.on('install-progress', (_event, data) => callback(data)),

  // 检测 Python 版本和 pip 版本
  detectPythonVersion: (pythonPath) => ipcRenderer.invoke('detect-python-version', pythonPath),

  // 查找系统上已安装的 Python
  findPythonInstallations: () => ipcRenderer.invoke('find-python-installations')
}
