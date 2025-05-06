export async function installPythonEnvironment(params) {
  if (!window.electronAPI?.installPythonEnvironment) {
    throw new Error('Electron API installPythonEnvironment is not available')
  }
  return await window.electronAPI.installPythonEnvironment(params)
}

export function onPythonInstallProgress(callback) {
  if (!window.electronAPI?.onPythonInstallProgress) {
    throw new Error('Electron API onPythonInstallProgress is not available')
  }
  return window.electronAPI.onPythonInstallProgress(callback)
}

export async function findFastestUrl(urls, timeout) {
  if (!window.electronAPI?.findFastestUrl) {
    throw new Error('Electron API findFastestUrl is not available')
  }
  return await window.electronAPI.findFastestUrl(urls, timeout)
}

export async function runAppCommand(params) {
  if (!window.electronAPI?.runAppCommand) {
    throw new Error('Electron API runAppCommand is not available')
  }
  return await window.electronAPI.runAppCommand(params)
}

export function onGithubInstallProgress(callback) {
  if (!window.electronAPI?.onGithubInstallProgress) {
    throw new Error('Electron API onGithubInstallProgress is not available')
  }
  return window.electronAPI.onGithubInstallProgress(callback)
}

export function onInstallProgress(callback) {
  if (!window.electronAPI?.onInstallProgress) {
    throw new Error('Electron API onInstallProgress is not available')
  }
  return window.electronAPI.onInstallProgress(callback)
}

export async function detectPythonVersion(pythonPath) {
  if (!window.electronAPI?.detectPythonVersion) {
    throw new Error('Electron API detectPythonVersion is not available')
  }
  return await window.electronAPI.detectPythonVersion(pythonPath)
}

export async function findPythonInstallations() {
  if (!window.electronAPI?.findPythonInstallations) {
    throw new Error('Electron API findPythonInstallations is not available')
  }
  return await window.electronAPI.findPythonInstallations()
}
