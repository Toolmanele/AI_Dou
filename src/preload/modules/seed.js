import { ipcRenderer } from 'electron'

// Seed related functionality
export default {
  // 获取所有可用的种子
  getAvailableSeeds: () => ipcRenderer.invoke('get-available-seeds'),

  // 安装或更新种子
  installSeed: (seedName, targetDir) => ipcRenderer.invoke('install-seed', seedName, targetDir),

  // 读取指定的种子文件
  readSeedFile: (seedPath) => ipcRenderer.invoke('read-seed-file', seedPath),

  // 从远程仓库获取种子
  getSeedsFromGit: () => ipcRenderer.invoke('get-seeds-from-git')
}
