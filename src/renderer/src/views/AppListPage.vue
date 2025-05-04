<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import SearchBar from '../components/appPage/SearchBar.vue'
import TagSelector from '../components/appPage/TagSelector.vue'
import AppList from '../components/appPage/AppList.vue'
import ConfigModal from '../components/appPage/AppCreateModal.vue'
import electronStore from '../services/electronStore'
import { useAppCreateStore } from '../stores/appCreateStore'
import { useAppStore } from '../stores/app'
// Apps data - will be loaded from storage
const apps = ref([])
const isLoading = ref(true)
const isElectronAvailable = ref(!!window.electronAPI)
const isSaving = ref(false)
const appCreateStore = useAppCreateStore()

// Tag filtering - dynamically generated from apps data
const availableTags = ref(['All'])
const selectedTags = ref(['All'])

// Generate unique tags from apps
function generateAvailableTags() {
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

// Update tags whenever apps are loaded or modified
watch(apps, generateAvailableTags, { deep: true })

// Load apps from storage
async function loadApps() {
  try {
    // Initialize the data storage first
    await electronStore.initializeStorage()

    // Get apps from storage
    const storedApps = await electronStore.getApps()
    apps.value = storedApps
    console.log('apps', apps.value)
    // Generate available tags from loaded apps
    generateAvailableTags()
  } catch (error) {
    console.error('Error loading apps:', error)
    throw error // rethrow to allow the caller to handle it
  }
}

// Initialize storage and load apps
onMounted(async () => {
  try {
    // Initialize data storage & load apps
    isLoading.value = true

    // Try to load apps - this will fall back to memory storage if Electron APIs aren't available
    await loadApps()
  } catch (error) {
    console.error('Error initializing app data:', error)

    // Fallback to sample data if there was an error
    if (apps.value.length === 0) {
      console.log('Using sample data as fallback')
    }
  } finally {
    isLoading.value = false
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

    // Create a clean, serializable copy of the app object
    // This removes any Vue reactivity or circular references
    const cleanApp = JSON.parse(JSON.stringify(updatedApp))

    // Check if this is a new app (doesn't exist in the apps array)
    const index = apps.value.findIndex((app) => app.id === cleanApp.id)

    if (index === -1) {
      // This is a new app, add it to the array
      apps.value.push(cleanApp)
      // Add the app to storage
      await electronStore.addApp(cleanApp)
    } else {
      // This is an existing app, update it
      apps.value[index] = cleanApp
      // Update the app in storage
      await electronStore.updateApp(cleanApp)
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
      // Get the app ID as a simple value
      const appId = app.id

      // Remove from local array
      apps.value = apps.value.filter((a) => a.id !== appId)
      // Remove from storage
      await electronStore.deleteApp(appId)
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

    // Add to local array
    apps.value.push(newApp)
    // Add to storage
    await electronStore.addApp(newApp)
  } catch (error) {
    console.error('Error cloning app:', error)
    alert('Failed to clone the app. Please try again.')
  }
}

// New function to handle creating a new app
const openCreateAppModal = () => {
  console.log('openCreateAppModal')
  // Default tag based on available tags (use Productivity if exists, else first non-All tag)
  // let defaultTag = "Productivity";
  // if (
  //   !availableTags.value.includes(defaultTag) &&
  //   availableTags.value.length > 1
  // ) {
  //   defaultTag = availableTags.value[1]; // First tag after 'All'
  // }

  // Create a template for a new app using only serializable data
  // currentAppConfig.value = {
  //   id: Date.now(), // Simple way to generate a unique ID
  //   name: "New App",
  //   tags: [defaultTag],
  //   description: "Enter description here",
  //   createdAt: new Date().toISOString().split("T")[0],
  //   lastUsedAt: new Date().toISOString().split("T")[0],
  //   icon: "💡",
  //   filePath: "",
  //   status: "setup",
  //   setupProgress: 25,
  // };
  appCreateStore.resetForm()
  // Set the modal position to center of viewport
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  configModalPosition.value = {
    top: viewportHeight / 2 - 300,
    left: viewportWidth / 2 - 400,
    width: 800,
    height: 600
  }

  // Show the modal
  showConfigModal.value = true

  // Prevent body scrolling when modal is open
  document.body.style.overflow = 'hidden'
}

// 处理应用创建事件
const handleAppCreated = async (newApp) => {
  try {
    console.log('Handling app creation:', newApp)
    apps.value.push(newApp)
    await electronStore.addApp(newApp)
    // 创建应用 - 使用JSON序列化来创建一个纯数据对象，移除可能的响应式包装和不可序列化的属性
    const serializedApp = JSON.parse(JSON.stringify(newApp))
    // window.electronAPI
    //   .createApp(serializedApp)
    //   .then(async (result) => {
    //     console.log('createApp result', result)
    //     if (result.success) {
    //       // 查找应用在数组中的索引
    //       const appIndex = apps.value.findIndex((app) => app.id === newApp.id)
    //       console.log(appIndex)
    //       if (appIndex !== -1) {
    //         // 更新Python环境信息 - 保留原有数据结构并更新必要参数
    //         const existingApp = apps.value[appIndex]
    //         const updatedPythonEnvironments = existingApp.pythonEnvironments || []

    //         // 将result中的Python环境信息合并到现有环境中
    //         if (result.pythonEnvironments && result.pythonEnvironments.length > 0) {
    //           result.pythonEnvironments.forEach((resultEnv) => {
    //             // 查找对应版本的环境
    //             const existingEnvIndex = updatedPythonEnvironments.findIndex(
    //               (env) => env.pythonVersion === resultEnv.pythonVersion
    //             )

    //             if (existingEnvIndex !== -1) {
    //               // 更新现有环境
    //               updatedPythonEnvironments[existingEnvIndex] = {
    //                 ...updatedPythonEnvironments[existingEnvIndex],
    //                 isInstalled: resultEnv.isInstalled,
    //                 pythonPath:
    //                   resultEnv.pythonPath || updatedPythonEnvironments[existingEnvIndex].pythonPath
    //               }
    //             } else {
    //               // 添加新环境
    //               updatedPythonEnvironments.push(resultEnv)
    //             }
    //           })
    //         }

    //         // 更新应用信息 - 直接在原位置更新
    //         apps.value[appIndex] = {
    //           ...existingApp,
    //           pythonEnvironments: updatedPythonEnvironments,
    //           folderPath: result.appPath || existingApp.folderPath
    //         }

    //         // 更新存储
    //         await electronStore.updateApp(apps.value[appIndex])
    //       } else {
    //         // 如果应用不在列表中（新创建的应用），则添加到列表
    //         const appToAdd = {
    //           ...newApp,
    //           pythonEnvironments: result.pythonEnvironments || [],
    //           folderPath: result.appPath || newApp.folderPath
    //         }

    //         console.log('Adding new app to list:', appToAdd)

    //         // 添加到应用列表
    //         apps.value.push(appToAdd)

    //         // 添加到存储
    //         await electronStore.addApp(appToAdd)
    //       }

    //       // 重新生成标签
    //       generateAvailableTags()
    //     } else {
    //       console.error('App creation failed:', result.error)
    //       alert(`应用创建失败: ${result.error || '未知错误'}`)
    //     }
    //   })
    //   .catch((error) => {
    //     console.error('Error in createApp:', error)
    //     alert(`创建应用时发生错误: ${error.message}`)
    //   })

    // 关闭模态窗口
    // closeConfigModal();
  } catch (error) {
    console.error('Error handling app creation:', error)
    alert('应用创建出错，请重试')
  }
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
      <transition name="modal-fade">
        <ConfigModal
          v-if="showConfigModal"
          :app="currentAppConfig"
          :modalPosition="configModalPosition"
          :isNewApp="!apps.some((app) => app.id === currentAppConfig?.id)"
          @close="closeConfigModal"
          @save="saveAppConfig"
          @create="handleAppCreated"
        />
      </transition>
    </Teleport>
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
