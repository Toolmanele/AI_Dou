import { ipcMain, app } from 'electron'
import si from 'systeminformation'
import { is } from '@electron-toolkit/utils'
function setupSystemHandlers() {
  // 处理来自渲染进程的消息
  ipcMain.on('message', (event, message) => {
    console.log('从渲染进程收到消息:', message)

    // 回复消息
    event.sender.send('message-reply', '主进程已收到消息!')
  })

  // 处理获取应用版本的请求
  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
  })
  ipcMain.handle('is-development-mode', () => {
    return is.dev
  })
  // 获取 Node.js 版本
  ipcMain.handle('get-node-version', () => {
    return process.versions.node
  })

  // 获取系统信息
  ipcMain.handle('get-system-info', async () => {
    console.log('收到获取系统信息请求')
    try {
      // 获取操作系统信息
      const osInfo = await si.osInfo()
      console.log('OS信息:', osInfo.platform, osInfo.distro)

      // 获取CPU信息
      const cpuInfo = await si.cpu()

      // 获取内存信息
      const memInfo = await si.mem()

      // 获取GPU信息
      const gpuInfo = await si.graphics()

      // 获取磁盘信息
      const diskInfo = await si.fsSize()

      // 检测GPU类型
      let hasNvidia = false
      let hasAMD = false
      let hasIntel = false
      let gpuType = 'unknown'

      if (gpuInfo.controllers && gpuInfo.controllers.length > 0) {
        const gpuModel = gpuInfo.controllers[0].model || ''
        const gpuVendor = gpuInfo.controllers[0].vendor || ''
        const gpuText = (gpuModel + ' ' + gpuVendor).toLowerCase()

        if (
          gpuText.includes('nvidia') ||
          gpuText.includes('geforce') ||
          gpuText.includes('quadro') ||
          gpuText.includes('tesla')
        ) {
          hasNvidia = true
          gpuType = 'nvidia'
        } else if (
          gpuText.includes('amd') ||
          gpuText.includes('radeon') ||
          gpuText.includes('firepro')
        ) {
          hasAMD = true
          gpuType = 'amd'
        } else if (
          gpuText.includes('intel') ||
          gpuText.includes('hd graphics') ||
          gpuText.includes('iris')
        ) {
          hasIntel = true
          gpuType = 'intel'
        }
      }

      // 构建系统信息对象
      const systemInfo = {
        platform: osInfo.platform, // "win32", "darwin", "linux"
        osName: osInfo.distro || osInfo.platform,
        osVersion: osInfo.release || osInfo.build,
        arch: osInfo.arch,
        totalMemory: memInfo.total,
        freeMemory: memInfo.available,
        cpuModel: cpuInfo.manufacturer + ' ' + cpuInfo.brand,
        cpuCores: cpuInfo.cores,
        cpuSpeed: cpuInfo.speed + ' GHz',
        gpuInfo:
          gpuInfo.controllers.length > 0
            ? gpuInfo.controllers[0].model || gpuInfo.controllers[0].vendor
            : 'N/A',
        gpuType: gpuType,
        hasNvidia: hasNvidia,
        hasAMD: hasAMD,
        hasIntel: hasIntel,
        storageInfo: diskInfo.map((disk) => ({
          mount: disk.mount,
          size: disk.size,
          used: disk.used,
          available: disk.size - disk.used
        }))
      }

      console.log('系统信息获取成功', systemInfo)
      return systemInfo
    } catch (error) {
      console.error('获取系统信息时出错:', error)
      return {
        platform: process.platform,
        osName: process.platform,
        osVersion: process.release,
        arch: process.arch,
        totalMemory: 0,
        freeMemory: 0,
        cpuModel: 'N/A',
        gpuInfo: 'N/A',
        gpuType: 'unknown',
        hasNvidia: false,
        hasAMD: false,
        hasIntel: false,
        storageInfo: []
      }
    }
  })

  // 获取操作系统和GPU信息
  ipcMain.handle('get-gpu-os-info', async () => {
    console.log('收到获取操作系统和GPU信息请求')
    try {
      // 获取操作系统信息
      const osInfo = await si.osInfo()
      console.log('OS信息:', osInfo.platform, osInfo.distro)

      // 获取GPU信息
      const gpuInfo = await si.graphics()

      // 检测GPU类型
      let hasNvidia = false
      let hasAMD = false
      let hasIntel = false
      let gpuType = 'unknown'

      if (gpuInfo.controllers && gpuInfo.controllers.length > 0) {
        const gpuModel = gpuInfo.controllers[0].model || ''
        const gpuVendor = gpuInfo.controllers[0].vendor || ''
        const gpuText = (gpuModel + ' ' + gpuVendor).toLowerCase()

        if (
          gpuText.includes('nvidia') ||
          gpuText.includes('geforce') ||
          gpuText.includes('quadro') ||
          gpuText.includes('tesla')
        ) {
          hasNvidia = true
          gpuType = 'nvidia'
        } else if (
          gpuText.includes('amd') ||
          gpuText.includes('radeon') ||
          gpuText.includes('firepro')
        ) {
          hasAMD = true
          gpuType = 'amd'
        } else if (
          gpuText.includes('intel') ||
          gpuText.includes('hd graphics') ||
          gpuText.includes('iris')
        ) {
          hasIntel = true
          gpuType = 'intel'
        }
      }

      // 构建操作系统和GPU信息对象
      const gpuOsInfo = {
        // 操作系统信息
        platform: osInfo.platform, // "win32", "darwin", "linux"
        osName: osInfo.distro || osInfo.platform,
        osVersion: osInfo.release || osInfo.build,
        arch: osInfo.arch,

        // GPU信息
        gpuInfo:
          gpuInfo.controllers.length > 0
            ? gpuInfo.controllers[0].model || gpuInfo.controllers[0].vendor
            : 'N/A',
        gpuType: gpuType,
        hasNvidia: hasNvidia,
        hasAMD: hasAMD,
        hasIntel: hasIntel
      }

      console.log('操作系统和GPU信息获取成功', gpuOsInfo)
      return gpuOsInfo
    } catch (error) {
      console.error('获取操作系统和GPU信息时出错:', error)
      return {
        platform: process.platform,
        osName: process.platform,
        osVersion: process.release,
        arch: process.arch,
        gpuInfo: 'N/A',
        gpuType: 'unknown',
        hasNvidia: false,
        hasAMD: false,
        hasIntel: false
      }
    }
  })
}

export default setupSystemHandlers
