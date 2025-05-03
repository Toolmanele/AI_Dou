// 这里用来检查一些必要的条件
import { is } from '@electron-toolkit/utils'
import { app } from 'electron'
import { readFile, writeFile } from './fs'
import path from 'path'
import fs from 'fs'
let apps, settings, appUserDataPath, appsDataPath, settingsDataPath
// 以及数据初始化d
function getAppUserDataPath() {
  if (is.dev) {
    // 开发模式：使用项目根目录下的 appdata 文件夹
    return path.join(app.getAppPath(), 'appdata')
  } else {
    // 生产模式：使用用户数据目录
    return path.join(app.getPath('userData'), 'data')
  }
}
function checkAppUserDataPath() {
  if (!appUserDataPath) {
    appUserDataPath = getAppUserDataPath()
    appsDataPath = path.join(appUserDataPath, 'apps.json')
    settingsDataPath = path.join(appUserDataPath, 'settings.json')
  }
  if (!fs.existsSync(appUserDataPath)) {
    fs.mkdirSync(appUserDataPath, { recursive: true })
  }
}
function checkbeforeAppRun() {
  checkAppUserDataPath()
  getAppsData_()
  getSettingsData_()
}

async function getAppsData_() {
  if (fs.existsSync(appsDataPath)) {
    let data = await readFile(appsDataPath)
    apps = JSON.parse(data)
  } else {
    apps = []
  }
}
async function getAppsData() {
  if (!apps) {
    await getAppsData_()
  }
  return apps
}
async function getSettingsData_() {
  if (fs.existsSync(settingsDataPath)) {
    let data = await readFile(settingsDataPath)
    settings = JSON.parse(data)
  } else {
    settings = {}
  }
}
async function getSettingsData() {
  if (!settings) {
    await getSettingsData_()
  }
  return settings
}
async function saveAppsData(apps_) {
  checkAppUserDataPath()
  apps = apps_
  if (is.dev) {
    await writeFile(appsDataPath, JSON.stringify(apps, null, 2))
  } else {
    await writeFile(appsDataPath, JSON.stringify(apps))
  }
}
async function saveSettingsData(settings_) {
  checkAppUserDataPath()
  settings = settings_
  if (is.dev) {
    await writeFile(settingsDataPath, JSON.stringify(settings, null, 2))
  } else {
    await writeFile(settingsDataPath, JSON.stringify(settings))
  }
}
export {
  getAppUserDataPath,
  checkbeforeAppRun,
  getAppsData,
  getSettingsData,
  saveAppsData,
  saveSettingsData,
  checkAppUserDataPath
}
