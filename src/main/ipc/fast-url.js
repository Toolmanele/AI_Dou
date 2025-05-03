import { ipcMain } from 'electron'
import { findFastestUrl } from '../url/findFastestUrl'

// 设置 IPC 处理程序
function setupFastUrlHandlers() {
  // 测试最快的 URL
  ipcMain.handle('find-fastest-url', async (event, urls, timeout) => {
    try {
      const result = await findFastestUrl(urls, timeout)
      return result
    } catch (error) {
      console.error('Error finding fastest URL:', error)
      return { error: error.message, url: null, latency: -1 }
    }
  })
}

export default setupFastUrlHandlers
