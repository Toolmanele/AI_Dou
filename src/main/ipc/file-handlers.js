import { ipcMain, app, dialog } from 'electron'
import fs from 'fs'
import path from 'path'
import { getAppSpaceFromSettings } from '../utils/config'
import { is } from '@electron-toolkit/utils'
import {
  getAppUserDataPath,
  getSettingsData,
  getAppsData,
  saveAppsData,
  saveSettingsData
} from '../utils/check'
import { getUniqueIdByName } from '../../common/uniqueId'
function setupFileHandlers() {
  // 获取数据存储路径
  ipcMain.handle('get-data-path', getAppUserDataPath)

  // 确保目录存在
  ipcMain.handle('ensure-directory', async (event, dirPath) => {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
        console.log(`已创建目录: ${dirPath}`)
      }
      return true
    } catch (error) {
      console.error(`创建目录失败: ${dirPath}`, error)
      return false
    }
  })

  // 读取文件夹的 basename
  ipcMain.handle('get-folder-basename', async (event, folderPath) => {
    return path.basename(folderPath)
  })

  // 获取应用文件夹路径
  ipcMain.handle('get-app-folder-path', async (event, name) => {
    let settings = await getSettingsData()
    const appSpace = settings.appSpace

    // 生成不存在的唯一路径
    let folderPath = getUniqueIdByName(name)
    while (fs.existsSync(folderPath)) {
      folderPath = getUniqueIdByName(name)
    }
    return folderPath
  })

  // ipcMain.handle('get-apps-data', getAppsData)

  // ipcMain.handle('write-apps-data', saveAppsData)

  ipcMain.handle('get-settings-data', getSettingsData)

  ipcMain.handle('write-settings-data', async (event, settings_) => {
    try {
      // 确保数据是可序列化的
      let sanitizedSettings
      try {
        // 先转为 JSON 字符串再解析，确保数据可序列化
        sanitizedSettings = JSON.parse(JSON.stringify(settings_))
      } catch (parseError) {
        console.error(`设置数据序列化失败: ${parseError.message}`)
        // 创建一个不包含不可序列化属性的安全副本
        sanitizedSettings = {
          appSpace: settings_.appSpace,
          huggingfaceDir: settings_.huggingfaceDir,
          pipSource: settings_.pipSource,
          githubMirrorUrl: settings_.githubMirrorUrl,
          version: settings_.version,
          debugMode: settings_.debugMode,
          language: settings_.language,
          theme: settings_.theme,
          // 省略系统信息，避免序列化问题
          systemInfo: null
        }
      }

      // 保存已净化的设置
      return await saveSettingsData(sanitizedSettings)
    } catch (error) {
      console.error('保存设置失败:', error)
      return false
    }
  })

  // 读取 JSON 文件
  ipcMain.handle('read-json-file', async (event, filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8')
        return JSON.parse(data)
      } else {
        console.log(`文件不存在，返回空数组: ${filePath}`)
        return []
      }
    } catch (error) {
      console.error(`读取 JSON 文件失败: ${filePath}`, error)
      return []
    }
  })

  // 写入 JSON 文件
  ipcMain.handle('write-json-file', async (event, filePath, data) => {
    try {
      // 确保目录存在
      const dirPath = path.dirname(filePath)
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }

      // 确保数据是可序列化的
      let jsonData
      try {
        // 先转为 JSON 字符串再解析，确保数据可序列化
        jsonData = JSON.parse(JSON.stringify(data))
      } catch (parseError) {
        console.error(`数据序列化失败: ${parseError.message}`)
        return false
      }

      // 写入 JSON 文件
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8')
      console.log(`已写入 JSON 文件: ${filePath}`)
      return true
    } catch (error) {
      console.error(`写入 JSON 文件失败: ${filePath}`, error)
      return false
    }
  })

  // 显示目录选择对话框
  ipcMain.handle('show-open-dialog', async (event, options) => {
    return await dialog.showOpenDialog(options)
  })

  // 检查路径是否存在以及是否是目录
  ipcMain.handle('check-path-exists', async (event, pathToCheck) => {
    try {
      if (fs.existsSync(pathToCheck)) {
        const stats = fs.statSync(pathToCheck)
        return {
          exists: true,
          isDirectory: stats.isDirectory()
        }
      } else {
        return {
          exists: false,
          isDirectory: false
        }
      }
    } catch (error) {
      console.error(`检查路径失败: ${pathToCheck}`, error)
      return {
        exists: false,
        isDirectory: false,
        error: error.message
      }
    }
  })

  // 创建目录
  ipcMain.handle('create-directory', async (event, dirPath) => {
    try {
      fs.mkdirSync(dirPath, { recursive: true })
      console.log(`已创建目录: ${dirPath}`)
      return { success: true }
    } catch (error) {
      console.error(`创建目录失败: ${dirPath}`, error)
      return {
        success: false,
        error: error.message
      }
    }
  })
}

export default setupFileHandlers
