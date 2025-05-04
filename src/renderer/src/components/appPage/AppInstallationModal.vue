<script setup>
import TerminalLogger from '../TerminalLogger/TerminalLogger.vue'
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  app: {
    type: Object,
    default: null
  },
  isInstalling: {
    type: Boolean,
    default: false
  },
  isBackgroundInstallation: {
    type: Boolean,
    default: false
  }
})

// 添加日志和进度的响应式状态
const logs = ref([])
const progress = ref(0)

// 标记是否已设置监听器
let isListenerSet = false

// 当组件挂载时设置事件监听器
onMounted(() => {
  if (props.isVisible) {
    setupProgressListener()
  }
})

// 当组件卸载时移除事件监听器
onUnmounted(() => {
  removeProgressListener()
})

// 监听模态框可见性变化
watch(
  () => props.isVisible,
  (isVisible) => {
    if (isVisible) {
      // 重置日志和进度
      logs.value = []
      progress.value = 0
      // 重新设置监听器
      setupProgressListener()
    } else {
      // 当模态框关闭时移除监听器
      removeProgressListener()
    }
  }
)

// 设置安装进度监听器
const setupProgressListener = () => {
  if (window.electronAPI && window.electronAPI.onInstallProgress && !isListenerSet) {
    // 设置监听器
    window.electronAPI.onInstallProgress((data) => {
      console.log('data', data)
      if (data && data.message) {
        // 添加新日志
        console.log('data.message', data.message)
        // 这里的log {id,type,text,timestamp}
        logs.value.push({
          id: Math.random().toString(36).substring(2, 15),
          type: data.status,
          text: data.message,
          timestamp: new Date().toISOString()
        })
      }

      // 更新进度
      if (data.progress !== undefined) {
        progress.value = data.progress
      }
    })

    isListenerSet = true
  }
}

// 移除安装进度监听器
const removeProgressListener = () => {
  if (isListenerSet && window.electronAPI && window.electronAPI.removeInstallProgressListener) {
    window.electronAPI.removeInstallProgressListener()
    isListenerSet = false
  }
}

const emit = defineEmits(['close', 'abort', 'background'])

// 处理关闭模态框
const handleClose = () => {
  emit('close')
}

// 切换到后台安装
const handleBackgroundInstall = () => {
  emit('background')
}

// 中止安装
const handleAbortInstall = () => {
  if (confirm('警告：中止安装可能会导致应用不完整或无法使用。确定要中止安装吗？')) {
    emit('abort')
  }
}
</script>

<template>
  <transition name="modal-fade">
    <div v-if="isVisible" class="installation-modal-overlay" @click="handleClose">
      <div class="installation-modal" @click.stop>
        <div class="installation-header">
          <h2>
            <span v-if="app">{{ app.name }}</span>
            安装进程
          </h2>
          <div class="status-indicator" :class="{ active: isInstalling }">
            <span v-if="isInstalling" class="status-text">正在安装</span>
            <span v-else class="status-text"
              >安装已{{ isBackgroundInstallation ? '转入后台' : '完成' }}</span
            >
          </div>
        </div>

        <!-- Terminal Logger -->
        <div class="terminal-container">
          <TerminalLogger :logs="logs" title="安装日志" :auto-scroll="true" height="300px" />
        </div>

        <div class="installation-footer">
          <div class="progress-info">
            <div class="progress-percentage">{{ progress }}%</div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
            </div>
          </div>

          <div class="action-buttons">
            <button
              v-if="isInstalling"
              class="action-btn background-btn"
              @click="handleBackgroundInstall"
            >
              在后台继续安装
            </button>
            <button v-if="isInstalling" class="action-btn abort-btn" @click="handleAbortInstall">
              中止安装
            </button>
            <button v-if="!isInstalling" class="action-btn close-btn" @click="handleClose">
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.installation-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.installation-modal {
  background-color: var(--color-card);
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
}

.installation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
}

.installation-header h2 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--color-text-strong);
}

.status-indicator {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  background-color: #e9e9e9;
  transition: all 0.3s ease;
}

.status-indicator.active {
  background-color: var(--color-primary);
  color: white;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(76, 110, 245, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(76, 110, 245, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(76, 110, 245, 0);
  }
}

.terminal-container {
  margin-bottom: 20px;
  flex-grow: 1;
  border-radius: 8px;
  overflow: hidden;
}

.installation-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-percentage {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--color-text-strong);
  min-width: 50px;
}

.progress-bar {
  width: 250px;
  height: 10px;
  background-color: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-primary);
  transition: width 0.3s ease;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.action-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.background-btn {
  background-color: var(--color-primary);
  color: white;
}

.background-btn:hover {
  background-color: var(--color-primary-dark);
  transform: translateY(-1px);
}

.abort-btn {
  background-color: #ff4d4f;
  color: white;
}

.abort-btn:hover {
  background-color: #ff1f1f;
  transform: translateY(-1px);
}

.close-btn {
  background-color: var(--color-primary);
  color: white;
}

.close-btn:hover {
  background-color: var(--color-primary-dark);
  transform: translateY(-1px);
}

/* Animation */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
