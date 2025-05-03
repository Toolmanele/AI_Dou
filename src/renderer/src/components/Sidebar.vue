<template>
  <div class="sidebar">
    <div class="sidebar-icons">
      <div
        v-for="(item, index) in menuItems"
        :key="index"
        class="sidebar-icon"
        :class="{ active: activeItem === item.id }"
        @click="selectMenuItem(item.id)"
        :title="item.title"
      >
        <component
          :is="item.icon"
          theme="outline"
          size="24"
          fill="currentColor"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, markRaw } from "vue";
import {
  ApplicationTwo,
  Box,
  Api,
  Setting,
  FolderOpen,
  ArrowLeft,
  ArrowRight,
} from "@icon-park/vue-next";

// 定义组件名称
defineOptions({
  name: "Sidebar",
});

// 定义要发出的事件
const emit = defineEmits(["menu-change"]);

// 使用markRaw处理所有图标组件
const folderOpenIcon = markRaw(FolderOpen);
const chevronLeftIcon = markRaw(ArrowLeft);
const environmentIcon = markRaw(Box);
const apiIcon = markRaw(Api);
const settingIcon = markRaw(Setting);

// 侧边栏菜单项 - 使用markRaw处理图标组件
const menuItems = ref([
  { id: "apps", title: "应用管理", icon: markRaw(ApplicationTwo) },
  // { id: "ArrowRight", title: "种子模板", icon: markRaw(ArrowRight) },
  { id: "models", title: "模型管理", icon: markRaw(Api) },
  { id: "settings", title: "设置", icon: markRaw(Setting) },
]);

// 当前激活的菜单项
const activeItem = ref("apps");
const isCollapsed = ref(false);

// 计算当前激活菜单项的标题
const activeItemTitle = computed(() => {
  const item = menuItems.value.find((item) => item.id === activeItem.value);
  return item ? item.title : "";
});

// 方法
const selectMenuItem = (id) => {
  if (isCollapsed.value) {
    isCollapsed.value = false;
  }
  activeItem.value = id;

  // 发出菜单变更事件，将当前激活的菜单ID传递给父组件
  emit("menu-change", id);
};

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};
</script>

<style scoped>
.sidebar {
  display: flex;
  height: 100vh;
  background-color: var(--color-background, #f9fafc);
  border-right: 1px solid var(--color-border, #e2e8f0);
  transition: width 0.3s;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
  width: 48px;
}

.sidebar-icons {
  width: 48px;
  height: 100%;
  background-color: var(--color-background-secondary, #f1f5f9);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 10px;
}

.sidebar-icon {
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--color-text-light, #64748b);
  cursor: pointer;
  position: relative;
  margin-bottom: 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.sidebar-icon:hover {
  color: var(--text-color);
  background-color: rgba(255, 255, 255, 0.1);
}

.sidebar-icon.active {
  color: var(--text-color);
  background-color: rgba(255, 255, 255, 0.15);
}

.sidebar-icon.active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  background-color: var(--color-primary, #4c6ef5);
  border-radius: 0 3px 3px 0;
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--color-background-secondary, #f1f5f9);
}

.sidebar-header {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  background-color: var(--color-background-secondary, #f1f5f9);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-strong, #1e293b);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.collapse-button {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  color: var(--color-text-light, #64748b);
}

.collapse-button:hover {
  background-color: var(--color-border, rgba(0, 0, 0, 0.05));
  color: var(--color-text-strong, #1e293b);
}

.sidebar-body {
  flex: 1;
  overflow-y: auto;
}

.sidebar-section {
  padding: 8px 0;
}

.section-header {
  padding: 8px 16px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
  color: var(--color-text-light, #64748b);
}

.section-content {
  padding: 4px 0;
}

.tree-item {
  padding: 6px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  cursor: pointer;
  color: var(--color-text, #334155);
  border-left: 2px solid transparent;
  transition: all 0.2s ease;
}

.tree-item:hover {
  background-color: var(--color-hover, rgba(76, 110, 245, 0.08));
  color: var(--color-text-strong, #1e293b);
}

.tree-item.active {
  background-color: var(--color-active, rgba(76, 110, 245, 0.12));
  color: var(--color-primary, #4c6ef5);
  border-left: 2px solid var(--color-primary, #4c6ef5);
}

.sub-item {
  padding-left: 36px;
  font-size: 12px;
}

.search-box {
  padding: 0 16px;
  margin: 8px 0;
  display: flex;
}

.search-box input {
  flex: 1;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 4px 0 0 4px;
  padding: 6px 10px;
  font-size: 13px;
  background-color: var(--color-background, #f9fafc);
  color: var(--color-text, #334155);
}

.search-box input:focus {
  outline: none;
  border-color: var(--color-primary, #4c6ef5);
}

.search-box button {
  border: 1px solid var(--color-border, #e2e8f0);
  border-left: none;
  background-color: var(--color-background, #f9fafc);
  border-radius: 0 4px 4px 0;
  padding: 0 10px;
  cursor: pointer;
  color: var(--color-text-light, #64748b);
  transition: all 0.2s ease;
}

.search-box button:hover {
  background-color: var(--color-hover, rgba(76, 110, 245, 0.08));
  color: var(--color-primary, #4c6ef5);
}

/* 暗黑模式适配 */
.app.dark-mode .sidebar {
  background-color: var(--color-background, #1e1e1e);
  border-color: var(--color-border, #2d2d2d);
  box-shadow: none;
}

.app.dark-mode .sidebar-icons {
  background-color: var(--color-secondary, #252526);
}

.app.dark-mode .sidebar-content {
  background-color: var(--color-background-secondary, #252526);
}

.app.dark-mode .sidebar-header {
  background-color: var(--color-background-secondary, #252526);
  border-color: var(--color-border, #2d2d2d);
}

.app.dark-mode .sidebar-header h3 {
  color: var(--color-text-strong, #e0e0e0);
}

.app.dark-mode .section-header {
  color: var(--color-text-light, #8b95a3);
}

.app.dark-mode .tree-item {
  color: var(--color-text, #cccccc);
}

.app.dark-mode .tree-item:hover {
  background-color: var(--color-hover, rgba(76, 110, 245, 0.1));
  color: var(--color-text-strong, #ffffff);
}

.app.dark-mode .search-box input {
  background-color: var(--color-background, #3c3c3c);
  border-color: var(--color-border, #3c3c3c);
  color: var(--color-text, #cccccc);
}

.app.dark-mode .search-box button {
  background-color: var(--color-background, #3c3c3c);
  border-color: var(--color-border, #3c3c3c);
}

/* 增加间距工具类 */
.mt-2 {
  margin-top: 16px;
}
</style>
