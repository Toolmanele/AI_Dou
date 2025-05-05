import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 导入 IconPark 样式，必须保留
import '@icon-park/vue-next/styles/index.css'

// 导入通用组件
import CommonComponents from './components/common'

// 导入存储
// import { useThemeStore } from "./stores/theme";
import { useSettingsStore } from './stores/settings'

// 导入电子存储服务
import electronStore from './services/electronStore'

// 创建 Pinia 实例
const pinia = createPinia()

// 创建应用实例
const app = createApp(App)

// 使用 Pinia
app.use(pinia)

// 注册通用组件
app.use(CommonComponents)

// 挂载应用前，确保主题系统和数据存储初始化完成
const initialize = async () => {
  try {
    // 首先初始化 Pinia
    // const themeStore = useThemeStore();
    const settingsStore = useSettingsStore()

    // 初始化数据存储
    await electronStore.initializeStorage()
    console.log('数据存储初始化完成，开发模式:', electronStore.isDevelopmentMode)

    // 初始化设置
    await settingsStore.initializeSettings()
    console.log('设置初始化完成')

    // 初始化主题
    // await themeStore.initialize();
    console.log('主题系统初始化完成')
  } catch (error) {
    console.error('应用初始化失败:', error)
    // 错误处理 - 继续挂载应用
  }

  // 挂载应用
  app.mount('#app')
}

// 启动
initialize()
