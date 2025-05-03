<template>
  <div class="page-container">
    <div class="page-layout">
      <!-- Sidebar section for Apps -->
      <!-- <div class="page-sidebar">
        <SidebarContent
          type="apps"
          :data="sidebarData"
          @select="handleSidebarSelect"
          @recent-select="handleRecentItemSelect"
        />
      </div> -->

      <!-- Main content -->
      <div class="page-content">
        <div class="top-actions-wrapper">
          <div class="top-actions">
            <div class="search-container">
              <input
                type="text"
                placeholder="搜索应用..."
                v-model="searchQuery"
                @input="filterApps"
              />
              <button class="btn-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3S3 5.91 3 9.5S5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14z"
                  />
                </svg>
              </button>
            </div>

            <div class="actions-right">
              <ViewOptions v-model="viewMode" />

              <button
                class="btn btn-primary"
                @click="showCreateAppModal = true"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
                  />
                </svg>
                新建应用
              </button>
            </div>
          </div>
        </div>

        <div class="content-sections">
          <div class="content-section">
            <div class="section-header">
              <h2>我的应用</h2>
            </div>

            <!-- Grid view -->
            <div v-if="viewMode === 'grid'" class="app-grid">
              <AppCard
                v-for="app in filteredApps"
                :key="app.id"
                :app="app"
                :selected="selectedAppId === app.id"
                @select="selectApp(app.id)"
                @run="runApp(app.id)"
                @configure="configureApp(app.id)"
                @menu="showAppMenu(app.id, $event)"
              />
            </div>

            <!-- List view -->
            <div v-else class="app-list">
              <AppCard
                v-for="app in filteredApps"
                :key="app.id"
                :app="app"
                mode="list"
                :selected="selectedAppId === app.id"
                @select="selectApp(app.id)"
                @run="runApp(app.id)"
                @configure="configureApp(app.id)"
                @menu="showAppMenu(app.id, $event)"
              />
            </div>
          </div>

          <div class="content-section">
            <div class="section-header">
              <h2>最近使用</h2>
            </div>

            <div class="recent-list">
              <div
                v-for="item in recentItems"
                :key="item.id"
                class="recent-item"
              >
                <div class="recent-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="#3b82f6"
                      d="M12 15.5a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7zm0-2a1.5 1.5 0 1 1 0-3a1.5 1.5 0 0 1 0 3z"
                    />
                    <path
                      fill="#3b82f6"
                      d="M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8s8-3.58 8-8s-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6s6 2.69 6 6s-2.69 6-6 6z"
                    />
                  </svg>
                </div>
                <div class="recent-info">
                  <h3>{{ item.name }}</h3>
                  <p>上次修改：{{ item.lastUpdated }}</p>
                </div>
                <div class="recent-actions">
                  <button class="btn btn-text" @click="openRecentItem(item.id)">
                    打开
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create App Modal -->
    <div
      v-if="showCreateAppModal"
      class="modal-overlay"
      @click="showCreateAppModal = false"
    >
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>创建新应用</h2>
          <button class="close-button" @click="showCreateAppModal = false">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41z"
              />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="app-name">应用名称</label>
            <input
              type="text"
              id="app-name"
              v-model="newApp.name"
              placeholder="输入应用名称"
            />
          </div>
          <div class="form-group">
            <label for="app-description">应用描述</label>
            <textarea
              id="app-description"
              v-model="newApp.description"
              placeholder="简要描述应用功能"
            ></textarea>
          </div>
          <div class="form-group">
            <label>应用类型</label>
            <div class="app-type-selection">
              <div
                v-for="type in appTypes"
                :key="type.id"
                class="app-type-option"
                :class="{ active: newApp.type === type.id }"
                @click="newApp.type = type.id"
              >
                <div class="app-type-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                  >
                    <path fill="currentColor" :d="type.iconPath" />
                  </svg>
                </div>
                <div class="app-type-label">{{ type.name }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showCreateAppModal = false">
            取消
          </button>
          <button class="btn btn-primary" @click="createNewApp">
            创建应用
          </button>
        </div>
      </div>
    </div>

    <!-- App context menu -->
    <div
      v-if="showAppContextMenu"
      class="context-menu"
      :style="contextMenuStyle"
    >
      <div class="context-menu-item" @click="duplicateApp">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5l-5-5l1.41-1.41L11 12.67V3h2v9.67z"
          />
        </svg>
        <span>复制应用</span>
      </div>
      <div class="context-menu-item" @click="exportApp">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5l-5-5l1.41-1.41L11 12.67V3h2v9.67z"
          />
        </svg>
        <span>导出应用</span>
      </div>
      <div class="context-menu-item danger" @click="showDeleteConfirm = true">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
          />
        </svg>
        <span>删除应用</span>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      class="modal-overlay"
      @click="showDeleteConfirm = false"
    >
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>确认删除</h2>
          <button class="close-button" @click="showDeleteConfirm = false">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41z"
              />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p>您确定要删除此应用吗？此操作无法撤销。</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showDeleteConfirm = false">
            取消
          </button>
          <button class="btn btn-danger" @click="deleteApp">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import SidebarContent from '../components/SidebarContent.vue';
import ViewOptions from '../components/ViewOptions.vue';
import AppCard from '@/components/AppCard.vue';

// 定义组件名称
defineOptions({
  name: 'AppsPage',
});

// State
const viewMode = ref('grid'); // 'grid' or 'list'
const searchQuery = ref('');
const showCreateAppModal = ref(false);
const showDeleteConfirm = ref(false);
const showAppContextMenu = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const contextMenuAppId = ref(null);
const selectedAppId = ref(null);

// Sample data (replace with actual API calls in production)
const apps = ref([
  {
    id: '1',
    name: '智能客服助手',
    description:
      '基于大语言模型的智能客服系统，可以自动回答用户问题并处理常见请求',
    type: 'web',
    icon: 'robot',
    createdAt: new Date('2023-05-10').toISOString(),
    lastAccessed: new Date('2023-09-28').toISOString(),
  },
  {
    id: '2',
    name: '内容生成器',
    description: '自动生成营销文案、产品描述和社交媒体内容的AI工具',
    type: 'web',
    icon: 'document',
    createdAt: new Date('2023-06-15').toISOString(),
    lastAccessed: new Date('2023-09-25').toISOString(),
  },
  {
    id: '3',
    name: '数据分析助手',
    description: '使用自然语言处理分析业务数据，生成见解和可视化报告',
    type: 'api',
    icon: 'chart',
    createdAt: new Date('2023-04-20').toISOString(),
    lastAccessed: new Date('2023-09-20').toISOString(),
  },
  {
    id: '4',
    name: '图像生成器',
    description: '基于文本描述生成高质量图像的AI工具',
    type: 'desktop',
    icon: 'image',
    createdAt: new Date('2023-07-05').toISOString(),
    lastAccessed: new Date('2023-09-15').toISOString(),
  },
  {
    id: '5',
    name: '文档摘要工具',
    description: '自动提取长文档的关键信息并生成摘要',
    type: 'web',
    icon: 'file',
    createdAt: new Date('2023-08-10').toISOString(),
    lastAccessed: new Date('2023-09-10').toISOString(),
  },
]);

// New app template
const newApp = ref({
  name: '',
  description: '',
  type: 'web',
});

// Computed properties
const filteredApps = computed(() => {
  if (!searchQuery.value) return apps.value;

  const query = searchQuery.value.toLowerCase();
  return apps.value.filter(
    (app) =>
      app.name.toLowerCase().includes(query) ||
      app.description.toLowerCase().includes(query)
  );
});

const recentItems = computed(() => {
  return [...apps.value]
    .sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed))
    .slice(0, 3);
});

const sidebarData = computed(() => {
  return apps.value.map((app) => ({
    id: app.id,
    name: app.name,
    icon: app.icon,
  }));
});

// Computed property for context menu positioning
const contextMenuStyle = computed(() => {
  return {
    left: `${contextMenuPosition.value.x}px`,
    top: `${contextMenuPosition.value.y}px`,
  };
});

// App types for the create app modal
const appTypes = [
  {
    id: 'web',
    name: '网页应用',
    iconPath:
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93c0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41c0 2.08-.8 3.97-2.1 5.39z',
  },
  {
    id: 'api',
    name: 'API服务',
    iconPath:
      'M16 7V3h-2v4h-2V3H8v4H6v4h2v10h8V11h2V7h-2zM8.5 15c-.28 0-.5-.22-.5-.5s.22-.5.5-.5s.5.22.5.5s-.22.5-.5.5zm7 0c-.28 0-.5-.22-.5-.5s.22-.5.5-.5s.5.22.5.5s-.22.5-.5.5zM11 11V7h2v4h-2z',
  },
  {
    id: 'desktop',
    name: '桌面应用',
    iconPath:
      'M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z',
  },
  {
    id: 'mobile',
    name: '移动应用',
    iconPath:
      'M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z',
  },
];

// Methods
const selectApp = (appId) => {
  selectedAppId.value = appId;
};

const handleSidebarSelect = (id) => {
  selectedAppId.value = id;
};

const handleRecentItemSelect = (item) => {
  console.log('Recent item selected:', item);
  openRecentItem(item.id);
};

const handleContextMenu = (appId, event) => {
  showAppMenu(appId, event);
};

const configureApp = (appId) => {
  console.log('Configure app:', appId);
  // Navigate to app configuration page
};

const runApp = (appId) => {
  console.log('Run app:', appId);
  // Handle app launch logic

  // Update last accessed timestamp
  const app = getAppById(appId);
  if (app) {
    app.lastAccessed = new Date().toISOString();
  }
};

const showAppMenu = (appId, event) => {
  event.preventDefault();
  contextMenuAppId.value = appId;
  showAppContextMenu.value = true;
  contextMenuPosition.value = {
    x: event.clientX,
    y: event.clientY,
  };

  // Click outside to close context menu
  const closeMenu = () => {
    showAppContextMenu.value = false;
    document.removeEventListener('click', closeMenu);
  };
  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 0);
};

const createNewApp = () => {
  const id = Math.random().toString(36).substring(2, 9);
  const app = {
    id,
    ...newApp.value,
    icon: getIconForType(newApp.value.type),
    createdAt: new Date().toISOString(),
    lastAccessed: new Date().toISOString(),
  };

  apps.value.unshift(app);
  showCreateAppModal.value = false;
  selectedAppId.value = id;

  // Reset new app form
  newApp.value = {
    name: '',
    description: '',
    type: 'web',
  };
};

const duplicateApp = () => {
  const originalApp = getAppById(contextMenuAppId.value);
  if (!originalApp) return;

  const newAppCopy = {
    ...JSON.parse(JSON.stringify(originalApp)),
    id: Math.random().toString(36).substring(2, 9),
    name: `${originalApp.name} (复制)`,
    createdAt: new Date().toISOString(),
    lastAccessed: new Date().toISOString(),
  };

  apps.value.unshift(newAppCopy);
  showAppContextMenu.value = false;
};

const exportApp = () => {
  const app = getAppById(contextMenuAppId.value);
  if (!app) return;

  // Export app logic (in real app, would generate and download config file)
  console.log('Exporting app:', app);

  const dataStr =
    'data:text/json;charset=utf-8,' +
    encodeURIComponent(JSON.stringify(app, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute('href', dataStr);
  downloadAnchorNode.setAttribute('download', app.name + '.json');
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();

  showAppContextMenu.value = false;
};

const openRecentItem = (itemId) => {
  console.log('Opening recent item:', itemId);
  // Find the app containing this item
  const app = apps.value.find((app) => app.id === itemId);
  if (app) {
    selectedAppId.value = app.id;
    // In a real app, you might open specific item details
  }
};

const promptDeleteApp = () => {
  showAppContextMenu.value = false;
  showDeleteConfirm.value = true;
};

const deleteApp = () => {
  apps.value = apps.value.filter((app) => app.id !== contextMenuAppId.value);
  showDeleteConfirm.value = false;

  if (selectedAppId.value === contextMenuAppId.value) {
    selectedAppId.value = null;
  }
};

const getAppById = (id) => {
  return apps.value.find((app) => app.id === id);
};

const getIconForType = (type) => {
  switch (type) {
    case 'web':
      return 'globe';
    case 'api':
      return 'plug';
    case 'desktop':
      return 'computer';
    default:
      return 'app';
  }
};

// Lifecycle hooks
onMounted(() => {
  // In a real app, you would fetch apps from an API here
});
</script>

<style scoped>
.page-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  --color-text: #374151;
  --color-text-light: #6b7280;
  --color-text-strong: #111827;
  --color-primary: #2563eb;
  --color-hover: #f3f4f6;
  --color-active: #eff6ff;
  --color-border: #e5e7eb;
}

.page-layout {
  display: flex;
  height: 100%;
}

/* Sidebar Styles */
.page-sidebar {
  width: 240px;
  background-color: #ffffff;
  color: var(--color-text);
  height: 100%;
  border-right: 1px solid var(--color-border);
  overflow: hidden;
  box-shadow: 1px 0 3px rgba(0, 0, 0, 0.05);
}

/* Main Content Area */
.page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.top-actions-wrapper {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #f9fafb;
  padding: 16px 16px 0 16px;
}

/* Top Actions Styles */
.top-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.content-sections {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px 16px;
  scroll-behavior: smooth;
}

.content-section {
  margin-top: 24px;
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  margin-bottom: 16px;
}

.section-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-text-strong);
}

.recent-list {
  margin-bottom: 32px;
}

.recent-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid var(--color-border);
}

.recent-icon {
  margin-right: 12px;
}

.recent-info {
  flex: 1;
}

.recent-info h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-strong);
}

.recent-info p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-light);
}

.recent-actions {
  display: flex;
  gap: 8px;
}

.btn-text {
  padding: 8px 12px;
  background-color: white;
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-text:hover {
  background-color: var(--color-hover);
}

/* App Grid Layout */
.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

/* App List Layout */
.app-list {
  margin-bottom: 24px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}

.no-results {
  padding: 40px;
  text-align: center;
  color: var(--color-text-light);
  background: white;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

/* Button Styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn svg {
  margin-right: 8px;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: #1d4ed8;
}

.btn-secondary {
  background-color: white;
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background-color: var(--color-hover);
  border-color: #9ca3af;
}

.btn-danger {
  background-color: #dc2626;
  color: white;
  border: none;
}

.btn-danger:hover {
  background-color: #b91c1c;
}

.btn-icon {
  margin-right: 8px;
  font-size: 1.1rem;
}

/* Context Menu */
.context-menu {
  position: fixed;
  z-index: 1000;
  width: 180px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  color: var(--color-text);
}

.context-menu-item:hover {
  background-color: var(--color-hover);
}

.context-menu-item.danger {
  color: #dc2626;
}

.context-menu-item.danger:hover {
  background-color: #fee2e2;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  width: 500px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-text-strong);
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-light);
}

.modal-body {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--color-text);
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.95rem;
  transition: border-color 0.15s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.search-container {
  position: relative;
  width: 300px;
}

.search-container input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.95rem;
  transition: border-color 0.15s;
  color: var(--color-text);
}

.search-container input:focus {
  border-color: var(--color-primary);
  outline: none;
}

.search-container .btn-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 0;
  color: var(--color-text-light);
  cursor: default;
}

.actions-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
</style>
