import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSettingsStore } from './settings'
import electronStore from '../services/electronStore'
// 使用组合式API风格定义 Store
export const useAppStore = defineStore('app', () => {
  // 状态
  const appName = ref('AI-Dou')
  const appVersion = ref('0.1.0')
  const isDarkMode = ref(false)
  // 添加系统信息加载状态
  const isSystemInfoLoading = ref(true)
  // Apps数据状态
  const apps = ref([])
  const isAppsLoading = ref(false)

  // 系统信息
  const systemInfo = ref({
    electronVersion: 'N/A',
    chromeVersion: 'N/A',
    nodeVersion: 'N/A',
    osName: 'N/A',
    osVersion: 'N/A',
    arch: 'N/A',
    totalMemory: 0,
    freeMemory: 0,
    cpuModel: 'N/A',
    cpuCores: 'N/A',
    cpuSpeed: 'N/A',
    gpuInfo: 'N/A',
    storageInfo: []
  })

  // Getter
  const fullAppName = computed(() => {
    // return `${appName.value} v${appVersion.value}`;
    return `${appName.value}`
  })

  // 动作 (actions)
  function toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value
  }

  async function getVersionInfo() {
    if (window.electronAPI) {
      try {
        // 获取应用版本
        appVersion.value = (await window.electronAPI.getAppVersion()) || '0.1.0'

        // 获取 Electron 版本
        const processVersions = window.navigator.userAgent.match(/Electron\/(\d+\.\d+\.\d+)/)
        if (processVersions && processVersions[1]) {
          systemInfo.value.electronVersion = processVersions[1]
        }

        // 获取 Chrome 版本
        const chromeMatch = window.navigator.userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/)
        if (chromeMatch && chromeMatch[1]) {
          systemInfo.value.chromeVersion = chromeMatch[1]
        }

        // 获取 Node.js 版本 - 安全处理避免在浏览器环境中出错
        if (window.electronAPI.getNodeVersion) {
          systemInfo.value.nodeVersion = await window.electronAPI.getNodeVersion()
        } else if (typeof process !== 'undefined' && process.versions && process.versions.node) {
          systemInfo.value.nodeVersion = process.versions.node
        } else {
          systemInfo.value.nodeVersion = 'N/A (Browser Environment)'
        }

        // 获取详细系统信息
        await getSystemInfo()
      } catch (error) {
        console.error('获取版本信息失败:', error)
      }
    }
  }

  // 获取系统详细信息
  async function getSystemInfo(forceRefresh = false) {
    if (window.electronAPI) {
      try {
        // 设置加载状态为 true
        isSystemInfoLoading.value = true

        // 检查是否有缓存的系统信息
        // const { useSettingsStore } = await import('./settings')
        const settingsStore = useSettingsStore()
        const cachedInfo = settingsStore.getCachedSystemInfo()

        // 如果有缓存的系统信息并且不是强制刷新，直接使用缓存
        if (cachedInfo && !forceRefresh) {
          systemInfo.value = {
            ...systemInfo.value,
            ...cachedInfo
          }
          console.log('使用缓存的系统信息')
          isSystemInfoLoading.value = false
          return systemInfo.value
        }

        // 如果存在系统信息API则获取完整信息
        if (window.electronAPI.getSystemInfo) {
          const info = await window.electronAPI.getSystemInfo()
          if (info) {
            // 提取所需信息，确保数据类型正确 - 这可以防止非序列化对象
            const cleanInfo = {
              osName: String(info.osName || 'N/A'),
              osVersion: String(info.osVersion || 'N/A'),
              arch: String(info.arch || 'N/A'),
              totalMemory: Number(info.totalMemory) || 0,
              freeMemory: Number(info.freeMemory) || 0,
              cpuModel: String(info.cpuModel || 'N/A'),
              cpuCores: Number(info.cpuCores) || 0,
              cpuSpeed: info.cpuSpeed ? String(info.cpuSpeed) : 'N/A',
              gpuInfo: String(info.gpuInfo || 'N/A'),
              storageInfo: Array.isArray(info.storageInfo)
                ? info.storageInfo.map((drive) => ({
                    mount: String(drive.mount || ''),
                    size: Number(drive.size) || 0,
                    used: Number(drive.used) || 0,
                    available: Number(drive.available) || 0
                  }))
                : []
            }

            // 更新系统信息
            systemInfo.value = {
              ...systemInfo.value,
              ...cleanInfo
            }

            // 缓存系统信息
            await settingsStore.cacheSystemInfo(cleanInfo)
          }
        } else {
          console.warn('electronAPI.getSystemInfo 不可用')

          // 使用备用方法获取基本信息
          const platform = window.navigator.platform
          const userAgent = window.navigator.userAgent

          // 尝试从用户代理判断操作系统
          let osName = 'Unknown OS'
          let osVersion = ''

          if (userAgent.indexOf('Windows') !== -1) {
            osName = 'Windows'
            const winVersionMatch = userAgent.match(/Windows NT (\d+\.\d+)/)
            if (winVersionMatch) {
              const winVersion = parseFloat(winVersionMatch[1])
              if (winVersion === 10.0) osVersion = '10'
              else if (winVersion === 6.3) osVersion = '8.1'
              else if (winVersion === 6.2) osVersion = '8'
              else if (winVersion === 6.1) osVersion = '7'
              else osVersion = winVersionMatch[1]
            }
          } else if (userAgent.indexOf('Mac') !== -1) {
            osName = 'macOS'
            const macVersionMatch = userAgent.match(/Mac OS X (\d+[._]\d+)/)
            if (macVersionMatch) {
              osVersion = macVersionMatch[1].replace('_', '.')
            }
          } else if (userAgent.indexOf('Linux') !== -1) {
            osName = 'Linux'
          }

          // 获取架构信息
          let arch = platform || 'unknown'

          // 更新系统信息
          const cleanInfo = {
            osName,
            osVersion,
            arch
          }

          systemInfo.value = {
            ...systemInfo.value,
            ...cleanInfo
          }

          // 缓存基本系统信息
          await settingsStore.cacheSystemInfo(cleanInfo)
        }

        // 设置加载状态为 false
        isSystemInfoLoading.value = false
        return systemInfo.value
      } catch (error) {
        console.error('获取系统信息失败:', error)
        isSystemInfoLoading.value = false
      }
    }

    isSystemInfoLoading.value = false
    return systemInfo.value
  }

  // 从API获取应用数据
  async function getAppsData() {
    if (window.electronAPI && window.electronAPI.getAppsData) {
      const appsData = await window.electronAPI.getAppsData()
      return appsData
    }
    return []
  }

  // 从存储加载所有应用
  async function loadApps() {
    try {
      isAppsLoading.value = true
      // 初始化存储
      await electronStore.initializeStorage()
      // 从存储获取应用
      const storedApps = await getAppsData()
      console.log('storedApps', storedApps)
      apps.value = storedApps
      console.log('应用数据已加载:', apps.value)
      isAppsLoading.value = false
      return apps.value
    } catch (error) {
      console.error('加载应用数据失败:', error)
      isAppsLoading.value = false
      throw error
    }
  }

  // 添加新应用
  async function addApp(app) {
    try {
      console.log('appStore.addApp 被调用:', app.name, '当前 apps 长度:', apps.value.length)
      // 创建一个干净的可序列化副本
      const cleanApp = JSON.parse(JSON.stringify(app))
      // 添加到本地数组
      apps.value.push(cleanApp)
      console.log('appStore.addApp 添加后 apps 长度:', apps.value.length)
      // 添加到存储
      if (window.electronAPI && window.electronAPI.createApp) {
        let result = await window.electronAPI.createApp(cleanApp)
        console.log('appStore.addApp 添加后 apps 长度:', apps.value.length)
        return result
      }
      // await electronStore.addApp(cleanApp)
      return cleanApp
    } catch (error) {
      console.error('添加应用失败:', error)
      throw error
    }
  }

  // 更新现有应用
  async function updateApp(updatedApp) {
    try {
      // 创建一个干净的可序列化副本
      const cleanApp = JSON.parse(JSON.stringify(updatedApp))
      // 查找应用索引
      const index = apps.value.findIndex((app) => app.id === cleanApp.id)
      if (index !== -1) {
        // 更新本地数组
        apps.value[index] = cleanApp
        // 更新存储
        await electronStore.updateApp(cleanApp)
        return cleanApp
      }
      throw new Error(`未找到ID为 ${cleanApp.id} 的应用`)
    } catch (error) {
      console.error('更新应用失败:', error)
      throw error
    }
  }

  // 删除应用
  async function deleteApp(appId) {
    try {
      // 从本地数组移除
      apps.value = apps.value.filter((app) => app.id !== appId)
      // 从存储移除
      await electronStore.deleteApp(appId)
      return true
    } catch (error) {
      console.error('删除应用失败:', error)
      throw error
    }
  }

  return {
    // 状态
    appName,
    appVersion,
    isDarkMode,
    systemInfo,
    isSystemInfoLoading,
    apps,
    isAppsLoading,

    // Getter
    fullAppName,

    // 动作
    toggleDarkMode,
    getVersionInfo,
    getSystemInfo,
    getAppsData,
    loadApps,
    addApp,
    updateApp,
    deleteApp
  }
})
