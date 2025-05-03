import fs from 'fs'
import path from 'path'
import { app } from 'electron'

// 获取设置中的 appSpace
function getAppSpaceFromSettings() {
  try {
    const settingsPath = path.join(app.getAppPath(), 'appdata', 'settings.json')
    if (fs.existsSync(settingsPath)) {
      const settingsData = fs.readFileSync(settingsPath, 'utf8')
      const settings = JSON.parse(settingsData)
      return settings.appSpace || path.join(app.getPath('userData'), 'AppSpace')
    }
  } catch (error) {
    console.error('读取设置文件失败:', error)
  }
  // 默认值，当设置读取失败时使用
  return path.join(app.getPath('userData'), 'AppSpace')
}

// 开发环境检测
const isDevelopment = process.env.NODE_ENV === 'development'

// 确保程序所需的目录存在
function ensureAppDirectories() {
  try {
    const appSpace = getAppSpaceFromSettings()

    // 确保开发环境下的种子目录存在
    const devSeedsDir = path.join(app.getAppPath(), 'seeds')
    if (!fs.existsSync(devSeedsDir)) {
      fs.mkdirSync(devSeedsDir, { recursive: true })
      console.log(`创建开发环境种子目录: ${devSeedsDir}`)
    }

    // 确保生产环境下的种子目录存在
    const prodSeedsDir = path.join(appSpace, 'seeds')
    if (!fs.existsSync(prodSeedsDir)) {
      fs.mkdirSync(prodSeedsDir, { recursive: true })
      console.log(`创建生产环境种子目录: ${prodSeedsDir}`)
    }

    return true
  } catch (error) {
    console.error('创建程序目录失败:', error)
    return false
  }
}

export { getAppSpaceFromSettings, isDevelopment, ensureAppDirectories }
