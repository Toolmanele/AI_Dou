export async function getDataPath() {
  if (!window.electronAPI?.getDataPath) {
    throw new Error('Electron API getDataPath is not available')
  }
  return await window.electronAPI.getDataPath()
}

export async function ensureDirectory(dirPath) {
  if (!window.electronAPI?.ensureDirectory) {
    throw new Error('Electron API ensureDirectory is not available')
  }
  return await window.electronAPI.ensureDirectory(dirPath)
}

export async function readJsonFile(filePath) {
  if (!window.electronAPI?.readJsonFile) {
    throw new Error('Electron API readJsonFile is not available')
  }
  return await window.electronAPI.readJsonFile(filePath)
}

export async function writeJsonFile(filePath, data) {
  if (!window.electronAPI?.writeJsonFile) {
    throw new Error('Electron API writeJsonFile is not available')
  }
  return await window.electronAPI.writeJsonFile(filePath, data)
}

export async function checkPathExists(path) {
  if (!window.electronAPI?.checkPathExists) {
    throw new Error('Electron API checkPathExists is not available')
  }
  return await window.electronAPI.checkPathExists(path)
}

export async function createDirectory(dirPath) {
  if (!window.electronAPI?.createDirectory) {
    throw new Error('Electron API createDirectory is not available')
  }
  return await window.electronAPI.createDirectory(dirPath)
}

export async function getFolderBasename(folderPath) {
  if (!window.electronAPI?.getFolderBasename) {
    throw new Error('Electron API getFolderBasename is not available')
  }
  return await window.electronAPI.getFolderBasename(folderPath)
}

export async function getAppFolderPath(folderPath) {
  if (!window.electronAPI?.getAppFolderPath) {
    throw new Error('Electron API getAppFolderPath is not available')
  }
  return await window.electronAPI.getAppFolderPath(folderPath)
}

export async function getAppDataPath() {
  if (!window.electronAPI?.getAppDataPath) {
    throw new Error('Electron API getAppDataPath is not available')
  }
  return await window.electronAPI.getAppDataPath()
}

export async function getAppsData() {
  if (!window.electronAPI?.getAppsData) {
    throw new Error('Electron API getAppsData is not available')
  }
  return await window.electronAPI.getAppsData()
}

export async function writeAppsData(data) {
  if (!window.electronAPI?.writeAppsData) {
    throw new Error('Electron API writeAppsData is not available')
  }
  return await window.electronAPI.writeAppsData(data)
}

export async function getSettingsData() {
  if (!window.electronAPI?.getSettingsData) {
    throw new Error('Electron API getSettingsData is not available')
  }
  return await window.electronAPI.getSettingsData()
}

export async function writeSettingsData(data) {
  if (!window.electronAPI?.writeSettingsData) {
    throw new Error('Electron API writeSettingsData is not available')
  }
  return await window.electronAPI.writeSettingsData(data)
}
