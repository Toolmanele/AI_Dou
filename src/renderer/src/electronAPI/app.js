export async function isDevelopmentMode() {
  if (!window.electronAPI?.isDevelopmentMode) {
    throw new Error('Electron API isDevelopmentMode is not available')
  }
  return await window.electronAPI.isDevelopmentMode()
}
export async function getAppVersion() {
  if (!window.electronAPI?.getAppVersion) {
    throw new Error('Electron API getAppVersion is not available')
  }
  return await window.electronAPI.getAppVersion()
}

export async function getNodeVersion() {
  if (!window.electronAPI?.getNodeVersion) {
    throw new Error('Electron API getNodeVersion is not available')
  }
  return await window.electronAPI.getNodeVersion()
}

export async function getSystemInfo() {
  if (!window.electronAPI?.getSystemInfo) {
    throw new Error('Electron API getSystemInfo is not available')
  }
  return await window.electronAPI.getSystemInfo()
}

export async function getGpuOsInfo() {
  if (!window.electronAPI?.getGpuOsInfo) {
    throw new Error('Electron API getGpuOsInfo is not available')
  }
  return await window.electronAPI.getGpuOsInfo()
}

export async function getAppsData() {
  if (!window.electronAPI?.getAppsData) {
    throw new Error('Electron API getAppsData is not available')
  }
  return await window.electronAPI.getAppsData()
}

export async function checkAppName(params) {
  if (!window.electronAPI?.checkAppName) {
    throw new Error('Electron API checkAppName is not available')
  }
  return await window.electronAPI.checkAppName(params)
}
export async function createApp(params) {
  if (!window.electronAPI?.createApp) {
    throw new Error('Electron API createApp is not available')
  }
  return await window.electronAPI.createApp(params)
}
