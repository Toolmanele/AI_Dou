<template>
  <div class="welcome-modal-overlay">
    <div class="welcome-modal">
      <div class="welcome-container">
        <div class="welcome-header">
          <h1>欢迎使用</h1>
          <p class="welcome-subtitle">首次设置</p>
        </div>

        <div class="welcome-content">
          <div class="welcome-message">
            <h2>设置应用空间</h2>
            <p>
              应用需要设置一个文件夹来存储应用数据和AI模型。由于AI模型和生成的内容可能会占用大量存储空间，建议选择空间较大的磁盘。
            </p>
          </div>

          <div class="disk-selection">
            <h3>请选择一个磁盘作为应用空间：</h3>

            <div v-if="isLoading" class="loading-container">
              <div class="loading-spinner"></div>
              <p>正在加载磁盘信息...</p>
            </div>

            <div
              v-else-if="!systemInfo.storageInfo || systemInfo.storageInfo.length === 0"
              class="error-message"
            >
              <p>无法获取磁盘信息，请手动选择文件夹。</p>
            </div>

            <div v-else class="disk-list">
              <div
                v-for="(drive, index) in systemInfo.storageInfo"
                :key="index"
                class="disk-item"
                :class="{ selected: selectedDisk === drive.mount }"
                @click="selectDisk(drive.mount)"
              >
                <div class="disk-info">
                  <div class="disk-name">
                    {{ drive.mount || '磁盘' + index }}
                  </div>
                  <div class="disk-details">
                    <span>可用: {{ formatMemory(drive.available) }}</span>
                    <span> / 总计: {{ formatMemory(drive.size) }}</span>
                  </div>
                </div>
                <div class="disk-bar">
                  <div class="disk-used" :style="{ width: getUsagePercent(drive) + '%' }"></div>
                </div>
              </div>
            </div>

            <div class="custom-path-section">
              <h4>应用仓库</h4>
              <div class="input-with-button">
                <input
                  type="text"
                  v-model="appSpacePath"
                  placeholder="请选择应用仓库目录"
                  readonly
                />
                <button @click="selectCustomPath" class="btn btn-secondary">浏览</button>
              </div>
              <p class="path-note">应用数据和模型将存储在此目录中</p>
            </div>
          </div>
        </div>

        <div class="welcome-footer">
          <button class="btn btn-primary" :disabled="!appSpacePath" @click="saveSettings">
            <span v-if="isSaving" class="loading-dot-container">
              <span class="loading-dot"></span>
              <span class="loading-dot"></span>
              <span class="loading-dot"></span>
            </span>
            <span v-else> 完成设置 </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, defineEmits } from 'vue'
import { useAppStore } from '../stores/app'
import { useSettingsStore } from '../stores/settings'

// 定义事件
const emit = defineEmits(['completed', 'close'])

// 获取应用和设置存储
const appStore = useAppStore()
const settingsStore = useSettingsStore()

// 页面状态
const isLoading = ref(true)
const isSaving = ref(false)
const systemInfo = ref({
  storageInfo: []
})
const selectedDisk = ref('')
const appSpacePath = ref('')

// 在组件加载时获取系统信息
onMounted(async () => {
  try {
    // 获取系统信息
    isLoading.value = true
    await appStore.getSystemInfo(true) // 强制刷新系统信息
    systemInfo.value = appStore.systemInfo

    // 如果当前设置已有appSpace，则使用它
    if (settingsStore.appSpace) {
      appSpacePath.value = settingsStore.appSpace

      // 尝试确定所选磁盘
      const driveLetter = appSpacePath.value.split(':')[0] + ':'
      selectedDisk.value = driveLetter
    }
  } catch (error) {
    console.error('获取系统信息失败:', error)
  } finally {
    isLoading.value = false
  }
})

// 计算磁盘使用百分比
function getUsagePercent(drive) {
  if (!drive || !drive.size || drive.size === 0) return 0
  return Math.round((drive.used / drive.size) * 100)
}

// 格式化内存数值为人类可读格式
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

// 选择磁盘
function selectDisk(mount) {
  selectedDisk.value = mount

  // 设置默认文件夹路径
  const defaultFolder = 'AIDou_Hub'
  appSpacePath.value = `${mount}${mount.endsWith('\\') ? '' : '\\'}${defaultFolder}`
}

// 选择自定义路径
async function selectCustomPath() {
  try {
    const selectedPath = await settingsStore.selectDirectory('appSpace')
    if (selectedPath) {
      appSpacePath.value = selectedPath

      // 更新所选磁盘
      const driveLetter = selectedPath.split(':')[0] + ':'
      selectedDisk.value = driveLetter
    }
  } catch (error) {
    console.error('选择目录失败:', error)
  }
}

// 保存设置并继续
async function saveSettings() {
  try {
    isSaving.value = true

    // 确保路径不为空
    if (!appSpacePath.value) {
      alert('请选择应用空间目录')
      return
    }

    // 检查路径是否存在并且是否是文件夹
    if (window.electronAPI && window.electronAPI.checkPathExists) {
      const pathCheckResult = await window.electronAPI.checkPathExists(appSpacePath.value)

      if (pathCheckResult.exists && !pathCheckResult.isDirectory) {
        alert('所选路径已存在但不是文件夹，请选择其他路径')
        return
      }

      // 如果路径不存在，尝试创建文件夹
      if (!pathCheckResult.exists) {
        try {
          await window.electronAPI.createDirectory(appSpacePath.value)
          console.log('成功创建应用空间目录:', appSpacePath.value)
        } catch (error) {
          alert(`无法创建目录: ${error.message || '未知错误'}`)
          return
        }
      }
    }

    // 保存设置 - 使用优化后的方法
    // 更新appSpace值
    await settingsStore.updateSetting('appSpace', appSpacePath.value)

    // 通知完成设置
    emit('completed', appSpacePath.value)
  } catch (error) {
    console.error('保存设置失败:', error)
    alert('保存设置失败，请重试')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.welcome-modal-overlay {
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
  backdrop-filter: blur(3px);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.welcome-modal {
  width: 800px;
  max-width: 90%;
  max-height: 90vh;
  animation: modalSlideIn 0.4s ease;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

@keyframes modalSlideIn {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.welcome-container {
  width: 100%;
  background-color: var(--color-card);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.welcome-header {
  padding: 24px 30px;
  background-color: var(--color-primary);
  color: white;
  text-align: center;
}

.welcome-header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
}

.welcome-subtitle {
  margin-top: 8px;
  opacity: 0.9;
  font-size: 1.1rem;
}

.welcome-content {
  padding: 30px;
  overflow-y: auto;
  max-height: calc(90vh - 180px); /* 减去header和footer的高度 */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
}

.welcome-message {
  margin-bottom: 30px;
}

.welcome-message h2 {
  font-size: 1.5rem;
  margin-bottom: 16px;
  color: var(--color-text-strong);
}

.welcome-message p {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--color-text);
}

.disk-selection h3 {
  font-size: 1.2rem;
  margin-bottom: 16px;
  color: var(--color-text-strong);
}

.disk-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
  max-height: 300px;
  overflow-y: auto;
}

.disk-item {
  background-color: var(--color-background-tertiary);
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.disk-item:hover {
  background-color: var(--color-hover);
}

.disk-item.selected {
  border-color: var(--color-primary);
  background-color: rgba(76, 110, 245, 0.05);
}

.disk-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.disk-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--color-text-strong);
}

.disk-details {
  font-size: 0.9rem;
  color: var(--color-text-light);
}

.disk-bar {
  height: 8px;
  background-color: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.disk-used {
  height: 100%;
  background-color: #4c6ef5;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.custom-path-section {
  margin-top: 30px;
}

.custom-path-section h4 {
  font-size: 1rem;
  margin-bottom: 8px;
  color: var(--color-text-strong);
}

.input-with-button {
  display: flex;
}

.input-with-button input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--input-border);
  border-radius: 6px 0 0 6px;
  font-size: 0.95rem;
  background-color: var(--color-background-tertiary);
  color: var(--color-text);
}

.input-with-button button {
  padding: 10px 16px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0 6px 6px 0;
  cursor: pointer;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.input-with-button button:hover {
  background-color: var(--color-primary-dark);
}

.path-note {
  margin-top: 8px;
  font-size: 0.85rem;
  color: var(--color-text-light);
}

.welcome-footer {
  padding: 20px 30px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--color-border);
  background-color: var(--color-background-secondary);
}

.btn {
  padding: 10px 24px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
}

.btn-primary:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: white;
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background-color: var(--color-background-secondary);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(76, 110, 245, 0.2);
  border-radius: 50%;
  border-top-color: var(--color-primary);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  padding: 16px;
  color: #e53e3e;
  background-color: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 6px;
  margin-bottom: 24px;
}

/* Loading dots animation */
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
</style>
