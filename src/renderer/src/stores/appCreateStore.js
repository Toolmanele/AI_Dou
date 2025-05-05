import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
export const useAppCreateStore = defineStore('appCreate', () => {
  // 应用基本数据
  const pythonEnvTemplate = [
    {
      pythonVersion: '3.10',
      pytorch: {
        source: '',
        installCommands: ['pip install torch torchvision torchaudio']
      },
      pip: {
        source: '',
        installCommands: ['pip install -r requirements.txt']
      },
      startCommand: '',
      isInstalled: false,
      isDefault: true,
      isCollapsed: false,
      isInstalling: false,
      installProgress: 0,
      installLogs: [],
      installError: '',
      needConfigAppSpace: false,
      showLogs: false,
      pythonPath: ''
    }
  ]
  const appDataTemplate = {
    id: '',
    name: '',
    version: '1.0.0',
    type: 'app',
    from: '', // folder, github, seed
    description: '',
    tags: [],
    folderPath: '',
    modelDir: '',
    outputDir: '',
    createdAt: '',

    // GitHub 仓库配置
    github: {
      repos: []
    },

    // GitHub 安装进度跟踪
    githubInstallLogs: [],
    githubInstallStatus: '', // 'progress', 'success', 'error'
    githubInstallError: '',

    // 种子数据
    seedData: null,
    // Python 环境配置
    pythonEnvironments: pythonEnvTemplate
  }

  const appData = reactive({ ...appDataTemplate })
  const githubTemp = {
    github: {
      repos: []
    }
  }
  const seedTemp = {
    seed: null,
    github: {
      repos: []
    }
  }
  const folderTemp = {
    folderPath: '',
    github: {
      repos: []
    }
  }
  // 错误信息
  const errors = reactive({
    name: '',
    startCommand: '',
    repoUrl: '',
    customMirrorUrl: ''
  })

  const lastSelectedSource = ref('')
  // 当前选中的种子
  const selectedSeed = ref(null)

  // 这里的切换就是 创建一个模板,然后合并
  // 从文件夹创建,可以选择 app路径, 环境路径, 也可以自定义环境
  // 主要是老项目

  // 从github创建,可以选择 github仓库,
  // 自定义路径
  // 选择创建来源
  async function selectSource(source) {
    console.log('selectSource', source)
    if (lastSelectedSource.value !== source) {
      // 保存当前数据到临时存储
      if (appData.from === 'folder') {
        if (folderTemp.workingDir) {
          // basename
          // appData.name = await window.electronAPI.getFolderBasename(
          //   folderTemp.workingDir
          // );
          // console.log(appData.name);
          appData.folderPath = folderTemp.workingDir
        }
      } else if (appData.from === 'github') {
        if (githubTemp.repos && githubTemp.repos.length) {
          let selectedRepo = githubTemp.repos.find((repo) => repo.isSelected)
          if (selectedRepo) {
            let url = new URL(selectedRepo.url)
            appData.name = url.pathname.split('/').pop()
            appData.folderPath = await window.electronAPI.getAppappData.folderPath(
              selectedRepo.path
            )
          }
        }
      }

      // 切换来源
      appData.from = source

      // 恢复临时存储的数据
    }
  }

  // 处理文件夹选择结果
  function handleFolderConfirm(data) {
    appData.from = 'folder'
    appData.folderPath = data.path
    appData.workingDir = data.path
  }

  // 处理GitHub设置结果
  function handleGithubConfirm(data) {
    // showGithubModal.value = false;
    appData.from = 'github'

    // 保存 Git 仓库配置
    appData.github = {
      ...appData.github,
      ...data.config
    }

    // 同时更新临时存储
    appData.githubTemp = {
      repoUrl: data.config.repoUrl,
      repoAddresses: data.config.repoAddresses || [],
      name: data.config.name || '',
      defaultRepoUrl: data.config.defaultRepoUrl || data.config.repoUrl
    }
  }

  // 处理种子选择结果
  function handleSeedConfirm(data) {
    appData.from = 'seed'
    selectedSeed.value = data.seed
    appData.seedData = data.seed

    // 自动填充应用信息
    if (data.seed.name && !appData.name) {
      appData.name = data.seed.name
    }

    if (data.seed.description && !appData.description) {
      appData.description = data.seed.description
    }

    // 添加标签
    if (data.seed.tags && data.seed.tags.length > 0 && appData.tags.length === 0) {
      appData.tags = [...data.seed.tags]
    }
  }

  // 重置表单
  function resetForm() {
    Object.assign(appData, { ...appDataTemplate })

    // 重置错误信息
    Object.assign(errors, {
      name: '',
      startCommand: '',
      repoUrl: '',
      customMirrorUrl: ''
    })

    // 重置 GitHub 安装进度
    appData.githubInstallLogs = []
    appData.githubInstallStatus = ''
    appData.githubInstallError = ''

    // 重置其他状态
    selectedSeed.value = null
  }

  // 加载现有应用数据
  function loadExistingApp(app) {
    if (!app) return

    // 加载基本信息
    appData.id = app.id || `app-${Date.now()}`
    appData.name = app.name || ''
    appData.description = app.description || ''
    appData.tags = Array.isArray(app.tags) ? [...app.tags] : []
    appData.createdAt = app.createdAt || new Date().toISOString()

    // 加载GitHub信息
    if (app.github) {
      appData.github = {
        repoUrl: app.github.repoUrl || '',
        useMirror: app.github.useMirror || false,
        mirrorType: app.github.mirrorType || 'global',
        customMirrorUrl: app.github.customMirrorUrl || '',
        name: app.github.name || '',
        defaultRepoUrl: app.github.defaultRepoUrl || '',
        repoAddresses: app.github.repoAddresses || []
      }
    }

    // 加载Python环境信息
    if (app.pythonInfo) {
      // 兼容旧数据格式
      if (!Array.isArray(app.pythonInfo)) {
        appData.pythonEnvironments = [
          {
            pythonVersion: app.pythonInfo.version || '3.10',
            installCommands:
              Array.isArray(app.pythonInfo.installCommands) && app.pythonInfo.installCommands.length
                ? [...app.pythonInfo.installCommands]
                : ['pip install -r requirements.txt'],
            startCommand: app.pythonInfo.startCommand || 'python main.py',
            isInstalled: app.pythonInfo.isInstalled || false,
            isDefault: true,
            isCollapsed: false,
            isInstalling: false,
            installProgress: 0,
            installLogs: [],
            installError: '',
            needConfigAppSpace: false,
            showLogs: false,
            pythonPath: app.pythonInfo.pythonPath || '',
            pipMirrorType: app.pythonInfo.pipMirrorType || 'default',
            customPipMirrorUrl: app.pythonInfo.customPipMirrorUrl || '',
            customPipMirrorName: app.pythonInfo.customPipMirrorName || ''
          }
        ]
      } else {
        // 新格式：环境列表
        appData.pythonEnvironments = app.pythonInfo.map((env, index) => ({
          pythonVersion: env.pythonVersion || '3.10',
          installCommands: env.installCommands || ['pip install -r requirements.txt'],
          startCommand: env.startCommand || '',
          isDefault: env.isDefault || index === 0,
          isInstalled: env.isInstalled || false,
          isCollapsed: index !== 0,
          isInstalling: false,
          installProgress: 0,
          installLogs: env.installLogs || [],
          installError: env.installError || '',
          needConfigAppSpace: false,
          showLogs: false,
          pythonPath: env.pythonPath || '',
          pipMirrorType: env.pipMirrorType || 'default',
          customPipMirrorUrl: env.customPipMirrorUrl || '',
          customPipMirrorName: env.customPipMirrorName || ''
        }))

        // 确保至少有一个默认环境
        if (!appData.pythonEnvironments.some((env) => env.isDefault)) {
          appData.pythonEnvironments[0].isDefault = true
        }
      }

      appData.workingDir = app.pythonInfo.workingDir || ''

      // 更新appData.folderPath
      if (app.pythonInfo.workingDir) {
        appData.folderPath = app.pythonInfo.workingDir
      }
    }

    // 加载模型信息
    if (app.modelInfo) {
      appData.modelType = app.modelInfo.type || 'auto-import'

      // 加载直接定义的目录
      if (app.modelInfo.modelDir) {
        appData.modelDir = app.modelInfo.modelDir
      }

      if (app.modelInfo.modelCacheDir) {
        appData.modelCacheDir = app.modelInfo.modelCacheDir
      }

      if (app.modelInfo.outputDir) {
        appData.outputDir = app.modelInfo.outputDir
      }

      // 兼容旧版本：从modelFolders数组加载目录
      if (Array.isArray(app.modelInfo.modelFolders) && app.modelInfo.modelFolders.length) {
        // 如果目录未直接设置，从modelFolders获取
        if (!appData.modelDir && app.modelInfo.modelFolders[0]) {
          appData.modelDir = app.modelInfo.modelFolders[0]
        }

        if (!appData.modelCacheDir && app.modelInfo.modelFolders[1]) {
          appData.modelCacheDir = app.modelInfo.modelFolders[1]
        }

        if (!appData.outputDir && app.modelInfo.modelFolders[2]) {
          appData.outputDir = app.modelInfo.modelFolders[2]
        }
      }

      // API相关信息
      appData.apiProvider = app.modelInfo.apiProvider || 'openai'
      appData.customApiEndpoint = app.modelInfo.apiEndpoint || ''

      // 出于安全考虑，不直接加载API密钥
      // 而是表明是否有密钥
      appData.apiKey = app.modelInfo.hasApiKey ? '********' : ''
    }

    // 根据from设置正确的创建来源
    if (app.pythonInfo && app.pythonInfo.workingDir) {
      appData.from = 'folder'
    } else if (app.github && app.github.repoUrl) {
      appData.from = 'github'
    } else {
      appData.from = 'seed'
    }
  }

  // 添加/移除标签
  function addTag(tag) {
    if (tag && !appData.tags.includes(tag)) {
      appData.tags.push(tag)
    }
  }

  function removeTag(tag) {
    const index = appData.tags.indexOf(tag)
    if (index !== -1) {
      appData.tags.splice(index, 1)
    }
  }

  function toggleTag(tag) {
    if (appData.tags.includes(tag)) {
      removeTag(tag)
    } else {
      addTag(tag)
    }
  }

  // 验证表单
  function validateForm() {
    let isValid = true

    // 验证应用名称
    if (!appData.name.trim()) {
      errors.name = '应用名称不能为空'
      isValid = false
    } else {
      errors.name = ''
    }

    // 验证启动命令
    if (!appData.pythonEnvironments[0]?.startCommand.trim()) {
      errors.startCommand = '启动命令不能为空'
      isValid = false
    } else {
      errors.startCommand = ''
    }

    // 验证GitHub仓库地址（仅当选择GitHub来源时）
    if (appData.from === 'github') {
      if (!appData.github.repoUrl.trim()) {
        errors.repoUrl = 'GitHub 仓库地址不能为空'
        isValid = false
      } else {
        const githubUrlPattern = /^(https?:\/\/)?(www\.)?github\.com\/[\w.-]+\/[\w.-]+(\.git)?$/
        if (!githubUrlPattern.test(appData.github.repoUrl)) {
          errors.repoUrl = 'GitHub 仓库地址格式不正确'
          isValid = false
        } else {
          errors.repoUrl = ''
        }
      }
    }

    return isValid
  }

  // 设置文件夹路径
  async function setFolderPath(path) {
    appData.folderPath = path
    appData.workingDir = path

    let result = await window.electronAPI.getFolderBasename(path)
    console.log('result', result)
  }

  // 直接设置应用数据
  function setAppData(data) {
    if (!data) return

    // 设置基本信息
    if (data.name) appData.name = data.name
    if (data.description) appData.description = data.description
    if (Array.isArray(data.tags)) appData.tags = [...data.tags]
    if (data.folderPath) {
      appData.folderPath = data.folderPath
    }

    // 设置模型相关信息
    if (data.modelDir) appData.modelDir = data.modelDir
    if (data.outputDir) appData.outputDir = data.outputDir

    // 设置环境信息
    if (Array.isArray(data.pythonEnvironments) && data.pythonEnvironments.length > 0) {
      appData.pythonEnvironments = data.pythonEnvironments.map((env) => ({
        pythonVersion: env.pythonVersion || '3.10',
        pytorch: {
          source: env.pytorch?.source || '',
          installCommands: env.pytorch?.installCommands || [
            'pip install torch torchvision torchaudio'
          ]
        },
        pip: {
          source: env.pip?.source || '',
          installCommands: env.pip?.installCommands || ['pip install -r requirements.txt']
        },
        startCommand: env.startCommand || '',
        isInstalled: env.isInstalled || false,
        isDefault: env.isDefault || false,
        isCollapsed: false,
        isInstalling: false,
        installProgress: 0,
        installLogs: [],
        installError: '',
        needConfigAppSpace: false,
        showLogs: false,
        pythonPath: env.pythonPath || ''
      }))

      // 确保至少有一个默认环境
      if (!appData.pythonEnvironments.some((env) => env.isDefault)) {
        appData.pythonEnvironments[0].isDefault = true
      }
    }
  }

  function setAppDataFromGithub(githubUrl) {
    // Save current data to appropriate temp storage based on current source
    if (appData.from === 'folder') {
      // Save folder data to folderTemp
      folderTemp.folderPath = appData.folderPath
      folderTemp.name = appData.name
      folderTemp.description = appData.description
      folderTemp.tags = [...appData.tags]
      folderTemp.pythonEnvironments = JSON.parse(JSON.stringify(appData.pythonEnvironments))
    } else if (appData.from === 'seed') {
      // Save seed data to seedTemp
      seedTemp.seed = appData.seedData
      seedTemp.name = appData.name
      seedTemp.description = appData.description
      seedTemp.tags = [...appData.tags]
      seedTemp.pythonEnvironments = JSON.parse(JSON.stringify(appData.pythonEnvironments))
    }

    // Check if we have saved GitHub data
    if (githubTemp.name && githubTemp.github.repos.length > 0) {
      // Restore from saved Github temp data
      Object.assign(appData, { ...appDataTemplate })
      appData.from = 'github'
      appData.name = githubTemp.name
      appData.description = githubTemp.description || ''
      appData.tags = githubTemp.tags || []
      appData.github.repos = [...githubTemp.github.repos]
      if (githubTemp.pythonEnvironments) {
        appData.pythonEnvironments = JSON.parse(JSON.stringify(githubTemp.pythonEnvironments))
      }
    } else {
      // Start with template data
      Object.assign(appData, { ...appDataTemplate })
      appData.from = 'github'

      // If a URL was provided, use it
      if (githubUrl) {
        setAppByGithub(githubUrl)
      }
    }

    // Set creation date if it's a new app
    if (!appData.createdAt) {
      appData.createdAt = new Date().toISOString()
    }
  }

  function setAppByGithub(githubUrl) {
    if (!githubUrl) return

    try {
      // Extract repo name from GitHub URL
      const url = new URL(githubUrl)
      const pathParts = url.pathname.split('/').filter(Boolean)

      if (pathParts.length >= 2) {
        // Get name from the last part of the path (repo name)
        // Remove .git extension if present
        let repoName = pathParts[pathParts.length - 1]
        repoName = repoName.replace(/\.git$/, '')

        appData.name = repoName

        // Add GitHub repo URL to repos array
        appData.github.repos = [githubUrl]
      }
    } catch (error) {
      console.error('Error parsing GitHub URL:', error)
    }
  }

  function setAppDataFromFolder(folderPath) {
    // Save current data to appropriate temp storage based on current source
    if (appData.from === 'github') {
      // Save github data to githubTemp
      githubTemp.name = appData.name
      githubTemp.description = appData.description
      githubTemp.tags = [...appData.tags]
      githubTemp.github.repos = [...appData.github.repos]
      githubTemp.pythonEnvironments = JSON.parse(JSON.stringify(appData.pythonEnvironments))
    } else if (appData.from === 'seed') {
      // Save seed data to seedTemp
      seedTemp.seed = appData.seedData
      seedTemp.name = appData.name
      seedTemp.description = appData.description
      seedTemp.tags = [...appData.tags]
      seedTemp.pythonEnvironments = JSON.parse(JSON.stringify(appData.pythonEnvironments))
    }

    // Check if we have saved folder data
    if (folderTemp.folderPath) {
      // Restore from saved folder temp data
      Object.assign(appData, { ...appDataTemplate })
      appData.from = 'folder'
      appData.name = folderTemp.name || ''
      appData.description = folderTemp.description || ''
      appData.tags = folderTemp.tags || []
      appData.folderPath = folderTemp.folderPath
      if (folderTemp.pythonEnvironments) {
        appData.pythonEnvironments = JSON.parse(JSON.stringify(folderTemp.pythonEnvironments))
      }
    } else {
      // Start with template data
      Object.assign(appData, { ...appDataTemplate })
      appData.from = 'folder'

      // If a folder path was provided, use it
      if (folderPath) {
        setAppByFolder(folderPath)
      }
    }

    // Set creation date if it's a new app
    if (!appData.createdAt) {
      appData.createdAt = new Date().toISOString()
    }
  }

  function setAppByFolder(folderPath) {
    try {
      // Extract folder name from path
      const folderName = folderPath.split(/[/\\]/).pop()

      if (folderName) {
        appData.name = folderName
      }

      // Set folder path
      appData.folderPath = folderPath
    } catch (error) {
      console.error('Error parsing folder path:', error)
    }
  }

  // 从种子数据直接设置应用数据
  async function setAppDataFromSeed(seed) {
    // Save current data to appropriate temp storage based on current source
    if (appData.from === 'github') {
      // Save github data to githubTemp
      githubTemp.name = appData.name
      githubTemp.description = appData.description
      githubTemp.tags = [...appData.tags]
      githubTemp.github.repos = [...appData.github.repos]
      githubTemp.pythonEnvironments = JSON.parse(JSON.stringify(appData.pythonEnvironments))
    } else if (appData.from === 'folder') {
      // Save folder data to folderTemp
      folderTemp.folderPath = appData.folderPath
      folderTemp.name = appData.name
      folderTemp.description = appData.description
      folderTemp.tags = [...appData.tags]
      folderTemp.pythonEnvironments = JSON.parse(JSON.stringify(appData.pythonEnvironments))
    }

    // Check if we have saved seed data for this seed
    if (seedTemp.seed && (!seed || seedTemp.seed.id === seed.id)) {
      // Restore from saved seed temp data
      Object.assign(appData, { ...appDataTemplate })
      appData.from = 'seed'
      appData.name = seedTemp.name || ''
      appData.description = seedTemp.description || ''
      appData.tags = seedTemp.tags || []
      appData.seedData = seedTemp.seed
      selectedSeed.value = seedTemp.seed
      if (seedTemp.pythonEnvironments) {
        appData.pythonEnvironments = JSON.parse(JSON.stringify(seedTemp.pythonEnvironments))
      }

      // Also restore Github repos if they exist
      if (seedTemp.github?.repos?.length > 0) {
        appData.github.repos = [...seedTemp.github.repos]
      }

      // If original folderPath exists, restore it
      if (seedTemp.folderPath) {
        appData.folderPath = seedTemp.folderPath
      }
    } else if (seed) {
      // No saved data for this seed, or a new seed was provided
      // Start with template data and process the new seed
      Object.assign(appData, { ...appDataTemplate })

      console.log('seed', seed)
      // 设置来源为种子
      appData.from = 'seed'
      selectedSeed.value = seed
      appData.seedData = seed

      try {
        appData.folderPath = await window.electronAPI.getAppFolderPath(seed.name)
        // Save this to seedTemp for future use
        seedTemp.folderPath = appData.folderPath
      } catch (error) {
        console.error('Error getting app folder path:', error)
      }

      // 设置基本信息
      if (seed.name && !appData.name) {
        appData.name = seed.name
      }

      if (seed.description && !appData.description) {
        appData.description = seed.description
      }

      // 添加标签
      if (seed.tags && seed.tags.length > 0 && appData.tags.length === 0) {
        appData.tags = [...seed.tags]
      }

      // 设置Python环境信息
      if (seed.pytorch?.installCommands && seed.pytorch.installCommands.length > 0) {
        // Rest of existing seed processing code
        // ... existing code for system detection and command processing ...

        // 检测系统类型和GPU信息
        let systemInfo = {
          platform: 'unknown',
          gpu: 'unknown',
          hasNvidia: false,
          hasAMD: false,
          hasIntel: false
        }

        // 尝试从后端获取系统信息
        try {
          // 使用 window.electronAPI 获取系统信息
          if (window.electronAPI && window.electronAPI.getGpuOsInfo) {
            // 使用异步函数获取系统信息
            const info = await window.electronAPI.getGpuOsInfo()
            console.log('info', info)

            systemInfo = {
              platform: info.platform || 'unknown', // "win32", "darwin", "linux"
              gpu: info.gpuType || 'unknown',
              hasNvidia: info.hasNvidia || false,
              hasAMD: info.hasAMD || false,
              hasIntel: info.hasIntel || false
            }

            // 处理安装命令
            processInstallCommands(seed, systemInfo)
          } else {
            // 回退到浏览器检测
            fallbackSystemDetection(seed)
          }
        } catch (error) {
          console.error('获取系统信息失败:', error)
          // 回退到浏览器检测
          fallbackSystemDetection(seed)
        }
      }

      // Save the processed seed data to seedTemp for future use
      seedTemp.seed = seed
      seedTemp.name = appData.name
      seedTemp.description = appData.description
      seedTemp.tags = [...appData.tags]
      seedTemp.pythonEnvironments = JSON.parse(JSON.stringify(appData.pythonEnvironments))
      if (appData.github?.repos?.length > 0) {
        seedTemp.github = { repos: [...appData.github.repos] }
      }
    } else {
      // No seed provided and no saved seed data
      Object.assign(appData, { ...appDataTemplate })
      appData.from = 'seed'
    }

    // Set creation date if it's a new app
    if (!appData.createdAt) {
      appData.createdAt = new Date().toISOString()
    }

    console.log('appData', appData)
  }

  return {
    // 状态

    appData,
    errors,
    selectedSeed,
    githubTemp,
    seedTemp,
    folderTemp,
    // 方法
    selectSource,
    handleFolderConfirm,
    handleGithubConfirm,
    handleSeedConfirm,
    resetForm,
    loadExistingApp,
    addTag,
    removeTag,
    toggleTag,
    validateForm,
    setFolderPath,
    setAppData,
    setAppDataFromSeed,
    setAppDataFromGithub,
    setAppDataFromFolder,
    setAppByGithub,
    setAppByFolder
  }
})
