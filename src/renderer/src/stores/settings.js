import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    // 标记是否已经从后端加载数据
    isInitialized: false,
    // 标记数据是否已经修改，需要保存
    isDirty: false,
    // 标记是否正在保存
    isSaving: false,
    // 上次从后端加载时间
    lastLoadTime: null,
    // 缓存过期时间（毫秒）
    cacheExpirationTime: 60000, // 1分钟

    // 基础设置
    appSpace: '', // 应用空间路径
    huggingfaceDir: '', // HuggingFace 模型存储目录
    pipSource: 'https://pypi.org/simple', // pip 默认源
    githubMirrorUrl: '', // GitHub 镜像地址
    version: '1.0.0', // 应用版本

    // 高级设置
    debugMode: false, // 调试模式

    // 系统设置
    language: 'zh_CN', // 应用语言
    theme: 'light', // 应用主题

    // 系统信息缓存
    cachedSystemInfo: null, // 缓存的系统信息

    // 内置的 pip 源选项
    pipSourceOptions: [
      { label: '官方源 (PyPI)', value: 'https://pypi.org/simple' },
      { label: '清华大学源', value: 'https://pypi.tuna.tsinghua.edu.cn/simple' },
      { label: '阿里云源', value: 'https://mirrors.aliyun.com/pypi/simple' },
      {
        label: '腾讯云源',
        value: 'https://mirrors.cloud.tencent.com/pypi/simple'
      },
      {
        label: '华为云源',
        value: 'https://repo.huaweicloud.com/repository/pypi/simple'
      }
    ],

    // 内置的 GitHub 镜像选项
    githubMirrorOptions: [
      { label: '不使用镜像', value: '' },
      { label: 'ghproxy.com', value: 'https://ghproxy.com/' },
      { label: 'GitHub 镜像 1', value: 'https://github.moeyy.xyz/' },
      { label: 'FastGit', value: 'https://download.fastgit.org/' },
      { label: 'GitClone', value: 'https://gitclone.com/github.com/' },
      { label: '自定义', value: 'custom' }
    ]
  }),

  getters: {
    // 检查缓存是否已过期
    isCacheExpired() {
      if (!this.lastLoadTime) return true
      return Date.now() - this.lastLoadTime > this.cacheExpirationTime
    },

    // 状态只读输出
    status() {
      return {
        isInitialized: this.isInitialized,
        isDirty: this.isDirty,
        isSaving: this.isSaving,
        lastLoadTime: this.lastLoadTime
      }
    }
  },

  actions: {
    // 获取配置 - 如果已经初始化且缓存未过期，直接返回缓存数据
    async loadSettings(forceRefresh = false) {
      try {
        // 如果已初始化且不需要强制刷新且缓存未过期，直接返回
        if (this.isInitialized && !forceRefresh && !this.isCacheExpired) {
          console.log('使用缓存的设置数据')
          return true
        }

        console.log('从后端读取设置数据')
        // 从存储中读取设置
        // const settings = await electronStore.readJsonFile('settings')
        const settings = await window.electronAPI.getSettingsData()
        if (settings) {
          // 应用从存储中读取的设置
          this.appSpace = settings.appSpace || ''
          this.huggingfaceDir = settings.huggingfaceDir || ''
          this.pipSource = settings.pipSource || 'https://pypi.org/simple'
          this.githubMirrorUrl = settings.githubMirrorUrl || ''
          this.version = settings.version || '1.0.0'
          this.debugMode = settings.debugMode || false
          this.language = settings.language || 'zh_CN'
          this.theme = settings.theme || 'light'
          this.cachedSystemInfo = settings.systemInfo || null

          // 更新状态和时间戳
          this.isInitialized = true
          this.lastLoadTime = Date.now()
          this.isDirty = false

          return true
        }
        return false
      } catch (error) {
        console.error('加载设置失败:', error)
        return false
      }
    },

    // 保存配置
    async saveSettings() {
      try {
        // 如果没有修改，不需要保存
        if (!this.isDirty && this.isInitialized) {
          console.log('设置未修改，无需保存')
          return true
        }

        // 防止重复保存
        if (this.isSaving) {
          console.log('正在保存设置，请稍候...')
          return false
        }

        this.isSaving = true
        console.log('保存设置到后端')

        // 准备设置对象
        const settings = {
          appSpace: this.appSpace,
          huggingfaceDir: this.huggingfaceDir,
          pipSource: this.pipSource,
          githubMirrorUrl: this.githubMirrorUrl,
          version: this.version,
          debugMode: this.debugMode,
          language: this.language,
          theme: this.theme,
          systemInfo: this.sanitizeSystemInfo(this.cachedSystemInfo)
        }

        // 保存到存储
        const result = await window.electronAPI.writeSettingsData(settings)

        if (result) {
          this.isDirty = false
          this.lastLoadTime = Date.now()
        }

        this.isSaving = false
        return result
      } catch (error) {
        console.error('保存设置失败:', error)
        this.isSaving = false
        return false
      }
    },

    // 清理系统信息，确保可序列化
    sanitizeSystemInfo(systemInfo) {
      if (!systemInfo) return null

      try {
        // 将对象转为JSON再解析回来，以移除所有不可序列化的内容
        // 这是确保对象可序列化的简单方法
        const jsonString = JSON.stringify(systemInfo)
        return JSON.parse(jsonString)
      } catch (error) {
        console.error('系统信息序列化失败:', error)

        // 如果整个对象无法序列化，构造一个安全的简化版本
        return {
          osName: systemInfo?.osName || '',
          osVersion: systemInfo?.osVersion || '',
          arch: systemInfo?.arch || '',
          totalMemory: typeof systemInfo?.totalMemory === 'number' ? systemInfo.totalMemory : 0,
          freeMemory: typeof systemInfo?.freeMemory === 'number' ? systemInfo.freeMemory : 0,
          cpuModel: systemInfo?.cpuModel || '',
          cpuCores: typeof systemInfo?.cpuCores === 'number' ? systemInfo.cpuCores : 0,
          cpuSpeed:
            typeof systemInfo?.cpuSpeed === 'number' || typeof systemInfo?.cpuSpeed === 'string'
              ? systemInfo.cpuSpeed
              : '',
          gpuInfo: typeof systemInfo?.gpuInfo === 'string' ? systemInfo.gpuInfo : '',
          // 如果存储信息是数组且不为空，过滤并保留安全的属性
          storageInfo: Array.isArray(systemInfo?.storageInfo)
            ? systemInfo.storageInfo.map((drive) => ({
                mount: drive.mount || '',
                size: typeof drive.size === 'number' ? drive.size : 0,
                used: typeof drive.used === 'number' ? drive.used : 0,
                available: typeof drive.available === 'number' ? drive.available : 0
              }))
            : []
        }
      }
    },

    // 立即更新并保存单个设置
    async updateSetting(key, value) {
      try {
        if (key in this) {
          this[key] = value
          // 标记已修改
          this.isDirty = true
          // 立即保存更改
          await this.saveSettings()
          return true
        }
        return false
      } catch (error) {
        console.error(`更新设置失败 (${key}):`, error)
        return false
      }
    },

    // 缓存系统信息
    async cacheSystemInfo(systemInfo) {
      if (systemInfo) {
        // 确保系统信息在存储前已经被清理
        this.cachedSystemInfo = this.sanitizeSystemInfo(systemInfo)
        this.isDirty = true
        await this.saveSettings()
        return true
      }
      return false
    },

    // 获取缓存的系统信息
    getCachedSystemInfo() {
      return this.cachedSystemInfo
    },

    // 选择目录并立即保存设置
    async selectDirectory(settingName) {
      if (window.electronAPI && window.electronAPI.showOpenDialog) {
        try {
          // 调用 electron 的文件夹选择对话框
          const result = await window.electronAPI.showOpenDialog({
            title: settingName === 'appSpace' ? '选择应用空间目录' : '选择HuggingFace模型目录',
            defaultPath: settingName === 'appSpace' ? this.appSpace : this.huggingfaceDir,
            properties: ['openDirectory']
          })

          // 如果用户选择了目录
          if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
            const selectedPath = result.filePaths[0]

            // 根据传入的设置名称更新对应的路径
            if (settingName === 'appSpace') {
              this.appSpace = selectedPath
            } else if (settingName === 'huggingfaceDir') {
              this.huggingfaceDir = selectedPath
            }

            // 标记已修改
            this.isDirty = true
            // 立即保存设置
            await this.saveSettings()
            return selectedPath
          }
        } catch (error) {
          console.error('选择目录失败:', error)
        }
      } else {
        console.warn('electronAPI.showOpenDialog 不可用')
        // 在开发环境中，模拟选择目录的行为
        if (process.env.NODE_ENV === 'development') {
          const mockPath =
            settingName === 'appSpace'
              ? 'C:\\Users\\User\\AppData\\Local\\AIDoU\\AppSpace'
              : 'C:\\Users\\User\\AppData\\Local\\AIDoU\\Models'

          if (settingName === 'appSpace') {
            this.appSpace = mockPath
          } else if (settingName === 'huggingfaceDir') {
            this.huggingfaceDir = mockPath
          }

          // 标记已修改
          this.isDirty = true
          // 立即保存设置
          await this.saveSettings()
          return mockPath
        }
      }
      return null
    },

    // 重置为默认设置
    async resetToDefaults() {
      this.appSpace = ''
      this.huggingfaceDir = ''
      this.pipSource = 'https://pypi.org/simple'
      this.githubMirrorUrl = ''
      this.version = '1.0.0'
      this.debugMode = false
      this.language = 'zh_CN'
      this.theme = 'light'

      // 标记已修改
      this.isDirty = true
      // 立即保存默认设置
      await this.saveSettings()
    },

    // 初始化设置
    async initializeSettings() {
      // 如果已经初始化且缓存未过期，直接返回
      if (this.isInitialized && !this.isCacheExpired) {
        console.log('设置已初始化，使用缓存数据')
        return true
      }

      // 确保设置文件存在
      try {
        // 检查设置文件是否存在，不存在则创建
        // const settings = await electronStore.readJsonFile('settings')
        const settings = await window.electronAPI.getSettingsData()
        if (!settings || Object.keys(settings).length === 0) {
          // 首次初始化，保存默认设置
          this.isDirty = true
          await this.saveSettings()
        } else {
          // 如果设置已存在，加载它们
          await this.loadSettings(true) // 强制刷新
        }
        return true
      } catch (error) {
        console.error('初始化设置失败:', error)
        return false
      }
    }
  }
})
