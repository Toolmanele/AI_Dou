import { getAppUserDataPath } from '../utils/check'
import path from 'path'
import fs from 'fs/promises'
import { ensureDir } from '../utils/fs'
import { is } from '@electron-toolkit/utils'

let appsData = null
let appDataPath = getAppUserDataPath()
// 这里放置的是单个 app 的信息
let appsInfoPath = path.join(appDataPath, 'apps')
export async function getAppsData() {
  if (!appsData) {
    appsData = []
    try {
      await ensureDir(appsInfoPath)
      const appsInfoJson = await fs.readdir(appsInfoPath)

      for (const app of appsInfoJson) {
        try {
          const filePath = path.join(appsInfoPath, app)
          const fileContent = await fs.readFile(filePath, 'utf-8')
          try {
            const appInfo = JSON.parse(fileContent)
            appsData.push(appInfo)
          } catch (jsonError) {
            console.error(`Error parsing JSON for app ${app}:`, jsonError)
            // 继续处理下一个文件
          }
        } catch (fileError) {
          console.error(`Error reading file ${app}:`, fileError)
          // 继续处理下一个文件
        }
      }
    } catch (dirError) {
      console.error('Error reading apps directory:', dirError)
      // 返回空数组，而不是中断执行
    }
  }
  return appsData
}

export async function checkAppName(appName) {
  const appsData = await getAppsData()
  return appsData.some((app) => app.name === appName)
}

export async function createApp(app) {
  const appName = app.name
  const appInfoPath = path.join(appsInfoPath, appName + '.json')
  if (is.dev) {
    await fs.writeFile(appInfoPath, JSON.stringify(app, null, 2))
  } else {
    await fs.writeFile(appInfoPath, JSON.stringify(app))
  }
}
