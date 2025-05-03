import seedUrls from './seedurl'
import { findFastestUrl } from '../url/findFastestUrl'
import { getAppUserDataPath } from '../utils/check'
import git from '../utils/git'
import path from 'path'
import { ensureDir, checkFileExists, readFile } from '../utils/fs'
import { GitProcess } from 'dugite'
import fs from 'fs'

let seedList = null
let appDataPath = getAppUserDataPath()
let seedFolder = path.join(appDataPath, 'AI_Dou_seeds')

async function getSeedList() {
  if (!seedList) {
    seedList = await _getSeedList()
  }
  return seedList
}

async function _getSeedList() {
  try {
    if (fs.existsSync(seedFolder)) {
      // 如果存在就直接读取
      // 读取文件夹中的所有文件
      const files = fs.readdirSync(seedFolder)

      // 过滤出所有以 .aiseed.json 结尾的文件
      const seedFiles = files.filter((file) => file.endsWith('.aiseed.json'))

      // 创建新的种子列表
      const results = []

      // 处理每个种子文件
      for (const file of seedFiles) {
        try {
          const seedPath = path.join(seedFolder, file)
          const seedData = await readFile(seedPath)
          const seed = JSON.parse(seedData)

          // 添加额外信息
          seed.filename = file
          seed.path = seedPath

          // 将种子添加到列表中
          results.push(seed)
        } catch (error) {
          console.error(`Error loading seed from ${file}:`, error)
        }
      }

      return results
    } else {
      // 如果不存在就强制下载
      await refreshSeedList()
      return seedList
    }
    // 确保种子文件夹存在
    // await ensureDir(seedFolder)
  } catch (error) {
    console.error('Error getting seed list:', error)
    return []
  }
}

/**
 * Checks if a repository needs updates by comparing local and remote commits
 * @param {string} repoPath - Path to the repository
 * @returns {Promise<boolean>} True if updates are needed, false otherwise
 */
async function needsUpdate(repoPath) {
  try {
    // Fetch the latest changes without merging
    await GitProcess.exec(['fetch'], repoPath)

    // Get the latest local commit hash
    const localResult = await GitProcess.exec(['rev-parse', 'HEAD'], repoPath)
    if (localResult.exitCode !== 0) {
      console.error('Error getting local commit hash:', localResult.stderr)
      return true // Assume update needed on error
    }
    const localCommit = localResult.stdout.trim()

    // Get the latest remote commit hash
    const remoteResult = await GitProcess.exec(['rev-parse', '@{upstream}'], repoPath)
    if (remoteResult.exitCode !== 0) {
      console.error('Error getting remote commit hash:', remoteResult.stderr)
      return true // Assume update needed on error
    }
    const remoteCommit = remoteResult.stdout.trim()

    // If the commits are different, we need an update
    return localCommit !== remoteCommit
  } catch (error) {
    console.error('Error checking for updates:', error)
    return true // Assume update needed on error
  }
}

/**
 * Updates or creates the seed repository
 * @param {Object} options - Options for updating/creating seed repo
 * @param {function} options.progressCallback - Callback for progress updates
 * @returns {Promise<Object>} Result of the git operation
 */
async function _updateSeedRepo(options = {}) {
  try {
    let fastestUrl = await findFastestUrl(seedUrls)
    // Make sure the seed folder exists
    // await ensureDir(seedFolder)
    console.log('fastestUrl.url', fastestUrl)
    // Extract repo name from the URL
    const repoName = fastestUrl.url
      .split('/')
      .pop()
      .replace(/\.git$/, '')

    const repoPath = path.join(appDataPath, repoName)
    const repoExists = await checkFileExists(repoPath)

    let result
    if (repoExists) {
      // Check if the repository needs updates
      const updateRequired = await needsUpdate(repoPath)

      if (updateRequired) {
        // Update existing repository
        console.log(`Updating existing seed repository: ${repoName}`)
        if (options.progressCallback) {
          options.progressCallback({
            status: 'info',
            message: `检查到更新，正在更新仓库: ${repoName}`
          })
        }
        result = await git.update(repoPath, options)
      } else {
        // No update needed
        console.log(`No updates needed for repository: ${repoName}`)
        if (options.progressCallback) {
          options.progressCallback({
            status: 'info',
            message: `仓库已是最新版本: ${repoName}`
          })
        }
        result = {
          success: true,
          exitCode: 0,
          stdout: 'Already up to date.',
          stderr: ''
        }
      }
    } else {
      // Clone new repository
      console.log(`Cloning new seed repository: ${repoName}`)
      result = await git.clone(appDataPath, fastestUrl.url, repoName, {
        progressCallback: options.progressCallback
      })
    }

    return {
      ...result,
      repoPath,
      repoName
    }
  } catch (error) {
    console.error('Error updating seed repository:', error)
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    }
  }
}

/**
 * 更新种子仓库并刷新种子列表
 * @param {Object} options - 更新选项
 * @param {function} options.progressCallback - 进度回调函数
 * @returns {Promise<Object>} 更新结果
 */
async function refreshSeedList(options = {}) {
  // 先更新种子仓库
  const updateResult = await _updateSeedRepo(options)

  // 然后刷新种子列表缓存
  seedList = null
  await getSeedList()

  return updateResult
}

// 保持原有 API 兼容性
async function updateSeedRepo(options = {}) {
  return refreshSeedList(options)
}

export { updateSeedRepo, seedFolder, getSeedList, refreshSeedList }
