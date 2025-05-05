<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import SearchBar from '../components/appPage/SearchBar.vue'
import TagSelector from '../components/appPage/TagSelector.vue'
import AppList from '../components/appPage/AppList.vue'
import AppCreationFlow from '../components/appPage/AppCreationFlow.vue'
import AppInstallationModal from '../components/appPage/AppInstallationModal.vue'
import BackgroundInstallationIndicator from '../components/appPage/BackgroundInstallationIndicator.vue'
import { useAppCreateStore } from '../stores/appCreateStore'
import { useAppStore } from '../stores/app'

// 使用 appStore 集中管理应用数据
const appStore = useAppStore()
const appCreateStore = useAppCreateStore()

// 使用计算属性从 store 获取 apps 数据，保持响应式
const apps = computed(() => appStore.apps)
const isLoading = computed(() => appStore.isAppsLoading)
const isElectronAvailable = ref(!!window.electronAPI)
const isSaving = ref(false)

// Tag filtering - dynamically generated from apps data
const availableTags = ref(['All'])
const selectedTags = ref(['All'])

// Generate unique tags from apps
function generateAvailableTags() {
  console.log('apps 数据更新,需要重新生成 availableTags')
  // Start with 'All' tag
  const tags = new Set(['All'])

  // Extract all tags from all apps
  apps.value.forEach((app) => {
    if (Array.isArray(app.tags)) {
      app.tags.forEach((tag) => tags.add(tag))
    }
  })

  // Convert Set to array and sort alphabetically
  availableTags.value = Array.from(tags).sort((a, b) => {
    // Keep 'All' at the beginning
    if (a === 'All') return -1
    if (b === 'All') return 1
    return a.localeCompare(b)
  })
}

// 由于 apps 现在是计算属性，需要调整 watch 的写法
watch(() => apps.value, generateAvailableTags, { deep: true })

// 初始化应用数据
onMounted(async () => {
  try {
    // 直接使用 appStore 加载应用数据，避免重复的存储逻辑
    await appStore.loadApps()
  } catch (error) {
    console.error('Error initializing app data:', error)
    // Fallback to sample data if there was an error
    if (apps.value.length === 0) {
      console.log('Using sample data as fallback')
    }
  }
})

// Search functionality
const searchQuery = ref('')

// Compute tag counts for the apps
const tagCounts = computed(() => {
  const counts = {}

  // Initialize all available tags with count 0
  availableTags.value.forEach((tag) => {
    if (tag !== 'All') {
      counts[tag] = 0
    }
  })

  // Count apps for each tag
  apps.value.forEach((app) => {
    if (Array.isArray(app.tags)) {
      app.tags.forEach((tag) => {
        if (counts[tag] !== undefined) {
          counts[tag]++
        }
      })
    }
  })

  return counts
})

// Compute filtered apps for count display
const filteredApps = computed(() => {
  // First filter by search query
  let result = apps.value.filter(
    (app) =>
      app.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  )

  // Then filter by tags
  if (!selectedTags.value.includes('All')) {
    if (filterMode.value === 'any') {
      // Show apps that have ANY of the selected tags (OR logic)
      result = result.filter((app) => app.tags.some((tag) => selectedTags.value.includes(tag)))
    } else {
      // Show apps that have ALL of the selected tags (AND logic)
      result = result.filter((app) => selectedTags.value.every((tag) => app.tags.includes(tag)))
    }
  }

  return result
})

// Filtering mode - 'all' (AND logic) or 'any' (OR logic)
const filterMode = ref('all')

// Sorting
const sortBy = ref('name')
const sortDirection = ref('asc')

// Tag selection functions
const toggleTag = (tag) => {
  // Special handling for 'All' tag
  if (tag === 'All') {
    selectedTags.value = ['All']
    return
  }

  // If 'All' is currently selected and user selects another tag,
  // remove 'All' and add the new tag
  if (selectedTags.value.includes('All')) {
    selectedTags.value = [tag]
    return
  }

  // Toggle tag - if already selected, remove it
  if (selectedTags.value.includes(tag)) {
    selectedTags.value = selectedTags.value.filter((t) => t !== tag)
    // If all tags are deselected, select 'All' again
    if (selectedTags.value.length === 0) {
      selectedTags.value = ['All']
    }
  } else {
    // Add tag to selected tags
    selectedTags.value.push(tag)
  }
}

// Toggle filter mode
const toggleFilterMode = () => {
  filterMode.value = filterMode.value === 'any' ? 'all' : 'any'
}

// Reset all filters
const resetFilters = () => {
  searchQuery.value = ''
  selectedTags.value = ['All']
  filterMode.value = 'all'
}

// Add tag to filter from app card
const addTagToFilter = (tag, event) => {
  event.stopPropagation() // Prevent card expansion

  // If 'All' is currently selected, replace it with the clicked tag
  if (selectedTags.value.includes('All')) {
    selectedTags.value = [tag]
    return
  }

  // If tag is not already selected, add it to the filter
  if (!selectedTags.value.includes(tag)) {
    selectedTags.value.push(tag)
  }
}

// Sort options and functions
const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'createdAt', label: 'Creation Date' },
  { value: 'lastUsedAt', label: 'Last Used' }
]

const toggleSortDirection = () => {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
}

const getSortLabel = (option) => {
  if (sortBy.value === option.value) {
    return `${option.label} ${sortDirection.value === 'asc' ? '↑' : '↓'}`
  }
  return option.label
}

// New function to handle both selecting sort option and toggling direction
const handleSortClick = (option) => {
  // If clicking the same option that's already selected, toggle direction
  if (sortBy.value === option.value) {
    toggleSortDirection()
  } else {
    // If selecting a new option, set it as active and reset direction to ascending
    sortBy.value = option.value
    sortDirection.value = 'asc'
  }
}

// Configuration modal
const showConfigModal = ref(false)
const currentAppConfig = ref(null)
const configModalPosition = ref({ top: 0, left: 0, width: 0, height: 0 })

// Add a ref for the AppCreationFlow component
const appCreationFlowRef = ref(null)

// Function to open config modal
const openConfigModal = (app, event) => {
  // Store the current app to be configured
  currentAppConfig.value = { ...app }

  // Get the position of the clicked card for the animation
  const card = event.currentTarget.closest('.app-card')
  const rect = card.getBoundingClientRect()

  configModalPosition.value = {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height
  }

  // Show the modal
  showConfigModal.value = true

  // Prevent body scrolling when modal is open
  document.body.style.overflow = 'hidden'
}

// Function to close config modal
const closeConfigModal = () => {
  showConfigModal.value = false
  document.body.style.overflow = ''
}

// Function to save app configuration
const saveAppConfig = async (updatedApp) => {
  try {
    // Set saving state
    isSaving.value = true

    // 使用 appStore 统一处理应用的添加和更新操作
    if (apps.value.some((app) => app.id === updatedApp.id)) {
      await appStore.updateApp(updatedApp)
    } else {
      await appStore.addApp(updatedApp)
    }
  } catch (error) {
    console.error('Error saving app:', error)
    alert('Failed to save the app. Please try again.')
  } finally {
    isSaving.value = false
    closeConfigModal()
  }
}

// Function to simulate opening an app
const openApp = (app, event) => {
  // In a real application, this would launch or navigate to the app
  alert(`Opening ${app.name}...`)
}

// Functions for app actions
const deleteApp = async (app, event) => {
  if (confirm(`Are you sure you want to delete ${app.name}?`)) {
    try {
      // 使用 appStore 删除应用，简化本组件中的数据处理逻辑
      await appStore.deleteApp(app.id)
    } catch (error) {
      console.error('Error deleting app:', error)
      alert('Failed to delete the app. Please try again.')
    }
  }
}

const cloneApp = async (app, event) => {
  try {
    // Create a clean, serializable copy
    const sourceCopy = JSON.parse(JSON.stringify(app))

    // Validate tags to make sure they are valid
    let validTags = Array.isArray(sourceCopy.tags) ? sourceCopy.tags : []
    // Make sure there is at least one tag
    if (validTags.length === 0) {
      // Default tag based on available tags
      let defaultTag = 'Productivity'
      if (!availableTags.value.includes(defaultTag) && availableTags.value.length > 1) {
        defaultTag = availableTags.value[1] // First tag after 'All'
      }
      validTags = [defaultTag]
    }

    // Create a cloned app with a new ID
    const newApp = {
      ...sourceCopy,
      id: Date.now(), // Simple way to generate a unique ID
      name: `${sourceCopy.name} (Clone)`,
      createdAt: new Date().toISOString().split('T')[0],
      tags: validTags
    }

    // 使用 appStore 添加应用
    await appStore.addApp(newApp)
  } catch (error) {
    console.error('Error cloning app:', error)
    alert('Failed to clone the app. Please try again.')
  }
}

// New function to handle creating a new app
const openCreateAppModal = () => {
  console.log('openCreateAppModal')
  appCreateStore.resetForm()

  // Use the AppCreationFlow component
  if (appCreationFlowRef.value) {
    appCreationFlowRef.value.openAppCreation()
  }
}

// 处理应用创建
const handleAppCreated = async (newApp) => {
  try {
    console.log('handleAppCreated 被调用:', newApp.name, '事件时间:', new Date().toISOString())

    // 使用 appStore 添加应用，统一数据管理
    appStore.addApp(newApp).then((result) => {
      // 这里，或者在  node js 端更新 app 并返回
    })

    // 关闭配置模态窗口
    closeConfigModal()

    // 显示安装进程模态窗口
    openInstallationModal(newApp)
  } catch (error) {
    console.error('Error handling app creation:', error)
    alert('应用创建出错，请重试')
  }
}

// 安装过程相关状态
const showInstallationModal = ref(false)
const installationApp = ref(null)
const installationLogs = ref([])
const formattedLogs = ref([])
const installationProgress = ref(0)
const isInstallationRunning = ref(false)
const isBackgroundInstallation = ref(false)
const backgroundInstallations = ref([]) // 跟踪后台运行的安装

// 更新后台安装指示器
const updateBackgroundInstallations = () => {
  if (isBackgroundInstallation.value && isInstallationRunning.value && installationApp.value) {
    // 检查是否已经在列表中
    const exists = backgroundInstallations.value.some((app) => app.id === installationApp.value.id)
    if (!exists) {
      backgroundInstallations.value.push({
        id: installationApp.value.id,
        name: installationApp.value.name,
        progress: installationProgress.value
      })
    } else {
      // 更新已有的进度
      const index = backgroundInstallations.value.findIndex(
        (app) => app.id === installationApp.value.id
      )
      if (index !== -1) {
        backgroundInstallations.value[index].progress = installationProgress.value
      }
    }
  }
}

// 当进度更新时更新后台安装指示器
watch(installationProgress, updateBackgroundInstallations)

// 当安装完成时从后台列表移除
watch(isInstallationRunning, (running) => {
  if (!running && installationApp.value) {
    backgroundInstallations.value = backgroundInstallations.value.filter(
      (app) => app.id !== installationApp.value.id
    )
  }
})

// 打开安装进程模态窗口
const openInstallationModal = (app) => {
  installationApp.value = app

  // 初始化日志
  const initialLog = `开始安装应用: ${app.name}...`
  installationLogs.value = [initialLog]

  // 格式化日志以适配TerminalLogger组件
  formattedLogs.value = [
    {
      id: Date.now(),
      text: initialLog,
      type: 'info',
      timestamp: new Date(),
      progress: 0
    }
  ]

  installationProgress.value = 0
  isInstallationRunning.value = true
  isBackgroundInstallation.value = false
  showInstallationModal.value = true

  // 模拟开始安装进程
  startInstallation(app)
}

// 添加日志并格式化
const addInstallationLog = (text, type = 'info', progress = null) => {
  // 添加到原始日志
  installationLogs.value.push(text)

  // 添加到格式化日志
  formattedLogs.value.push({
    id: Date.now(),
    text,
    type: type || 'info',
    timestamp: new Date(),
    progress:
      progress !== null
        ? progress / 100
        : formattedLogs.value[formattedLogs.value.length - 1]?.progress || 0
  })

  // 更新进度
  if (progress !== null) {
    installationProgress.value = progress
  }
}

// 开始安装进程
const startInstallation = async (app) => {
  try {
    isInstallationRunning.value = true

    // 这里应该调用真实的安装API
    if (window.electronAPI && window.electronAPI.installApp) {
      // 真实环境下的安装逻辑
      const installerId = await window.electronAPI.installApp({
        appId: app.id,
        name: app.name,
        folderPath: app.folderPath,
        pythonEnvironments: app.pythonEnvironments || []
      })

      console.log('安装进程ID:', installerId)

      // 注册安装进度监听器
      if (window.electronAPI.onAppInstallProgress) {
        window.electronAPI.onAppInstallProgress((data) => {
          if (!isInstallationRunning.value) return

          // 添加日志
          if (data.message) {
            addInstallationLog(data.message, data.type, data.progress)
          }

          // 检查是否完成
          if (data.status === 'completed') {
            finishInstallation(true)
          } else if (data.status === 'error') {
            addInstallationLog(`❌ 安装失败: ${data.error || '未知错误'}`, 'error')
            isInstallationRunning.value = false
          }
        })
      }
    } else {
      // 模拟安装进程 (仅用于开发测试)
      simulateInstallation()
    }
  } catch (error) {
    console.error('启动安装进程失败:', error)
    addInstallationLog(`❌ 启动安装失败: ${error.message}`, 'error')
    isInstallationRunning.value = false
  }
}

// 模拟安装进程 (仅用于测试)
const simulateInstallation = () => {
  const steps = [
    { message: '正在初始化安装环境...', progress: 5 },
    { message: '检查Python环境...', progress: 10 },
    { message: '创建虚拟环境...', progress: 20 },
    { message: '安装基础依赖...', progress: 30 },
    { message: '安装PyTorch...', progress: 40 },
    { message: '下载应用代码...', progress: 60 },
    { message: '安装应用依赖...', progress: 70 },
    { message: '配置环境变量...', progress: 80 },
    { message: '验证安装...', progress: 90 },
    { message: '✅ 安装完成！', progress: 100 }
  ]

  let currentStep = 0
  const interval = setInterval(() => {
    if (currentStep < steps.length && isInstallationRunning.value) {
      const step = steps[currentStep]
      addInstallationLog(step.message, null, step.progress)
      currentStep++

      if (currentStep === steps.length) {
        clearInterval(interval)
        finishInstallation(true)
      }
    } else {
      clearInterval(interval)
    }
  }, 1500)
}

// 安装完成处理
const finishInstallation = (success) => {
  isInstallationRunning.value = false

  if (success) {
    addInstallationLog('✅ 应用安装成功！可以开始使用了。')
  }

  // 如果是后台安装，直接关闭模态框但不暂停安装
  if (isBackgroundInstallation.value) {
    closeInstallationModal()
  }
}

// 关闭安装进程模态窗口
const closeInstallationModal = () => {
  // 如果安装仍在进行，切换到后台模式
  if (isInstallationRunning.value) {
    isBackgroundInstallation.value = true
  }

  showInstallationModal.value = false
}

// 中止安装进程
const abortInstallation = () => {
  if (!isInstallationRunning.value) return

  if (confirm('警告：中止安装可能会导致应用不完整或无法使用。确定要中止安装吗？')) {
    isInstallationRunning.value = false
    addInstallationLog('⚠️ 安装已被用户中止', 'warning')

    // 调用实际的中止API
    if (window.electronAPI && window.electronAPI.abortAppInstallation && installationApp.value) {
      window.electronAPI
        .abortAppInstallation(installationApp.value.id)
        .then(() => {
          console.log('安装进程已中止')
        })
        .catch((error) => {
          console.error('中止安装失败:', error)
        })
    }
  }
}

// 显示后台安装状态
const showBackgroundInstallations = () => {
  // 如果有正在后台安装的应用，显示安装模态框
  if (backgroundInstallations.value.length > 0) {
    // 找到第一个后台安装的应用
    const firstBackgroundApp = backgroundInstallations.value[0]

    // 在应用列表中找到完整的应用信息
    const appInfo = apps.value.find((app) => app.id === firstBackgroundApp.id)

    if (appInfo) {
      // 重新打开安装模态框
      isBackgroundInstallation.value = false
      showInstallationModal.value = true

      // 无需重新启动安装，因为它已经在运行
    }
  }
}

// 处理后台安装
const handleBackgroundInstallation = () => {
  // 设置后台安装标志
  isBackgroundInstallation.value = true
  // 关闭模态框但不停止安装
  closeInstallationModal()
}
</script>

<template>
  <div class="app-list-page">
    <div class="main-container">
      <!-- Left Sidebar for Tags and Search -->
      <div class="sidebar">
        <!-- Search Bar Component -->
        <SearchBar v-model:searchQuery="searchQuery" />

        <!-- Tag Selector Component -->
        <TagSelector
          :availableTags="availableTags"
          :selectedTags="selectedTags"
          :tagCounts="tagCounts"
          :filterMode="filterMode"
          @toggle-tag="toggleTag"
          @toggle-filter-mode="toggleFilterMode"
          @reset-filters="resetFilters"
        />
      </div>

      <!-- Main Content Area for Apps -->
      <div class="content-area">
        <div class="content-header">
          <!-- Results count summary -->
          <div class="results-count">
            <strong>{{ filteredApps.length }}</strong>
            {{ filteredApps.length === 1 ? 'app' : 'apps' }} found

            <span v-if="searchQuery" class="filter-pill">
              "{{ searchQuery }}"
              <button @click="searchQuery = ''" class="clear-filter">×</button>
            </span>
          </div>

          <!-- Add Create App Button -->
          <div class="create-app-button">
            <button @click="openCreateAppModal" class="add-app-btn" :disabled="isSaving">
              <span v-if="isSaving" class="loading-dot-container">
                <span class="loading-dot"></span>
                <span class="loading-dot"></span>
                <span class="loading-dot"></span>
              </span>
              <span v-else> <span class="plus-icon">+</span> Create App </span>
            </button>
          </div>

          <!-- Sort Controls -->
          <div class="sort-controls">
            <div class="sort-options">
              <button
                v-for="option in sortOptions"
                :key="option.value"
                :class="['sort-option-btn', { active: sortBy === option.value }]"
                @click="handleSortClick(option)"
                :title="`Sort by ${option.label}`"
              >
                {{ getSortLabel(option) }}
              </button>
            </div>
          </div>
        </div>

        <!-- Loading indicator -->
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading apps...</p>
        </div>

        <!-- Warning for missing Electron APIs -->
        <div v-else-if="!isElectronAvailable" class="electron-warning">
          <p>
            <strong>Note:</strong> Running in browser mode. Data will not be persisted between
            sessions.
          </p>
        </div>

        <!-- App List Component -->
        <AppList
          v-else
          :apps="apps"
          :searchQuery="searchQuery"
          :selectedTags="selectedTags"
          :filterMode="filterMode"
          :sortBy="sortBy"
          :sortDirection="sortDirection"
          @open-app="openApp"
          @open-config="openConfigModal"
          @delete-app="deleteApp"
          @clone-app="cloneApp"
          @add-tag-to-filter="addTagToFilter"
        />
      </div>
    </div>

    <!-- Configuration Modal -->
    <Teleport to="body">
      <AppCreationFlow
        ref="appCreationFlowRef"
        :existing-app="currentAppConfig"
        :is-editing="!!currentAppConfig"
        @close="closeConfigModal"
        @create="handleAppCreated"
        @update="handleAppUpdated"
      />
    </Teleport>

    <!-- Installation Modal (使用新组件) -->
    <AppInstallationModal
      :isVisible="showInstallationModal"
      :app="installationApp"
      :isInstalling="isInstallationRunning"
      :isBackgroundInstallation="isBackgroundInstallation"
      :progress="installationProgress"
      :logs="formattedLogs"
      @close="closeInstallationModal"
      @abort="abortInstallation"
      @background="handleBackgroundInstallation"
    />

    <!-- 后台安装指示器 (使用新组件) -->
    <BackgroundInstallationIndicator
      :installations="backgroundInstallations"
      @click="showBackgroundInstallations"
    />
  </div>
</template>

<style scoped>
.app-list-page {
  /* min-height: 100vh; */
  height: 100%;
  background-color: var(--background-color);
}

.page-header {
  text-align: center;
  padding: 1.5rem 0;
}

.page-header h1 {
  margin: 0;
  font-size: 2.5rem;
  color: var(--primary-color);
  font-weight: 700;
}

/* New layout styles for the two-column design */
.main-container {
  height: 100%;
  display: flex;
  /* max-width: 1400px;
  margin: 0 auto; */
  /* padding: 0 1rem 3rem; */
  padding: 10px 5px 10px 10px;
  gap: 5px;
}

/* Sidebar styles */
.sidebar {
  display: flex;
  flex-direction: column;
  width: 260px;
  flex-shrink: 0;
  position: sticky;
  top: 1rem;
  height: calc(100vh - 4rem);
  overflow-y: auto;
  /* Add a subtle scrollbar */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
  /* Add subtle shadow and border */
  /* padding: 0 0.75rem 1rem 0; */
}

.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

/* Main content area */
.content-area {
  margin: 10px 0 10px 10px;
  flex: 1;
  min-width: 320px; /* Important for flex items with overflow */
  display: flex;
  flex-direction: column;
}

/* Content header with results count and sort controls */
.content-header {
  padding-right: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.results-count {
  font-size: 1rem;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filter-pill {
  background-color: rgba(76, 110, 245, 0.1);
  color: var(--primary-color);
  padding: 0.3rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.clear-filter {
  border: none;
  background: none;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  color: var(--primary-color);
  opacity: 0.7;
}

.clear-filter:hover {
  opacity: 1;
}

/* Sort controls styling */
.sort-controls {
  margin-bottom: 0;
}

.sort-options {
  display: flex;
  gap: 0.3rem;
  align-items: center;
  flex-wrap: wrap;
}

.sort-option-btn {
  color: var(--text-color);
  padding: 0.5rem 0.7rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background-color: white;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-width: 80px;
  text-align: center;
}

.sort-option-btn:hover {
  background-color: #f8fafc;
  border-color: #cbd5e1;
}

.sort-option-btn.active {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  font-weight: 500;
}

/* Modal transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Responsive styles */
/* @media (max-width: 900px) {
  .main-container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
    padding-right: 0;
    margin-bottom: 1.5rem;
  }

  .content-header {
    flex-direction: column;
    align-items: flex-start;
  } */
/* } */

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 2rem;
  }
}

/* Create App Button Styles */
.create-app-button {
  display: flex;
  justify-content: center;
  align-items: center;
}

.add-app-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.1s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.add-app-btn:hover {
  background-color: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}

.add-app-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
}

.plus-icon {
  font-size: 1.1rem;
  margin-right: 0.4rem;
  line-height: 1;
}

/* Adjust content header layout for new button */
.content-header {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
}

/* CSS styles for the loading indicator */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--color-text-light);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(76, 110, 245, 0.2);
  border-radius: 50%;
  border-top-color: var(--color-primary);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

/* Warning message for non-Electron environment */
.electron-warning {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Loading dots animation for buttons */
.loading-dot-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.loading-dot {
  width: 6px;
  height: 6px;
  background-color: currentColor;
  border-radius: 50%;
  display: inline-block;
  animation: loading-dot 1.4s infinite ease-in-out both;
}

.loading-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes loading-dot {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.add-app-btn:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
