import { defineStore } from 'pinia'
import { useSettingsStore } from './settings'
import electronStore from '../services/electronStore'

export const useAppStore = defineStore('app', {
  state: () => ({
    appName: 'AI-Dou',
    appVersion: '0.1.0',
    isDarkMode: false,
    // 添加系统信息加载状态
    isSystemInfoLoading: true,
    // Apps数据状态
    apps: [],
    isAppsLoading: false,

    // 系统信息
    systemInfo: {
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
    }
  }),

  getters: {
    fullAppName: (state) => {
      // return `${state.appName} v${state.appVersion}`;
      return `${state.appName}`
    }
  },

  actions: {
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode
    },

    async getVersionInfo() {
      if (window.electronAPI) {
        try {
          // 获取应用版本
          this.appVersion = (await window.electronAPI.getAppVersion()) || '0.1.0'

          // 获取 Electron 版本
          const processVersions = window.navigator.userAgent.match(/Electron\/(\d+\.\d+\.\d+)/)
          if (processVersions && processVersions[1]) {
            this.systemInfo.electronVersion = processVersions[1]
          }

          // 获取 Chrome 版本
          const chromeMatch = window.navigator.userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/)
          if (chromeMatch && chromeMatch[1]) {
            this.systemInfo.chromeVersion = chromeMatch[1]
          }

          // 获取 Node.js 版本 - 安全处理避免在浏览器环境中出错
          if (window.electronAPI.getNodeVersion) {
            this.systemInfo.nodeVersion = await window.electronAPI.getNodeVersion()
          } else if (typeof process !== 'undefined' && process.versions && process.versions.node) {
            this.systemInfo.nodeVersion = process.versions.node
          } else {
            this.systemInfo.nodeVersion = 'N/A (Browser Environment)'
          }

          // 获取详细系统信息
          await this.getSystemInfo()
        } catch (error) {
          console.error('获取版本信息失败:', error)
        }
      }
    },

    // 获取系统详细信息
    async getSystemInfo(forceRefresh = false) {
      if (window.electronAPI) {
        try {
          // 设置加载状态为 true
          this.isSystemInfoLoading = true

          // 检查是否有缓存的系统信息
          const settingsStore = useSettingsStore()
          const cachedInfo = settingsStore.getCachedSystemInfo()

          // 如果有缓存的系统信息并且不是强制刷新，直接使用缓存
          if (cachedInfo && !forceRefresh) {
            this.systemInfo = {
              ...this.systemInfo,
              ...cachedInfo
            }
            console.log('使用缓存的系统信息')
            this.isSystemInfoLoading = false
            return this.systemInfo
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
              this.systemInfo = {
                ...this.systemInfo,
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

            this.systemInfo = {
              ...this.systemInfo,
              ...cleanInfo
            }

            // 缓存基本系统信息
            await settingsStore.cacheSystemInfo(cleanInfo)
          }

          // 设置加载状态为 false
          this.isSystemInfoLoading = false
          return this.systemInfo
        } catch (error) {
          console.error('获取系统信息失败:', error)
          this.isSystemInfoLoading = false
        }
      }

      this.isSystemInfoLoading = false
      return this.systemInfo
    },

    // 从API获取应用数据
    async getAppsData() {
      if (window.electronAPI && window.electronAPI.getAppsData) {
        const appsData = await window.electronAPI.getAppsData()
        return appsData
      }
      return []
    },

    // 从存储加载所有应用
    async loadApps() {
      try {
        this.isAppsLoading = true
        // 初始化存储
        await electronStore.initializeStorage()
        // 从存储获取应用
        const storedApps = await this.getAppsData()
        console.log('storedApps', storedApps)
        this.apps = storedApps
        console.log('应用数据已加载:', this.apps)
        this.isAppsLoading = false
        return this.apps
      } catch (error) {
        console.error('加载应用数据失败:', error)
        this.isAppsLoading = false
        throw error
      }
    },

    // 添加新应用
    async addApp(app) {
      try {
        console.log('appStore.addApp 被调用:', app.name, '当前 apps 长度:', this.apps.length)
        // 创建一个干净的可序列化副本
        const cleanApp = JSON.parse(JSON.stringify(app))
        // 添加到本地数组
        this.apps.push(cleanApp)
        console.log('appStore.addApp 添加后 apps 长度:', this.apps.length)
        // 添加到存储
        if (window.electronAPI && window.electronAPI.createApp) {
          let result = await window.electronAPI.createApp(cleanApp)
          console.log('appStore.addApp 添加后 apps 长度:', this.apps.length)
          return result
        }
        // await electronStore.addApp(cleanApp)
        return cleanApp
      } catch (error) {
        console.error('添加应用失败:', error)
        throw error
      }
    },

    // 更新现有应用
    async updateApp(updatedApp) {
      try {
        // 创建一个干净的可序列化副本
        const cleanApp = JSON.parse(JSON.stringify(updatedApp))
        // 查找应用索引
        const index = this.apps.findIndex((app) => app.id === cleanApp.id)
        if (index !== -1) {
          // 更新本地数组
          this.apps[index] = cleanApp
          // 更新存储
          await electronStore.updateApp(cleanApp)
          return cleanApp
        }
        throw new Error(`未找到ID为 ${cleanApp.id} 的应用`)
      } catch (error) {
        console.error('更新应用失败:', error)
        throw error
      }
    },

    // 删除应用
    async deleteApp(appId) {
      try {
        // 从本地数组移除
        this.apps = this.apps.filter((app) => app.id !== appId)
        // 从存储移除
        await electronStore.deleteApp(appId)
        return true
      } catch (error) {
        console.error('删除应用失败:', error)
        throw error
      }
    }
  }
})
