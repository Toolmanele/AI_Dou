import { ipcRenderer } from 'electron'

// File system functionality
export default {
  // 获取数据路径
  getDataPath: () => ipcRenderer.invoke('get-data-path'),

  // 确保目录存在
  ensureDirectory: (dirPath) => ipcRenderer.invoke('ensure-directory', dirPath),

  // 读取 JSON 文件
  readJsonFile: (filePath) => ipcRenderer.invoke('read-json-file', filePath),

  // 写入 JSON 文件
  writeJsonFile: (filePath, data) => ipcRenderer.invoke('write-json-file', filePath, data),

  // 检查路径是否存在以及是否是目录
  checkPathExists: (path) => ipcRenderer.invoke('check-path-exists', path),

  // 创建目录
  createDirectory: (dirPath) => ipcRenderer.invoke('create-directory', dirPath),

  // 获取文件夹的 basename
  getFolderBasename: (folderPath) => ipcRenderer.invoke('get-folder-basename', folderPath),

  // 获取应用文件夹路径
  getAppFolderPath: (folderPath) => ipcRenderer.invoke('get-app-folder-path', folderPath),

  // 获取应用数据
  getAppsData: () => ipcRenderer.invoke('get-apps-data'),

  // 写入应用数据
  writeAppsData: (apps) => ipcRenderer.invoke('write-apps-data', apps),

  // 获取设置数据
  getSettingsData: () => ipcRenderer.invoke('get-settings-data'),

  // 写入设置数据
  writeSettingsData: (settings) => ipcRenderer.invoke('write-settings-data', settings)
}
