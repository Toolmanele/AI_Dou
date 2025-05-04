<script setup>
import { ref, computed, watch, onMounted, nextTick, onUnmounted } from 'vue'
// import ProgressBar from './ProgressBar.vue'

const props = defineProps({
  /** Array of log objects to display */
  logs: {
    type: Array,
    required: true,
    default: () => []
  },
  /** Auto-scroll to the bottom when new logs are added */
  autoScroll: {
    type: Boolean,
    default: true
  },
  /** Height of the terminal container */
  height: {
    type: String,
    default: '400px'
  },
  /** Show the terminal title bar */
  showHeader: {
    type: Boolean,
    default: true
  },
  /** Title to display in the header */
  title: {
    type: String,
    default: 'Terminal Output'
  },
  /** Show timestamp for log entries */
  showTimestamp: {
    type: Boolean,
    default: true
  },
  /** Format to display the timestamp (default: timeString) */
  timestampFormat: {
    type: String,
    default: 'time' // 'time', 'date', 'datetime'
  },
  /** Show progress bar */
  showProgress: {
    type: Boolean,
    default: true
  },
  /** Enable debug mode (console logs) */
  debug: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['log-click'])
const currentProgress = computed(() => {
  if (props.logs?.length > 0) {
    return props.logs[props.logs.length - 1].progress
  }
  return 0
})

// Format timestamp based on configuration
const formatTimestamp = (timestamp) => {
  const date = timestamp ? new Date(timestamp) : new Date()

  switch (props.timestampFormat) {
    case 'date':
      return date.toLocaleDateString()
    case 'datetime':
      return date.toLocaleString()
    case 'time':
    default:
      return date.toLocaleTimeString()
  }
}

// 保存终端容器引用
const terminalRef = ref(null)

// Auto-scroll to bottom with improved implementation
const scrollToBottom = () => {
  if (!props.autoScroll) return

  nextTick(() => {
    if (terminalRef.value) {
      terminalRef.value.scrollTop = terminalRef.value.scrollHeight
    }
  })
}

// 检测用户是否正在滚动查看历史记录
const userScrolling = ref(false)
const isAtBottom = ref(true)
let scrollTimer = null

// 滚动指示器状态
const hasNewLogs = ref(false)

// 处理滚动事件
const handleScroll = () => {
  if (!terminalRef.value) return

  // 判断是否在底部附近
  const { scrollTop, scrollHeight, clientHeight } = terminalRef.value
  const isScrolledToBottom = scrollTop + clientHeight >= scrollHeight - 30 // 30px tolerance

  isAtBottom.value = isScrolledToBottom

  // 如果滚动到底部，重置新日志标记
  if (isScrolledToBottom) {
    hasNewLogs.value = false
  }

  // 设置用户正在滚动
  userScrolling.value = true

  // 清除之前的计时器
  if (scrollTimer) clearTimeout(scrollTimer)

  // 3秒内没有滚动操作就认为用户已停止滚动
  scrollTimer = setTimeout(() => {
    userScrolling.value = false
    // 如果设置了自动滚动并且用户已停止滚动，回到底部
    if (props.autoScroll && isAtBottom.value) {
      scrollToBottom()
    }
  }, 3000)
}

// 点击"新日志"指示器时滚动到底部
const scrollToBottomOnClick = () => {
  scrollToBottom()
  hasNewLogs.value = false
}

// Handle log click
const handleLogClick = (log) => {
  emit('log-click', log)
}

// 调试工具
const debugMode = ref(props.debug)

// 同步更新调试模式
watch(
  () => props.debug,
  (newValue) => {
    debugMode.value = newValue
  }
)

// 调试日志
const debug = (...args) => {
  if (debugMode.value) {
    console.log('[TerminalLogger]', ...args)
  }
}

// Watch for changes in the logs array
watch(
  () => props.logs,
  (newLogs, oldLogs) => {
    // 确保newLogs是一个有效的数组
    if (!Array.isArray(newLogs)) {
      console.error('Invalid logs array:', newLogs)
      return
    }
    if (props.autoScroll && (!userScrolling.value || isAtBottom.value)) {
      scrollToBottom()
    } else {
      // 用户正在查看历史记录，标记有新日志
      hasNewLogs.value = true
    }
  },
  { deep: true, immediate: true }
)

// 初始化滚动
onMounted(() => {
  // 确保组件挂载后滚动到底部
  nextTick(() => {
    scrollToBottom()
  })
})

// 确保组件卸载时清除计时器
onUnmounted(() => {
  if (scrollTimer) clearTimeout(scrollTimer)
})
</script>

<template>
  <div class="terminal">
    <div v-if="showHeader" class="terminal-header">
      <!-- <div class="terminal-dots">
        <span></span>
        <span></span>
        <span></span>
      </div> -->
      <div class="terminal-title">{{ title }}</div>
    </div>

    <!-- <ProgressBar v-if="showProgress" :value="currentProgress" /> -->

    <div
      class="terminal-container"
      :style="{ height }"
      ref="terminalRef"
      @scroll="handleScroll"
      :class="{ 'has-new-logs': hasNewLogs, 'at-bottom': isAtBottom }"
    >
      <div
        v-for="log in logs"
        :key="log.id"
        :class="['log-entry', log.type]"
        @click="handleLogClick(log)"
      >
        <span v-if="showTimestamp" class="timestamp">{{ formatTimestamp(log.timestamp) }}</span>
        <span class="log-icon" :class="log.type">●</span>
        <div class="log-text-wrapper">
          <span class="log-text">{{ log.text }}</span>
        </div>
      </div>

      <div v-if="logs.length === 0" class="empty-message">
        <div class="empty-icon">📋</div>
        <p>暂无日志信息</p>
      </div>

      <!-- 新日志指示器 -->
      <div
        v-if="hasNewLogs && !isAtBottom"
        class="new-logs-indicator"
        @click="scrollToBottomOnClick"
      >
        ↓ 新日志
      </div>
    </div>
  </div>
</template>

<style scoped>
.terminal {
  width: 100%;
  border: 1px solid #333;
  border-radius: 6px;
  overflow: hidden;
  font-family: Consolas, 'Courier New', monospace;
  background-color: #1e1e1e;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.terminal-header {
  background-color: #333;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  user-select: none;
}

.terminal-dots {
  display: flex;
  gap: 6px;
  margin-right: 12px;
}

.terminal-dots span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #ff5f56;
}

.terminal-dots span:nth-child(2) {
  background-color: #ffbd2e;
}

.terminal-dots span:nth-child(3) {
  background-color: #27c93f;
}

.terminal-title {
  color: #aaa;
  font-size: 0.8rem;
  flex: 1;
  text-align: center;
}

.terminal-container {
  position: relative;
  padding: 10px;
  overflow-y: auto;
  color: #f8f8f8;
  background-color: #1e1e1e;
  /* background-image: linear-gradient(rgba(255, 255, 255, 0.03) 50%, transparent 50%); */
  background-size: 100% 4px;
  font-size: 14px;

  scrollbar-width: thin;
  scrollbar-color: rgb(255 255 255 / 11%) transparent;
}

.log-entry {
  padding: 2px 0;
  display: flex;
  align-items: flex-start;
  animation: fadeIn 0.3s ease;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.log-entry:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.timestamp {
  color: #888;
  margin-right: 10px;
  font-size: 0.8rem;
  flex-shrink: 0;
  text-align: left;
}

.log-icon {
  margin-right: 8px;
  font-size: 10px;
  flex-shrink: 0;
  margin-top: 4px;
}

.log-icon.info {
  color: #3498db;
}

.log-icon.warning {
  color: #f39c12;
}

.log-icon.error {
  color: #e74c3c;
}

.log-icon.success {
  color: #2ecc71;
}

.log-text-wrapper {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.log-text {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.9rem;
  line-height: 1.4;
  display: inline-block;
  width: 100%;
  text-align: left;
}

.empty-message {
  color: #999;
  text-align: center;
  padding: 30px;
  font-style: italic;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 15px;
  opacity: 0.7;
}

.empty-message p {
  margin: 5px 0 15px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Log type styles */
.log-entry.info .log-text {
  color: #f8f8f8;
}

.log-entry.warning .log-text {
  color: #f39c12;
}

.log-entry.error .log-text {
  color: #e74c3c;
}

.log-entry.success .log-text {
  color: #2ecc71;
}

/* 滚动指示器样式 */
.new-logs-indicator {
  position: absolute;
  bottom: 15px;
  right: 15px;
  background-color: rgba(70, 70, 70, 0.9);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  animation: pulse 1.5s infinite;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 5px;
}

.new-logs-indicator::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  background-color: #4caf50;
  border-radius: 50%;
  margin-right: 5px;
}

@keyframes pulse {
  0% {
    opacity: 0.7;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-3px);
  }
  100% {
    opacity: 0.7;
    transform: translateY(0);
  }
}
</style>
