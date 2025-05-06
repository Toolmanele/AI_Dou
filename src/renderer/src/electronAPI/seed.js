export async function getAvailableSeeds() {
  if (!window.electronAPI?.getAvailableSeeds) {
    throw new Error('Electron API getAvailableSeeds is not available')
  }
  return await window.electronAPI.getAvailableSeeds()
}

export async function installSeed(seedName, targetDir) {
  if (!window.electronAPI?.installSeed) {
    throw new Error('Electron API installSeed is not available')
  }
  return await window.electronAPI.installSeed(seedName, targetDir)
}

export async function readSeedFile(seedPath) {
  if (!window.electronAPI?.readSeedFile) {
    throw new Error('Electron API readSeedFile is not available')
  }
  return await window.electronAPI.readSeedFile(seedPath)
}

export async function getSeedFromGit(githubUrl) {
  if (!window.electronAPI?.getSeedFromGit) {
    throw new Error('Electron API getSeedFromGit is not available')
  }
  return await window.electronAPI.getSeedFromGit(githubUrl)
}
