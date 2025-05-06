export async function showOpenDialog(options) {
  if (!window.electronAPI?.showOpenDialog) {
    throw new Error('Electron API showOpenDialog is not available')
  }
  return await window.electronAPI.showOpenDialog(options)
}

export async function minimizeWindow() {
  if (!window.electronAPI?.minimizeWindow) {
    throw new Error('Electron API minimizeWindow is not available')
  }
  return await window.electronAPI.minimizeWindow()
}

export async function maximizeWindow() {
  if (!window.electronAPI?.maximizeWindow) {
    throw new Error('Electron API maximizeWindow is not available')
  }
  return await window.electronAPI.maximizeWindow()
}

export async function closeWindow() {
  if (!window.electronAPI?.closeWindow) {
    throw new Error('Electron API closeWindow is not available')
  }
  return await window.electronAPI.closeWindow()
}
export async function isMaximized() {
  if (!window.electronAPI?.isMaximized) {
    throw new Error('Electron API isMaximized is not available')
  }
  return await window.electronAPI.isMaximized()
}

export async function onMaximizeChange(callback) {
  if (!window.electronAPI?.onMaximizeChange) {
    throw new Error('Electron API onMaximizeChange is not available')
  }
  return await window.electronAPI.onMaximizeChange(callback)
}

export async function toggleDevTools() {
  if (!window.electronAPI?.toggleDevTools) {
    throw new Error('Electron API toggleDevTools is not available')
  }
  return await window.electronAPI.toggleDevTools()
}
