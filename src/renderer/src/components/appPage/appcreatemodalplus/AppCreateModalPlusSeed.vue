<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h2>{{ store.appData.id ? '编辑应用' : '创建新应用' }}</h2>
        <div class="header-actions">
          <!-- <button
            class="seed-button"
            @click.stop="toggleSeedList"
            title="显示种子列表"
          >
            <span class="seed-icon">🌱</span>
          </button> -->
          <button class="close-button" @click="closeModal">×</button>
        </div>
      </div>

      <div class="modal-body">
        <!-- Step sidebar -->
        <StepsSidebar
          :currentStep="currentStep"
          :canCreateApp="canCreateApp"
          :isCreating="isCreating"
          @step-change="scrollToStep"
          @reset="resetForm"
          @create="createApp"
        />

        <!-- Seed List -->
        <SeedList
          :show="showSeedList"
          @close="showSeedList = false"
          @select="handleSeedSelected"
          @import="handleSeedImport"
        />

        <!-- Step content -->
        <div class="content-container" ref="contentContainer" @scroll="handleScroll">
          <div class="step-content">
            <!-- Step 1: Basic Info -->
            <BasicInfoStep
              ref="step0"
              :isActive="currentStep === 0"
              @browse-directory="browseDirectory"
            />

            <!-- Step 2: GitHub Setup -->
            <!-- <GitHubSetupStep ref="step1" :isActive="currentStep === 1" /> -->

            <!-- Step 3: Directory Setup -->
            <DirectorySetupStep
              ref="step1"
              :isActive="currentStep === 2"
              @browse-directory="browseDirectory"
            />

            <!-- Step 4: Python Environment -->
            <PythonEnvironmentStep
              ref="step2"
              :isActive="currentStep === 3"
              @install-environment="installEnvironment"
              @go-to-settings="goToSettings"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useAppCreateStore } from '../../../stores/appCreateStore'
import { useSettingsStore } from '../../../stores/settings'
import formatData from '../../../services/formatData'
import electronStore from '../../../services/electronStore'
import SeedList from '../SeedList.vue'
console.log('formatData:', formatData)
console.log('AppCreateModalPlusSeed Show')
const {
  getFastestPipMirrorUrl,
  formatPipUrl,
  formatPytorchUrl,
  getFastestPytorchMirrorUrl,
  getSourceUrl
} = formatData

// Import components
import BasicInfoStep from './BasicInfoStep.vue'
import GitHubSetupStep from './GitHubSetupStep.vue'
import DirectorySetupStep from './DirectorySetupStep.vue'
import PythonEnvironmentStep from './PythonEnvironmentStepPlus.vue'
import StepsSidebar from './StepsSidebar.vue'

// Get the stores
const store = useAppCreateStore()
const settingsStore = useSettingsStore()

// Define props
const props = defineProps({
  existingApp: {
    type: Object,
    default: null
  },
  isEditing: {
    type: Boolean,
    default: false
  }
})

// Emit events
const emit = defineEmits(['close', 'create', 'update', 'openSettings'])

// Current step
const currentStep = ref(0)

// SeedList state
const showSeedList = ref(false)

// References for step components
const step0 = ref(null)
const step1 = ref(null)
const step2 = ref(null)
const step3 = ref(null)
const contentContainer = ref(null)

// Creation state
const isCreating = ref(false)

// Computed property to determine if the app can be created
const canCreateApp = computed(() => {
  // 基本验证：应用名称不能为空且默认环境的启动命令不能为空
  return (
    store.appData.name.trim().length > 0 &&
    store.appData.pythonEnvironments[0]?.startCommand.trim().length > 0
  )
})

// Function to close the modal
function closeModal() {
  emit('close')
}

// Toggle the seed list sidebar
function toggleSeedList() {
  showSeedList.value = !showSeedList.value
}

// Handle when a seed is selected in the SeedList component
function handleSeedSelected(seed) {
  console.log('Selected seed:', seed)
}

// Handle when a seed is imported from the SeedList
function handleSeedImport(seed) {
  console.log('Importing seed:', seed)
  showSeedList.value = false

  try {
    // Update the selected seed in BasicInfoStep
    if (step0.value && typeof step0.value.setSelectedSeed === 'function') {
      step0.value.setSelectedSeed(seed)
    }

    // Process seed data using the store
    const formattedSeed = {
      name: seed.name || '',
      description: seed.description || '',
      tags: seed.tags || [],
      config: {
        pythonVersion: seed.python || '3.10',
        installCommands: formatInstallCommands(seed.pip),
        startCommand: formatStartCommand(seed.launch_command),
        modelDir: seed.modelsFolder || '',
        outputDir: seed.outputFolder || ''
      },
      rawData: seed
    }

    // Let the store handle the seed import data
    store.handleSeedConfirm({ seed: formattedSeed })

    // 自动进入下一步
    if (currentStep.value === 0 && store.appData.name) {
      nextTick(() => {
        nextStep()
      })
    }
  } catch (error) {
    console.error('导入种子数据时出错:', error)
    alert(`导入种子模板失败: ${error.message}`)
  }
}

// Format installation commands
function formatInstallCommands(pipCommands) {
  if (!pipCommands) return ['pip install -r requirements.txt']

  if (!Array.isArray(pipCommands)) {
    return [String(pipCommands)]
  }

  // 处理多种格式的pip命令
  const commands = []
  pipCommands.forEach((cmd) => {
    if (typeof cmd === 'string') {
      commands.push(cmd)
    } else if (typeof cmd === 'object') {
      // 取第一个命令
      const firstCommand = Object.values(cmd)[0]
      if (firstCommand && typeof firstCommand === 'string') {
        commands.push(firstCommand)
      }
    }
  })

  return commands.length ? commands : ['pip install -r requirements.txt']
}

// Format start command
function formatStartCommand(launchCommand) {
  if (!launchCommand) return 'python main.py'

  if (typeof launchCommand === 'string') {
    return launchCommand
  }

  if (Array.isArray(launchCommand)) {
    return launchCommand.join(' ')
  }

  return 'python main.py'
}

// Scroll variables
let scrollTimeout = null
let isScrolling = false

// Scroll to a specific step
function scrollToStep(index) {
  if (!contentContainer.value) return

  // Disable scroll handler to prevent triggering handleScroll
  isScrolling = true

  // Get references to all steps
  const stepRefs = [step0.value, step1.value, step2.value, step3.value]
  const targetStep = stepRefs[index]?.stepRef

  if (targetStep) {
    // Scroll to target position
    contentContainer.value.scrollTo({
      top: targetStep.offsetTop - 20, // Slight offset for better visual effect
      behavior: 'smooth'
    })

    // Set current step
    currentStep.value = index

    // Re-enable scroll handler after a delay
    clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(() => {
      isScrolling = false
    }, 500)
  }
}

// Handle scroll event
function handleScroll() {
  if (isScrolling || !contentContainer.value) return

  // Add throttling to avoid excessive calculations
  clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    // Get DOM positions of each step
    const stepRefs = [step0.value, step1.value, step2.value, step3.value]
    const container = contentContainer.value
    const scrollTop = container.scrollTop
    const containerHeight = container.clientHeight

    // Determine which step is closest to viewport center
    let closestStep = 0
    let minDistance = Infinity

    stepRefs.forEach((step, index) => {
      if (!step || !step.stepRef) return

      const stepRef = step.stepRef
      const stepTop = stepRef.offsetTop
      const stepHeight = stepRef.clientHeight
      const stepCenter = stepTop + stepHeight / 2
      const viewportCenter = scrollTop + containerHeight / 2
      const distance = Math.abs(stepCenter - viewportCenter)

      if (distance < minDistance) {
        minDistance = distance
        closestStep = index
      }
    })

    // Update current step
    if (currentStep.value !== closestStep) {
      currentStep.value = closestStep
    }
  }, 100)
}

// Directory browsing
async function browseDirectory(directory) {
  try {
    // 使用 Electron API 打开目录选择对话框
    if (window.electronAPI && window.electronAPI.showOpenDialog) {
      // 设置对话框标题
      let title = '选择目录'
      if (directory === 'workingDir') title = '选择工作目录'
      else if (directory === 'modelDir') title = '选择模型目录'
      else if (directory === 'modelCacheDir') title = '选择模型缓存目录'
      else if (directory === 'outputDir') title = '选择输出目录'

      // 调用 electron 的文件夹选择对话框
      const result = await window.electronAPI.showOpenDialog({
        title: title,
        defaultPath: store.appData[directory] || '',
        properties: ['openDirectory']
      })

      // 如果用户选择了目录
      if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
        const selectedPath = result.filePaths[0]
        store.appData[directory] = selectedPath

        // If it's the working directory, update the folderPath in the store
        if (directory === 'workingDir') {
          store.setFolderPath(selectedPath)
        }

        console.log(`已选择${directory}:`, selectedPath)
        return selectedPath
      }
    } else if (window.electronAPI && window.electronAPI.selectDirectory) {
      // 尝试使用备用方法
      const result = await window.electronAPI.selectDirectory()
      if (result && !result.canceled && result.filePath) {
        store.appData[directory] = result.filePath

        // If it's the working directory, update the folderPath in the store
        if (directory === 'workingDir') {
          store.setFolderPath(result.filePath)
        }

        console.log(`已选择${directory}:`, result.filePath)
        return result.filePath
      }
    } else {
      // 如果没有可用的 electronAPI，显示一个警告
      console.warn('目录选择功能需要 Electron 环境')
    }
  } catch (err) {
    console.error(`选择${directory}失败:`, err)
  }
  return null
}

// Install environment function
async function installEnvironment(index) {
  if (!window.electronAPI) {
    alert('安装环境需要使用Electron API，但当前环境不支持。')
    return
  }

  const env = store.appData.pythonEnvironments[index]

  // 设置安装状态
  env.isInstalling = true
  env.installProgress = 0
  env.installLogs = []
  env.installError = ''
  env.needConfigAppSpace = false

  try {
    console.log(`开始安装Python ${env.pythonVersion}环境...`)

    // 创建安装进度监听器
    const removeListener = window.electronAPI.onPythonInstallProgress((data) => {
      console.log('安装进度更新:', data)

      // 更新安装日志
      if (data.message) {
        env.installLogs.push(data.message)
      }

      // 更新进度
      if (data.status === 'progress' && typeof data.progress === 'number') {
        env.installProgress = data.progress
      }

      // 安装完成
      if (data.status === 'progress' && data.progress === 100) {
        env.isInstalled = true
        env.isInstalling = false
      }

      // 安装失败
      if (data.status === 'error') {
        env.isInstalling = false
        env.installError = data.message
      }
    })

    let pipMirrorUrl = ''
    if (env.pip.source) {
      // 获取pip镜像 URL
      pipMirrorUrl = getSourceUrl(env.pip.source, 'pip')
    } else {
      pipMirrorUrl = await getFastestPipMirrorUrl()
    }

    let pytorchMirrorUrl = ''
    if (env.pytorch.source) {
      pytorchMirrorUrl = getSourceUrl(env.pytorch.source, 'pytorch')
    } else {
      pytorchMirrorUrl = await getFastestPytorchMirrorUrl()
    }
    // console.log("pytorchMirrorUrl:", pytorchMirrorUrl, pipMirrorUrl);
    let pytorchCommands = []
    if (env.pytorch?.installCommands && env.pytorch?.installCommands.length > 0) {
      pytorchCommands = env.pytorch.installCommands.map((cmd) =>
        formatPytorchUrl(cmd, pytorchMirrorUrl, pipMirrorUrl)
      )
    }

    let pipCommands = []
    if (env.pip?.installCommands && env.pip?.installCommands.length > 0) {
      pipCommands = env.pip.installCommands.map((cmd) => formatPipUrl(cmd, pipMirrorUrl))
    }

    // console.log("pipCommands:", pipCommands);
    // console.log("pytorchCommands:", pytorchCommands);
    // 获取GitHub镜像 URL
    // const githubMirrorUrl = getSourceUrl(env.github.source, "github");

    // const pytorchMirrorUrl = getSourceUrl(env.pytorch.source, "pytorch");
    // 调用安装API
    const result = await window.electronAPI.installPythonEnvironment({
      version: env.pythonVersion,
      appPath: store.appData.folderPath || '',
      pytorchCommands: pytorchCommands,
      pipCommands: pipCommands
    })

    console.log('安装结果:', result)

    if (result.success) {
      env.isInstalled = true
      env.pythonPath = result.pythonPath
      env.installLogs.push('✅ 安装成功！')
    } else {
      // 检查是否是AppSpace配置问题
      if (result.needConfig) {
        env.needConfigAppSpace = true
        env.installError = result.error
        env.installLogs.push('⚠️ ' + result.error)
        env.installLogs.push('请前往设置页面配置AppSpace目录后再试。')
      } else {
        env.installError = result.error || '安装失败'
        env.installLogs.push('❌ ' + (result.error || '安装失败'))
      }
    }
  } catch (error) {
    console.error('安装过程出错:', error)
    env.installError = error.message || '安装过程出错'
    env.installLogs.push('❌ ' + (error.message || '安装过程出错'))
  } finally {
    env.isInstalling = false
  }
}

// Reset form function
function resetForm() {
  if (confirm('确定要重置表单吗？此操作将清空所有已填写的信息。')) {
    store.resetForm()
  }
}

// Function to get GitHub mirror URL based on type
function getGithubMirrorUrl() {
  if (!store.appData.github.useMirror) return null

  switch (store.appData.github.mirrorType) {
    case 'global':
      // Get from the settings store
      return settingsStore.githubMirrorUrl || null
    case 'default':
      return 'https://ghproxy.com/'
    case 'custom':
      return store.appData.github.customMirrorUrl || null
    default:
      return null
  }
}

// Function to get pip mirror URL based on type
function getPipMirrorUrl(env) {
  switch (env.pipMirrorType) {
    case 'default':
      return 'https://pypi.org/simple'
    case 'tsinghua':
      return 'https://pypi.tuna.tsinghua.edu.cn/simple'
    case 'aliyun':
      return 'https://mirrors.aliyun.com/pypi/simple/'
    case 'tencent':
      return 'https://mirrors.cloud.tencent.com/pypi/simple'
    case 'huawei':
      return 'https://repo.huaweicloud.com/repository/pypi/simple'
    case 'custom':
      return env.customPipMirrorUrl || null
    default:
      return 'https://pypi.org/simple'
  }
}

// Create app function
async function createApp() {
  if (!canCreateApp.value) {
    console.warn('Cannot create app: validation failed', {
      name: store.appData.name,
      startCommand: store.appData.pythonEnvironments[0]?.startCommand
    })
    return
  }

  try {
    isCreating.value = true
    console.log('Starting app creation process')

    // Validate all required fields
    if (!store.validateForm()) {
      isCreating.value = false
      return
    }

    // 处理环境数据
    const pythonEnvironments = store.appData.pythonEnvironments.map((env) => ({
      pythonVersion: env.pythonVersion,
      pytorch: {
        source: env.pytorch.source ? env.pytorch.source : 'official',
        installCommands: [...env.pytorch.installCommands]
      },
      pip: {
        source: env.pip.source ? env.pip.source : 'official',
        installCommands: [...env.pytorch.installCommands]
      },
      startCommand: env.startCommand,
      isInstalled: env.isInstalled || false,
      isDefault: env.isDefault || false
    }))

    // 确保至少有一个默认环境
    if (!pythonEnvironments.some((env) => env.isDefault)) {
      pythonEnvironments[0].isDefault = true
    }

    // Prepare app data - fit for existing apps.json format
    const newApp = {
      id: props.isEditing ? store.appData.id : Date.now(),
      name: store.appData.name,
      description: store.appData.description || '',
      tags: store.appData.tags.length ? store.appData.tags : [],
      createdAt: props.isEditing ? store.appData.createdAt : new Date().toISOString().split('T')[0],
      lastUsedAt: props.isEditing
        ? store.appData.lastUsedAt
        : new Date().toISOString().split('T')[0],
      icon: '💡',
      folderPath: store.appData.folderPath || '', // can be set later
      // 添加GitHub相关信息
      github: {
        repos: store.appData.github.repos || []
      },
      modelDir: store.appData.modelDir || '',
      outputDir: store.appData.outputDir || '',
      seedData: store.appData.seedData || '',
      // These are extra fields that will be saved but won't affect display
      pythonEnvironments: store.appData.pythonEnvironments // 保存为环境数组
    }

    // If editing mode and API key is masked, preserve the original key
    // if (
    //   props.isEditing &&
    //   store.appData.apiKey === "********" &&
    //   props.existingApp.modelInfo?.apiKey
    // ) {
    //   newApp.modelInfo.apiKey = props.existingApp.modelInfo.apiKey;
    // } else if (store.appData.apiKey && store.appData.apiKey !== "********") {
    //   newApp.modelInfo.apiKey = store.appData.apiKey;
    // }

    // Use electronStore service to save app
    if (props.isEditing) {
      // Update existing app
      const updateResult = await electronStore.updateApp(newApp)
      console.log('应用更新结果:', updateResult, '应用名称:', newApp.name)
    } else {
      // Add new app
      console.log('Starting app creation process')
      console.log('应用创建结果:', newApp, '应用名称:', newApp.name)

      // 避免重复操作，移除直接调用 electronStore
      // 现在改为只发送事件，由父组件处理数据存储，防止重复操作
      // const addResult = await electronStore.addApp(newApp);
      // console.log("应用创建结果:", addResult, "应用名称:", newApp.name);
    }

    // Emit the created/updated app
    if (props.isEditing) {
      emit('update', newApp)
    } else {
      // 只发送一次创建事件
      console.log('发送创建事件:', newApp.name, new Date().toISOString())
      emit('create', newApp)
    }

    // Close the modal
    closeModal()
  } catch (error) {
    console.error('Error creating/updating app:', error)
    alert('操作失败，请重试')
  } finally {
    isCreating.value = false
  }
}

// Go to settings page
function goToSettings() {
  closeModal()
  emit('openSettings')
}

// Navigation methods
function nextStep() {
  if (!store.validateForm()) {
    return
  }

  if (currentStep.value < 3) {
    currentStep.value++
  }
}

// Component onMounted
onMounted(() => {
  // Initialize scroll position
  nextTick(() => {
    if (contentContainer.value && step0.value?.stepRef) {
      contentContainer.value.scrollTop = 0
    }
  })

  // Load existing app data if in edit mode
  if (props.isEditing && props.existingApp) {
    store.loadExistingApp(props.existingApp)
  }

  // Set up GitHub installation progress listener
  if (window.electronAPI && window.electronAPI.onGithubInstallProgress) {
    window.electronAPI.onGithubInstallProgress((data) => {
      console.log('GitHub 安装进度:', data)

      // Only process messages if we're in the process of creating an app
      if (isCreating.value) {
        // Add to the GitHub installation logs in the store
        if (!store.appData.githubInstallLogs) {
          store.appData.githubInstallLogs = []
        }

        if (data.message) {
          store.appData.githubInstallLogs.push(data.message)
        }

        // Update installation status based on the message type
        if (data.status === 'progress') {
          store.appData.githubInstallStatus = 'progress'
        } else if (data.status === 'error') {
          store.appData.githubInstallStatus = 'error'
          store.appData.githubInstallError = data.message
        } else if (data.status === 'success') {
          store.appData.githubInstallStatus = 'success'
        }
      }
    })
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-container {
  background-color: var(--color-card);
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  width: 850px;
  max-width: 95vw;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modal-appear 0.3s ease-out;
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 6px;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-card);
}

.modal-header h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  color: var(--color-text-strong);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.seed-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  background-color: #e7f5e8;
  border: 1px solid #c8e6c9;
  color: #4caf50;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 12px;
}

.seed-button:hover {
  background-color: #d4ead6;
}

.seed-icon {
  font-size: 20px;
  line-height: 1;
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--color-text-light);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
}

.close-button:hover {
  background-color: var(--color-hover);
}

.modal-body {
  display: flex;
  flex: 1;
  height: 600px;
  overflow: hidden;
  position: relative;
}

/* Content container */
.content-container {
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
  scroll-padding-top: 20px;
  height: 600px;
  padding: 0 30px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
}

.step-content {
  padding-top: 20px;
  padding-bottom: 30px;
}
</style>
