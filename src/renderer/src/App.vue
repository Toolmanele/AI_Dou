<template>
  <div class="app" :class="{ 'dark-mode': isDarkMode }">
    <!-- 自定义标题栏 -->
    <TitleBar :title="fullAppName" />

    <div class="app-container">
      <!-- 常规应用内容 -->
      <Sidebar @menu-change="activeMenu = $event" />

      <div class="app-content">
        <main>
          <!-- 动态加载当前激活的页面组件 -->
          <component :is="currentPage" />
        </main>
      </div>
    </div>

    <!-- 欢迎设置模态框 -->
    <WelcomePage v-if="showWelcomePage" @completed="handleWelcomeCompleted" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useAppStore } from './stores/app'
import { useSettingsStore } from './stores/settings'
import { eventBus, EVENT_NAMES } from './services/eventBus'
import TitleBar from './components/TitleBar.vue'
import Sidebar from './components/Sidebar.vue'
import WelcomePage from './views/WelcomePage.vue'

// 导入页面组件
import AppListPage from './views/AppListPage.vue'
import ModelsPage from './views/ModelsPage.vue'
import Settings from './views/Settings.vue'
import SeedPage from './views/SeedPage.vue'

// 定义组件名称，用于开发工具 (可选)
defineOptions({
  name: 'App'
})

// 使用 Pinia store
const appStore = useAppStore()
const settingsStore = useSettingsStore()

const { appName, appVersion, fullAppName, getVersionInfo } = appStore

// 临时替代变量，之后可以通过其他方式实现暗色模式
const isDarkMode = ref(false)

// 当前激活的菜单
const activeMenu = ref('apps')

// 控制是否显示欢迎页面
const showWelcomePage = ref(false)

// 根据激活的菜单动态计算当前页面组件
const currentPage = computed(() => {
  switch (activeMenu.value) {
    case 'apps':
      return AppListPage
    case 'models':
      return ModelsPage
    case 'settings':
      return Settings
    case 'seeds':
      return SeedPage
    default:
      return AppListPage
  }
})

// 处理欢迎设置完成事件
function handleWelcomeCompleted(appSpacePath) {
  console.log('欢迎设置完成，应用空间路径:', appSpacePath)
  showWelcomePage.value = false
}

// 检查是否需要显示欢迎页面
async function checkAppSpace() {
  try {
    // 初始化设置 - 这将会使用缓存机制
    await settingsStore.initializeSettings()

    // 如果appSpace未设置，显示欢迎页面
    showWelcomePage.value = !settingsStore.appSpace
  } catch (error) {
    console.error('检查appSpace设置失败:', error)
    // 安全处理 - 默认不显示欢迎页面
    showWelcomePage.value = false
  }
}

// 事件总线的取消订阅函数
let unsubscribeShowWelcomeModal

// 生命周期钩子
onMounted(async () => {
  // 获取版本信息
  await getVersionInfo()

  // 检查是否需要显示欢迎页面
  await checkAppSpace()

  // 监听 F12 快捷键，显示开发者工具
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F12' && window.electronAPI) {
      window.electronAPI.toggleDevTools()
    }
  })

  // 监听事件总线上的显示欢迎模态框事件
  unsubscribeShowWelcomeModal = eventBus.on(EVENT_NAMES.SHOW_WELCOME_MODAL, () => {
    showWelcomePage.value = true
    console.log('欢迎模态框已显示')
  })
})

// 组件卸载时取消事件订阅
onUnmounted(() => {
  if (unsubscribeShowWelcomeModal) {
    unsubscribeShowWelcomeModal()
  }
})

// 监听设置的变化
watch(
  () => settingsStore.appSpace,
  (newValue) => {
    // 如果appSpace被设置，关闭欢迎页面
    if (newValue) {
      showWelcomePage.value = false
    }
  }
)
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  /* 浅色主题变量 */
  --color-primary: #4c6ef5;
  --color-primary-light: #6983f8;
  --color-primary-light-light: #8ba6ff;
  --color-primary-dark: #3b5bdb;
  --color-secondary: #334155;
  --color-secondary-light: #475569;

  --color-background: #f9fafc;
  --color-background-secondary: #f1f5f9;
  --color-background-tertiary: #f8fafc;

  --color-text: #334155;
  --color-text-light: #64748b;
  --color-text-strong: #1e293b;

  --color-border: #e2e8f0;
  --color-hover: rgba(76, 110, 245, 0.08);
  --color-active: rgba(76, 110, 245, 0.12);

  --color-card: #ffffff;
  --color-card-hover: #f8fafc;

  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);

  /* 旧变量兼容处理 */
  --primary-color: var(--color-primary);
  --background-color: var(--color-background);
  --text-color: var(--color-text);
  --card-shadow: var(--shadow-md);
  --border-color: var(--color-border);
  --input-border: #cbd5e1;
  --hover-bg: var(--color-background-secondary);
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --info-color: #3b82f6;
  --purple-color: #8b5cf6;
  --error-color: #ef4444;
}

.app.dark-mode {
  /* 暗色主题变量 */
  --color-primary: #3b82f6;
  --color-primary-light: #60a5fa;
  --color-primary-dark: #2563eb;
  --color-secondary: #252526;
  --color-secondary-light: #2d2d2d;

  --color-background: #1e1e1e;
  --color-background-secondary: #252526;
  --color-background-tertiary: #2d2d2d;

  --color-text: #cccccc;
  --color-text-light: #8b95a3;
  --color-text-strong: #e0e0e0;

  --color-border: #2d2d2d;
  --color-hover: rgba(59, 130, 246, 0.1);
  --color-active: rgba(59, 130, 246, 0.15);

  --color-card: #252526;
  --color-card-hover: #2d2d2d;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15);

  /* 旧变量兼容处理 */
  --primary-color: var(--color-primary);
  --background-color: var(--color-background);
  --text-color: var(--color-text);
  --card-shadow: var(--shadow-md);
  --border-color: var(--color-border);
  --input-border: #4b5563;
  --hover-bg: var(--color-background-secondary);
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
    'Helvetica Neue', sans-serif;
  background-color: var(--color-background, #ffffff);
  color: var(--color-text, #3c4857);
  /* 添加 border-radius 到整个窗口，使其看起来更现代 */
  border-radius: 8px;
  overflow: hidden;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* 新增 app-container 样式 */
.app-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  height: calc(100vh - 32px); /* 确保与标题栏高度一致 */
}

.app-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

header {
  background-color: var(--color-background, #ffffff);
  color: var(--color-text-strong, #1f2937);
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border, #e4e6eb);
  box-shadow: var(--shadow-sm);
}

.logo {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo h1 {
  font-weight: 600;
  font-size: 1.25rem;
  color: var(--color-primary, #3b82f6);
}

main {
  flex: 1;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background-color: var(--color-background, #ffffff);
}

footer {
  background-color: var(--color-background-tertiary, #f8f9fa);
  color: var(--color-text-light, #8b95a3);
  text-align: center;
  padding: 1rem;
  font-size: 0.85rem;
  border-top: 1px solid var(--color-border, #e4e6eb);
}

/* 卡片样式 */
.card {
  background-color: var(--color-card, white);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  line-height: 1.6;
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-lg);
}

/* 功能模块 */
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.feature-item {
  background-color: var(--color-card, white);
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  text-align: center;
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease,
    background-color 0.2s ease;
}

.feature-item:hover {
  background-color: var(--color-card-hover, #f9fafb);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.feature-icon {
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
}

.feature-item h3 {
  color: var(--color-primary, #3b82f6);
  margin-bottom: 0.75rem;
}

/* 图标演示 */
.icon-demo {
  background-color: var(--color-card, white);
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
}

.icon-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  background-color: var(--color-background-tertiary, #f8f9fa);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.icon-item:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  background-color: var(--color-hover, rgba(59, 130, 246, 0.08));
}

.icon-item span {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--color-text-light, #8b95a3);
}

/* 状态模块 */
.electron-status,
.navigation {
  background-color: var(--color-card, white);
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
}

/* 按钮样式 */
button {
  background-color: var(--color-primary, #3b82f6);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  /* border-radius: 4px; */
  font-size: 1rem;
  cursor: pointer;
  /* margin-top: 1rem; */
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s;
  box-shadow: var(--shadow-sm);
}

button:hover {
  background-color: var(--color-primary-dark, #2563eb);
  box-shadow: var(--shadow-md);
}

.navigation button {
  background-color: var(--color-secondary, #1e2736);
}

.navigation button:hover {
  background-color: var(--color-secondary-light, #374151);
}

/* 欢迎页面包装器样式 */
.welcome-wrapper {
  flex: 1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background, #ffffff);
}
</style>
