<template>
  <div class="title-bar" :class="{ 'is-maximized': isMaximized }">
    <div class="title-bar-drag-area" @dblclick="maximizeWindow">
      <div class="app-icon">
        <img src="../assets/logo.svg" alt="App icon" width="16" height="16" />
      </div>
      <div class="title">{{ title }}</div>
    </div>
    <div class="window-controls">
      <button class="control-button minimize" @click="minimize" title="最小化">
        <Minus theme="filled" size="16" fill="currentColor" />
      </button>
      <button class="control-button maximize" @click="maximize" title="最大化">
        <FullScreen
          v-if="!isMaximized"
          theme="outline"
          size="16"
          fill="currentColor"
        />
        <OffScreen v-else theme="outline" size="16" fill="currentColor" />
      </button>
      <button class="control-button close" @click="close" title="关闭">
        <Close theme="filled" size="16" fill="currentColor" />
      </button>
    </div>
  </div>
</template>

<script setup>
// 导入 Vue 3 Composition API
import { ref, onMounted } from 'vue';

// 导入单独的图标，减小打包体积
import { Minus, FullScreen, OffScreen, Close } from '@icon-park/vue-next';

// 定义组件名称，用于开发工具 (可选)
defineOptions({
  name: 'TitleBar',
});

// 定义 props
const props = defineProps({
  title: {
    type: String,
    default: 'AI-Dou',
  },
});

// 定义响应式状态
const isMaximized = ref(false);

// 定义方法
const checkMaximized = async () => {
  if (window.electronAPI) {
    isMaximized.value = await window.electronAPI.isMaximized();
  }
};

const minimize = () => {
  if (window.electronAPI) {
    window.electronAPI.minimizeWindow();
  }
};

const maximize = () => {
  if (window.electronAPI) {
    window.electronAPI.maximizeWindow().then((maximized) => {
      isMaximized.value = maximized;
    });
  }
};

const maximizeWindow = () => {
  maximize();
};

const close = () => {
  if (window.electronAPI) {
    window.electronAPI.closeWindow();
  }
};

const toggleDevTools = () => {
  if (window.electronAPI) {
    window.electronAPI.toggleDevTools();
  }
};

// 生命周期钩子
onMounted(() => {
  // 检查窗口是否最大化
  checkMaximized();

  // 监听窗口最大化状态变化
  if (window.electronAPI) {
    window.electronAPI.onMaximizeChange((maximized) => {
      isMaximized.value = maximized;
    });
  }

  // 添加快捷键信息
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F12') {
      console.log('按下F12：开发者工具');
    }
  });
});
</script>

<style scoped>
.title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 32px;
  background-color: var(--color-background-secondary, #f1f5f9);
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  color: var(--color-text);
  user-select: none;
  -webkit-app-region: drag; /* 让整个标题栏可拖动 */
  position: relative;
  z-index: 9999;
}

.title-bar-drag-area {
  display: flex;
  align-items: center;
  flex: 1;
  height: 100%;
  padding-left: 10px;
  width: calc(100% - 138px); /* 减去三个按钮的宽度 */
  overflow: hidden;
}

.app-icon {
  margin-right: 8px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.title {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.window-controls {
  display: flex;
  height: 100%;
  -webkit-app-region: no-drag; /* 窗口控制按钮不可拖动 */
  position: absolute;
  top: 0;
  right: 0;
  z-index: 10000;
}

.control-button {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 46px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  transition: background-color 0.1s;
  outline: none;
}

.control-button:focus {
  outline: none;
}

.control-button.minimize:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.control-button.maximize:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.control-button.close:hover {
  background-color: #e81123;
}

/* 暗黑模式适配 */
.app.dark-mode .title-bar {
  background-color: var(--color-secondary, #252526);
}

/* 移除旧的样式 */
@media (prefers-color-scheme: dark) {
  .title-bar {
    background-color: var(--color-secondary, #334155);
  }
}

/* 移除不需要的macOS风格 */
</style>
