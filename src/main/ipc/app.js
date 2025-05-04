import { ipcMain } from 'electron'
import { getAppsData, checkAppName, createApp } from '../app'
function setupAppsHandlers() {
  ipcMain.handle('get-apps-data', async (event) => {
    const appsData = await getAppsData()
    return appsData
  })
  ipcMain.handle('check-app-name', async (event, appName) => {
    const isExist = await checkAppName(appName)
    return isExist
  })
  ipcMain.handle('create-app', createApp)
}

export default setupAppsHandlers
