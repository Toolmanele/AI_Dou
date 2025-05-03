<template>
  <div class="page-container">
    <h1 class="page-title">系统设置</h1>

    <div class="settings-grid">
      <!-- 应用空间配置 -->
      <div class="settings-card">
        <div class="settings-header">
          <h3>应用空间</h3>
        </div>
        <div class="settings-content">
          <div class="description">
            <p>配置应用空间目录，用于存放应用、种子文件和模型等资源</p>
          </div>
          <div class="directory-selector">
            <div class="form-group">
              <label for="appSpace">应用空间目录</label>
              <div class="input-with-button">
                <input
                  type="text"
                  id="appSpace"
                  v-model="settingsStore.appSpace"
                  placeholder="请选择应用空间目录"
                  readonly
                />
                <button @click="selectDirectory('appSpace')" class="btn btn-secondary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"
                    />
                  </svg>
                  浏览
                </button>
              </div>
              <span class="form-helper">此目录将用于存储所有AI模型和应用数据</span>
            </div>

            <!-- 添加重新设置按钮 -->
            <div class="setup-actions mt-2">
              <button @click="openSetupWizard" class="btn btn-primary setup-wizard-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
                  />
                </svg>
                重新设置应用空间
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- HuggingFace模型目录 -->
      <div class="settings-card">
        <div class="settings-header">
          <h3>HuggingFace 模型目录</h3>
        </div>
        <div class="settings-content">
          <div class="description">
            <p>设置 HuggingFace 模型存放的默认目录</p>
          </div>
          <div class="directory-selector">
            <div class="form-group">
              <label for="huggingfaceDir">HuggingFace 目录</label>
              <div class="input-with-button">
                <input
                  type="text"
                  id="huggingfaceDir"
                  v-model="settingsStore.huggingfaceDir"
                  placeholder="请选择 HuggingFace 模型目录"
                  readonly
                />
                <button @click="selectDirectory('huggingfaceDir')" class="btn btn-secondary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"
                    />
                  </svg>
                  浏览
                </button>
              </div>
              <span class="form-helper">用于存储 HuggingFace 下载的模型文件</span>
            </div>
          </div>
        </div>
      </div>

      <!-- PIP源设置 -->
      <!-- <div class="settings-card">
        <div class="settings-header">
          <h3>PIP 包管理源</h3>
        </div>
        <div class="settings-content">
          <div class="description">
            <p>配置 Python 包管理器的默认源</p>
          </div>
          <div class="form-group">
            <label for="pipSource">PIP 默认源</label>
            <select id="pipSource" v-model="settingsStore.pipSource" @change="updatePipSource">
              <option
                v-for="option in settingsStore.pipSourceOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
            <span class="form-helper">更换源可以加快 Python 包的下载速度</span>
          </div>
        </div>
      </div> -->

      <!-- GitHub镜像设置 -->
      <!-- <div class="settings-card">
        <div class="settings-header">
          <h3>GitHub 镜像设置</h3>
        </div>
        <div class="settings-content">
          <div class="description">
            <p>配置 GitHub 代码仓库的镜像源</p>
          </div>
          <div class="form-group">
            <label for="githubMirror">GitHub 镜像</label>
            <select
              id="githubMirror"
              v-model="settingsStore.githubMirrorUrl"
              @change="updateGithubMirror"
            >
              <option
                v-for="option in settingsStore.githubMirrorOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
            <span class="form-helper">使用镜像可以加速 GitHub 代码的克隆和下载</span>
          </div>

          <div v-if="settingsStore.githubMirrorUrl === 'custom'" class="form-group mt-2">
            <label for="customGithubMirror">自定义 GitHub 镜像 URL</label>
            <input
              type="text"
              id="customGithubMirror"
              v-model="customGithubMirrorUrl"
              placeholder="https://example.com/proxy/"
              @input="updateCustomGithubMirror"
            />
            <span class="form-helper">输入自定义的 GitHub 镜像地址</span>
          </div>
        </div>
      </div> -->

      <!-- 版本信息 -->
      <div class="settings-card">
        <div class="settings-header">
          <h3>版本信息</h3>
        </div>
        <div class="settings-content">
          <div class="version-info">
            <div class="info-item">
              <span class="info-label">应用版本:</span>
              <span class="info-value">{{ settingsStore.version }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Electron:</span>
              <span class="info-value">{{ electronVersion }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Chrome:</span>
              <span class="info-value">{{ chromeVersion }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Node.js:</span>
              <span class="info-value">{{ nodeVersion }}</span>
            </div>
          </div>
          <div class="version-actions mt-2">
            <button class="btn btn-secondary" @click="checkForUpdates">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
                />
              </svg>
              检查更新
            </button>
            <div v-if="isUpdateAvailable" class="update-available">
              <span>发现新版本 {{ latestVersion }}</span>
              <button class="btn btn-primary" @click="updateApp">更新</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 系统信息 -->
      <div class="settings-card">
        <div class="settings-header">
          <h3>系统信息</h3>
        </div>
        <div class="settings-content">
          <div v-if="isSystemInfoLoading" class="loading-container">
            <div class="loading-spinner"></div>
            <p class="loading-text">正在获取系统信息...</p>
          </div>
          <div v-else class="version-info">
            <div class="info-item">
              <span class="info-label">操作系统:</span>
              <span class="info-value"
                >{{ getSafeSystemInfoProperty('osName', '') }}
                {{ getSafeSystemInfoProperty('osVersion', '') }}</span
              >
            </div>
            <div class="info-item">
              <span class="info-label">系统架构:</span>
              <span class="info-value">{{ getSafeSystemInfoProperty('arch') }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">内存:</span>
              <span class="info-value"
                >{{ formatMemory(getSafeSystemInfoProperty('totalMemory', 0)) }} (可用:
                {{ formatMemory(getSafeSystemInfoProperty('freeMemory', 0)) }})</span
              >
            </div>
            <div class="info-item">
              <span class="info-label">CPU:</span>
              <span class="info-value">{{ getSafeSystemInfoProperty('cpuModel') }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">CPU 核心:</span>
              <span class="info-value"
                >{{ getSafeSystemInfoProperty('cpuCores', 'N/A') }} 核心 /
                {{ getSafeSystemInfoProperty('cpuSpeed', 'N/A') }}</span
              >
            </div>
            <div class="info-item">
              <span class="info-label">GPU:</span>
              <span class="info-value">{{ getSafeSystemInfoProperty('gpuInfo', '未检测到') }}</span>
            </div>
          </div>
          <div class="storage-info mt-2">
            <h4 class="storage-title">存储信息</h4>
            <div v-if="isSystemInfoLoading" class="loading-container">
              <div class="loading-spinner small"></div>
              <p class="loading-text small">加载存储信息...</p>
            </div>
            <div v-else-if="getSafeSystemInfoProperty('storageInfo', []).length > 0">
              <div
                v-for="(drive, index) in getSafeSystemInfoProperty('storageInfo', [])"
                :key="index"
                class="storage-item"
              >
                <div class="storage-name">
                  {{ drive.mount || '磁盘' + index }}
                </div>
                <div class="storage-bar">
                  <div class="storage-used" :style="{ width: getUsagePercent(drive) + '%' }"></div>
                </div>
                <div class="storage-details">
                  <span>{{ formatMemory(drive.used) }} / {{ formatMemory(drive.size) }}</span>
                  <span>可用: {{ formatMemory(drive.available) }}</span>
                </div>
              </div>
            </div>
            <div v-else class="storage-empty">无法获取存储信息</div>
          </div>
          <div class="refresh-action mt-2">
            <button
              class="btn btn-secondary"
              @click="refreshSystemInfo"
              :disabled="isSystemInfoLoading"
            >
              <svg
                v-if="!isSystemInfoLoading"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
                />
              </svg>
              <div v-else class="loading-spinner small inline"></div>
              {{ isSystemInfoLoading ? '正在刷新...' : '刷新系统信息' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 调试设置 -->
      <div class="settings-card">
        <div class="settings-header">
          <h3>高级设置</h3>
        </div>
        <div class="settings-content">
          <div class="form-group">
            <div class="switch-container">
              <label class="switch-label">调试模式</label>
              <label class="switch">
                <input
                  type="checkbox"
                  v-model="settingsStore.debugMode"
                  @change="updateDebugMode"
                />
                <span class="slider"></span>
              </label>
            </div>
            <span class="form-helper">开启调试模式，显示详细日志</span>
          </div>
          <div class="mt-2">
            <button class="btn btn-danger" @click="resetSettings">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8s-3.58-8-8-8z"
                />
              </svg>
              重置所有设置
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import { useSettingsStore } from '../stores/settings'
import { eventBus, EVENT_NAMES } from '../services/eventBus'

// 定义组件名称
defineOptions({
  name: 'Settings'
})

// 使用 Pinia stores
const appStore = useAppStore()
const settingsStore = useSettingsStore()

// 从 app store 获取版本信息
const { appVersion, systemInfo, getSystemInfo, isSystemInfoLoading } = appStore

// 计算属性 - 从系统信息中提取版本
const electronVersion = computed(() => systemInfo.electronVersion || 'N/A')
const chromeVersion = computed(() => systemInfo.chromeVersion || 'N/A')
const nodeVersion = computed(() => systemInfo.nodeVersion || 'N/A')

// Custom GitHub mirror URL for handling custom option
const customGithubMirrorUrl = ref('')

// 界面状态
const isUpdateAvailable = ref(false)
const latestVersion = ref('')

// 格式化内存大小显示
function formatMemory(bytes) {
  if (!bytes || isNaN(bytes)) return '未知'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}

// 计算磁盘使用百分比
function getUsagePercent(drive) {
  if (!drive || !drive.size || drive.size === 0) return 0
  return Math.round((drive.used / drive.size) * 100)
}

// 安全访问系统信息属性
function getSafeSystemInfoProperty(property, defaultValue = 'N/A') {
  // 如果正在加载，则返回 null 表示加载中
  if (isSystemInfoLoading) {
    return null
  }

  try {
    if (!systemInfo || systemInfo[property] === undefined || systemInfo[property] === null) {
      return defaultValue
    }
    return systemInfo[property]
  } catch (e) {
    console.warn(`Error accessing system info property ${property}:`, e)
    return defaultValue
  }
}

// 刷新系统信息
async function refreshSystemInfo() {
  try {
    // 传递true强制刷新系统信息
    await getSystemInfo(true)
  } catch (error) {
    console.error('刷新系统信息失败:', error)
  }
}

// 选择目录
async function selectDirectory(settingName) {
  try {
    // 直接使用settingsStore的selectDirectory方法
    await settingsStore.selectDirectory(settingName)
  } catch (error) {
    console.error('选择目录错误:', error)
  }
}

// 重置设置
async function resetSettings() {
  if (confirm('确定要重置所有设置吗？此操作不可撤销。')) {
    // 调用settingsStore的resetToDefaults方法
    await settingsStore.resetToDefaults()
  }
}

// 检查更新
function checkForUpdates() {
  // 模拟检查更新
  setTimeout(() => {
    isUpdateAvailable.value = true
    latestVersion.value = '1.1.0'
  }, 1500)
}

// 更新应用
function updateApp() {
  alert('开始更新应用...')
  // 这里应该实现实际的更新逻辑
}

// 打开开发者工具
function openDevTools() {
  if (window.electronAPI) {
    window.electronAPI.toggleDevTools()
  } else {
    console.warn('electronAPI.toggleDevTools 不可用')
  }
}

// 加载设置
async function loadSettings() {
  try {
    // 使用优化后的initializeSettings方法，它会自动处理缓存逻辑
    await settingsStore.initializeSettings()

    // 日志显示当前设置状态，只在调试模式下显示
    if (settingsStore.debugMode) {
      console.log('设置加载状态:', settingsStore.status)
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

// 初始化
onMounted(async () => {
  await loadSettings()
  await refreshSystemInfo()
})

// 更新调试模式
async function updateDebugMode() {
  await settingsStore.updateSetting('debugMode', settingsStore.debugMode)
  console.log('更新调试模式:', settingsStore.debugMode)
}

// 更新 PIP 源
async function updatePipSource() {
  await settingsStore.updateSetting('pipSource', settingsStore.pipSource)
  console.log('更新 PIP 源:', settingsStore.pipSource)
}

// 更新 GitHub mirror
async function updateGithubMirror() {
  // If custom is selected, prepare for custom URL input
  if (settingsStore.githubMirrorUrl === 'custom') {
    customGithubMirrorUrl.value = ''
  }
  await settingsStore.updateSetting('githubMirrorUrl', settingsStore.githubMirrorUrl)
  console.log('更新 GitHub 镜像:', settingsStore.githubMirrorUrl)
}

// Function to update custom GitHub mirror URL
function updateCustomGithubMirror() {
  if (customGithubMirrorUrl.value.trim()) {
    settingsStore.githubMirrorUrl = customGithubMirrorUrl.value
    updateGithubMirror()
  }
}

// 打开设置向导
function openSetupWizard() {
  // 使用事件总线触发欢迎模态框显示
  eventBus.emit(EVENT_NAMES.SHOW_WELCOME_MODAL)
  console.log('已触发欢迎模态框显示事件')
}
</script>

<style scoped>
.page-container {
  width: 100%;
  height: 100%;
  padding: 20px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
  overflow-y: auto;
  /* padding: 24px;
  max-width: 1200px;
  margin: 0 auto; */
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--color-text-strong);
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.settings-card {
  background-color: var(--color-card);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  padding: 16px;
  border: 1px solid var(--color-border);
}

.settings-header {
  margin-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 12px;
}

.settings-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-strong);
  margin: 0;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.description {
  font-size: 14px;
  color: var(--color-text-light);
  margin-bottom: 8px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}

.form-helper {
  font-size: 12px;
  color: var(--color-text-light);
}

.input-with-button {
  display: flex;
  gap: 8px;
}

.input-with-button input {
  flex: 1;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-text);
}

.input-with-button button {
  display: flex;
  align-items: center;
  gap: 6px;
}

.form-group input,
.form-group select {
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-background);
  color: var(--color-text);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.range-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.form-group input[type='range'] {
  flex: 1;
  accent-color: var(--color-primary);
}

.range-value {
  font-size: 14px;
  color: var(--color-text-light);
  min-width: 24px;
  text-align: center;
}

.switch-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.switch-label {
  font-size: 14px;
  color: var(--color-text);
}

.switch {
  position: relative;
  display: inline-block;
  width: 42px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--color-primary);
}

input:focus + .slider {
  box-shadow: 0 0 1px var(--color-primary);
}

input:checked + .slider:before {
  transform: translateX(18px);
}

.version-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.info-label {
  color: var(--color-text-light);
}

.info-value {
  font-weight: 500;
  color: var(--color-text);
}

.version-actions,
.dev-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.update-available {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--color-primary);
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn svg {
  width: 16px;
  height: 16px;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
}

.btn-primary:disabled {
  background-color: var(--color-border);
  cursor: not-allowed;
}

.btn-secondary {
  background-color: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.btn-secondary:hover {
  background-color: var(--color-hover);
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover {
  background-color: #dc2626;
}

.mt-2 {
  margin-top: 16px;
}

/* 系统信息样式 */
.storage-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-strong);
  margin: 0 0 12px 0;
}

.storage-item {
  margin-bottom: 12px;
}

.storage-name {
  font-size: 13px;
  color: var(--color-text);
  margin-bottom: 4px;
}

.storage-bar {
  height: 8px;
  background-color: var(--color-background-secondary);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.storage-used {
  height: 100%;
  background-color: var(--color-primary);
  border-radius: 4px;
}

.storage-details {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--color-text-light);
}

.storage-empty {
  font-size: 13px;
  color: var(--color-text-light);
  font-style: italic;
}

.refresh-action {
  display: flex;
  justify-content: flex-end;
}

.setup-actions {
  display: flex;
  justify-content: flex-end;
}

.setup-wizard-btn {
  background-color: var(--color-primary);
  color: white;
}

.setup-wizard-btn:hover {
  background-color: var(--color-primary-dark);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-background-secondary);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner.small {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.loading-spinner.inline {
  display: inline-block;
  margin-right: 8px;
  vertical-align: middle;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 14px;
  color: var(--color-text-light);
  margin: 0;
}

.loading-text.small {
  font-size: 12px;
}
</style>
