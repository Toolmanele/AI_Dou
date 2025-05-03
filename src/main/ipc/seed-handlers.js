import { ipcMain, app } from 'electron'
import path from 'path'
import { loadSeedConfig, getAvailableSeeds, getSeedsDirectory, installSeed } from '../utils/seed'
import { getAppSpaceFromSettings, isDevelopment } from '../utils/config'
import fs from 'fs'
import { getSeedList, updateSeedRepo } from '../seed/seed'

function setupSeedHandlers() {
  // 获取所有可用的种子
  ipcMain.handle('get-available-seeds', async () => {
    try {
      let seeds = await getSeedList()
      return seeds
      // const appSpace = getAppSpaceFromSettings()
      // const seedsDir = getSeedsDirectory(isDevelopment, appSpace, app.getAppPath())
      // console.log(`Reading seeds from: ${seedsDir} (isDevelopment: ${isDevelopment})`)
      // return await getAvailableSeeds(seedsDir)
    } catch (error) {
      console.error('获取可用种子失败:', error)
      return []
    }
  })

  // 安装或更新种子
  ipcMain.handle('install-seed', async (event, seedName, targetDir) => {
    try {
      const appSpace = getAppSpaceFromSettings()
      const seedsDir = getSeedsDirectory(isDevelopment, appSpace, app.getAppPath())

      // 如果没有指定安装目录，则使用默认目录
      const reposDir = targetDir || path.join(appSpace, 'repositories')

      console.log(`安装种子: ${seedName} 从 ${seedsDir} 到 ${reposDir}`)
      const result = await installSeed(seedsDir, reposDir, seedName)

      return result
    } catch (error) {
      console.error(`安装种子失败 ${seedName}:`, error)
      return {
        success: false,
        error: error.message
      }
    }
  })

  // 读取种子文件
  ipcMain.handle('read-seed-file', async (event, seedPath) => {
    try {
      // 检查文件路径是否合法
      if (!seedPath || typeof seedPath !== 'string') {
        throw new Error('Invalid seed path')
      }

      // 确定种子文件的完整路径
      let fullPath = seedPath

      // 如果是相对路径，则基于种子目录解析
      if (!path.isAbsolute(seedPath)) {
        const appSpace = getAppSpaceFromSettings()
        const seedsDir = getSeedsDirectory(isDevelopment, appSpace, app.getAppPath())

        fullPath = path.join(seedsDir, seedPath)
      }

      // 检查文件是否存在
      if (!fs.existsSync(fullPath)) {
        console.error(`Seed file not found: ${fullPath}`)
        throw new Error(`Seed file not found: ${seedPath}`)
      }

      // 读取并解析种子文件
      const seedData = await loadSeedConfig(fullPath)
      return seedData
    } catch (error) {
      console.error(`读取种子文件失败 ${seedPath}:`, error)
      throw error
    }
  })

  ipcMain.handle('get-seeds-from-git', async (event, progressCallback) => {
    try {
      const result = await updateSeedRepo({
        progressCallback: progressCallback
      })

      return {
        success: result.success,
        repoPath: result.repoPath,
        repoName: result.repoName
      }
    } catch (error) {
      console.error('Failed to get seeds from git:', error)
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      }
    }
  })
}

export default setupSeedHandlers
