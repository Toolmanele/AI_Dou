<template>
  <div class="sidebar-content-wrapper">
    <!-- Apps sidebar -->
    <div v-if="type === 'apps'" class="sidebar-section">
      <!-- Add toolbar with creation buttons -->
      <div class="sidebar-toolbar">
        <div class="toolbar-title">应用</div>
        <div class="toolbar-actions">
          <button
            class="toolbar-btn"
            title="创建新文件夹"
            @click="handleCreateFolder"
          >
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
              <path fill="currentColor" d="M13 9h3v3h2v-3h3v-2h-3V4h-2v3h-3z" />
            </svg>
          </button>
          <button
            class="toolbar-btn"
            title="创建新应用"
            @click="handleCreateApp"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
              />
            </svg>
          </button>
        </div>
      </div>

      <div class="section-content">
        <FolderTree
          :data="appsTreeData"
          :allow-drag="true"
          :allow-rename="true"
          @node-select="handleNodeSelect"
          @node-rename="handleNodeRename"
          @node-drag="handleNodeDrag"
          @update:data="handleTreeDataUpdate"
        />
      </div>
      <div class="section-header mt-2">
        <span>最近使用</span>
      </div>
      <div class="section-content">
        <div
          v-for="(item, index) in recentItems"
          :key="index"
          class="tree-item sub-item"
          @click="selectRecentItem(item.id)"
        >
          <span>{{ item.name }}</span>
        </div>
      </div>
    </div>

    <!-- Models sidebar -->
    <div v-if="type === 'models'" class="sidebar-section">
      <!-- Add toolbar with creation buttons -->
      <div class="sidebar-toolbar">
        <div class="toolbar-title">模型</div>
        <div class="toolbar-actions">
          <button
            class="toolbar-btn"
            title="创建新文件夹"
            @click="handleCreateFolder"
          >
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
              <path fill="currentColor" d="M13 9h3v3h2v-3h3v-2h-3V4h-2v3h-3z" />
            </svg>
          </button>
          <button
            class="toolbar-btn"
            title="创建新模型"
            @click="handleCreateModel"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
              />
            </svg>
          </button>
        </div>
      </div>

      <div class="section-content">
        <FolderTree
          :data="modelsTreeData"
          :allow-drag="true"
          :allow-rename="true"
          @node-select="handleNodeSelect"
          @node-rename="handleNodeRename"
          @node-drag="handleNodeDrag"
          @update:data="handleTreeDataUpdate"
        />
      </div>
    </div>

    <!-- Settings sidebar -->
    <div v-if="type === 'settings'" class="sidebar-section">
      <!-- Add toolbar with creation buttons -->
      <div class="sidebar-toolbar">
        <div class="toolbar-title">设置</div>
        <div class="toolbar-actions">
          <button
            class="toolbar-btn"
            title="创建新文件夹"
            @click="handleCreateFolder"
          >
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
              <path fill="currentColor" d="M13 9h3v3h2v-3h3v-2h-3V4h-2v3h-3z" />
            </svg>
          </button>
          <button
            class="toolbar-btn"
            title="创建新设置"
            @click="handleCreateSetting"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
              />
            </svg>
          </button>
        </div>
      </div>

      <div class="section-content">
        <FolderTree
          :data="settingsTreeData"
          :allow-drag="true"
          :allow-rename="true"
          @node-select="handleNodeSelect"
          @node-rename="handleNodeRename"
          @node-drag="handleNodeDrag"
          @update:data="handleTreeDataUpdate"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  defineProps,
  defineEmits,
  onMounted,
  computed,
  markRaw,
} from 'vue';
import { FolderOpen, Box, Api, Setting } from '@icon-park/vue-next';
import FolderTree from './FolderTree.vue';

// 使用markRaw处理所有图标组件
const folderOpenIcon = markRaw(FolderOpen);
const environmentIcon = markRaw(Box);
const apiIcon = markRaw(Api);
const settingIcon = markRaw(Setting);

// 定义组件名称
defineOptions({
  name: 'SidebarContent',
});

// 定义属性
const props = defineProps({
  // 侧边栏类型：apps, environments, models, settings
  type: {
    type: String,
    required: true,
    default: 'apps',
  },
  // 预加载数据
  data: {
    type: Object,
    default: () => ({}),
  },
});

// 定义事件
const emit = defineEmits([
  'select',
  'recent-select',
  'create-folder',
  'create-item',
]);

// 默认数据
const apps = ref([
  { id: 'chatbot', name: '智能对话助手' },
  { id: 'translator', name: '翻译工具' },
  { id: 'summarizer', name: '内容摘要器' },
]);

const recentItems = ref([
  { id: 'chatbot', name: '智能对话助手' },
  { id: 'dev', name: '开发环境' },
]);

const models = ref([
  { id: 'gpt4', name: 'GPT-4' },
  { id: 'claude3', name: 'Claude 3' },
  { id: 'dalle3', name: 'DALL-E 3' },
]);

const modelSettings = ref([
  { id: 'inference', name: '推理设置' },
  { id: 'performance', name: '性能监控' },
]);

const userSettings = ref([
  { id: 'account', name: '账户信息' },
  { id: 'security', name: '安全设置' },
  { id: 'interface', name: '界面设置' },
  { id: 'notifications', name: '通知设置' },
]);

// 选中的项目
const selectedApp = ref('chatbot');
const selectedModel = ref('gpt4');
const selectedSetting = ref('account');

// 转换为树结构数据
const appsTreeData = computed(() => {
  return {
    id: 'apps-root',
    name: '我的应用',
    type: 'folder',
    expanded: true,
    children: [
      ...apps.value.map((app) => ({
        id: app.id,
        name: app.name,
        type: 'file',
      })),
      {
        id: 'samples-folder',
        name: '示例应用',
        type: 'folder',
        expanded: false,
        children: [
          { id: 'sample1', name: '文本生成示例', type: 'file' },
          { id: 'sample2', name: '图片生成示例', type: 'file' },
        ],
      },
    ],
  };
});

const modelsTreeData = computed(() => {
  return {
    id: 'models-root',
    name: '已部署模型',
    type: 'folder',
    expanded: true,
    children: [
      ...models.value.map((model) => ({
        id: model.id,
        name: model.name,
        type: 'file',
      })),
      {
        id: 'model-settings',
        name: '模型设置',
        type: 'folder',
        expanded: true,
        children: modelSettings.value.map((setting) => ({
          id: setting.id,
          name: setting.name,
          type: 'file',
        })),
      },
    ],
  };
});

const settingsTreeData = computed(() => {
  return {
    id: 'settings-root',
    name: '设置目录',
    type: 'folder',
    expanded: true,
    children: userSettings.value.map((setting) => ({
      id: setting.id,
      name: setting.name,
      type: 'file',
    })),
  };
});

// 选择事件处理
const selectApp = (id) => {
  selectedApp.value = id;
  emit('select', { type: 'app', id });
};

const selectRecentItem = (id) => {
  emit('recent-select', { id });
};

const selectModel = (id) => {
  selectedModel.value = id;
  emit('select', { type: 'model', id });
};

const selectModelSetting = (id) => {
  emit('select', { type: 'model-setting', id });
};

const selectSetting = (id) => {
  selectedSetting.value = id;
  emit('select', { type: 'setting', id });
};

// 树节点事件处理
const handleNodeSelect = (node) => {
  if (node.type === 'file') {
    switch (props.type) {
      case 'apps':
        selectApp(node.id);
        break;
      case 'models':
        if (models.value.some((model) => model.id === node.id)) {
          selectModel(node.id);
        } else {
          selectModelSetting(node.id);
        }
        break;
      case 'settings':
        selectSetting(node.id);
        break;
    }
  }
};

const handleNodeRename = (payload) => {
  const { id, name } = payload;

  // 根据当前侧边栏类型更新对应数据
  if (props.type === 'apps') {
    const app = apps.value.find((a) => a.id === id);
    if (app) app.name = name;
  } else if (props.type === 'models') {
    const model = models.value.find((m) => m.id === id);
    if (model) model.name = name;

    const setting = modelSettings.value.find((s) => s.id === id);
    if (setting) setting.name = name;
  } else if (props.type === 'settings') {
    const setting = userSettings.value.find((s) => s.id === id);
    if (setting) setting.name = name;
  }

  console.log(`Renamed node ${id} to ${name}`);
};

// 处理拖拽事件
const handleNodeDrag = (payload) => {
  console.log('Node dragged:', payload);
};

// 处理树数据更新
const handleTreeDataUpdate = (newData) => {
  // 将树结构数据转换回扁平结构并更新状态
  // 由于这是复杂操作，实际应用中需要根据具体层级结构进行解析
  console.log('Tree data updated:', newData);
};

// Toolbar button handlers
const handleCreateFolder = () => {
  // Generate a unique ID for the new folder
  const folderId = `folder_${Date.now()}`;

  // Emit event for parent component to handle folder creation
  emit('create-folder', {
    id: folderId,
    name: '新文件夹',
    type: props.type,
  });

  // Add folder to the tree directly as well
  const addFolderToTree = (treeData) => {
    // Add the folder as a child of the root
    if (!treeData.children) {
      treeData.children = [];
    }

    treeData.children.push({
      id: folderId,
      name: '新文件夹',
      type: 'folder',
      expanded: true,
      children: [],
    });

    return { ...treeData };
  };

  // Update the appropriate tree based on the current sidebar type
  switch (props.type) {
    case 'apps':
      // This will trigger the computed property to update
      apps.value = [...apps.value];
      break;
    case 'models':
      models.value = [...models.value];
      break;
    case 'settings':
      userSettings.value = [...userSettings.value];
      break;
  }
};

const handleCreateApp = () => {
  const appId = `app_${Date.now()}`;
  const newApp = { id: appId, name: '新应用', type: 'file' };

  // Add app to the apps array
  apps.value = [newApp, ...apps.value];

  // Emit event for parent component
  emit('create-item', {
    id: appId,
    name: '新应用',
    type: 'app',
  });

  // Select the new app
  selectApp(appId);
};

const handleCreateModel = () => {
  const modelId = `model_${Date.now()}`;
  const newModel = { id: modelId, name: '新模型', type: 'file' };

  // Add to models array
  models.value = [newModel, ...models.value];

  // Emit event for parent component
  emit('create-item', {
    id: modelId,
    name: '新模型',
    type: 'model',
  });

  // Select the new model
  selectModel(modelId);
};

const handleCreateSetting = () => {
  const settingId = `setting_${Date.now()}`;
  const newSetting = { id: settingId, name: '新设置', type: 'file' };

  // Add to settings array
  userSettings.value = [newSetting, ...userSettings.value];

  // Emit event for parent component
  emit('create-item', {
    id: settingId,
    name: '新设置',
    type: 'setting',
  });

  // Select the new setting
  selectSetting(settingId);
};

// 组件挂载时用外部数据覆盖默认数据
onMounted(() => {
  if (props.data) {
    if (props.type === 'apps' && props.data.apps) {
      apps.value = props.data.apps;
      if (props.data.recentItems) {
        recentItems.value = props.data.recentItems;
      }
      if (props.data.selectedApp) {
        selectedApp.value = props.data.selectedApp;
      }
    } else if (props.type === 'models' && props.data.models) {
      models.value = props.data.models;
      if (props.data.modelSettings) {
        modelSettings.value = props.data.modelSettings;
      }
      if (props.data.selectedModel) {
        selectedModel.value = props.data.selectedModel;
      }
    } else if (props.type === 'settings' && props.data.userSettings) {
      userSettings.value = props.data.userSettings;
      if (props.data.selectedSetting) {
        selectedSetting.value = props.data.selectedSetting;
      }
    }
  }
});
</script>

<style scoped>
.sidebar-content-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.sidebar-section {
  padding: 0 0 8px 0;
}

/* Toolbar styles */
.sidebar-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 16px;
  height: 32px;
  background-color: rgba(0, 0, 0, 0.03);
  border-bottom: 1px solid var(--color-border);
}

.toolbar-title {
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: 0.5px;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--color-text-light);
  cursor: pointer;
  transition: all 0.2s ease;
}

.toolbar-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--color-text-strong);
}

.toolbar-btn svg {
  opacity: 0.8;
}

.toolbar-btn:hover svg {
  opacity: 1;
}

/* Other styles */
.section-header {
  padding: 8px 16px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
  color: var(--color-text-light);
}

.section-content {
  padding: 4px 0;
}

/* Style customizations for FolderTree in sidebar */
.section-content :deep(.folder-tree) {
  border: none;
  padding: 0;
  background-color: transparent;
}

.section-content :deep(.tree-node .node-content) {
  padding: 4px 8px 4px 16px;
}

.section-content :deep(.tree-node.selected > .node-content) {
  background-color: var(--color-active);
  color: var(--color-primary);
  border-left: 2px solid var(--color-primary);
}

.section-content :deep(.tree-node .node-content:hover) {
  background-color: var(--color-hover);
}

.tree-item {
  padding: 6px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  cursor: pointer;
  color: var(--color-text);
  border-left: 2px solid transparent;
  transition: all 0.2s ease;
}

.tree-item:hover {
  background-color: var(--color-hover);
  color: var(--color-text-strong);
}

.tree-item.active {
  background-color: var(--color-active);
  color: var(--color-primary);
  border-left: 2px solid var(--color-primary);
}

.sub-item {
  padding-left: 36px;
  font-size: 12px;
}

.mt-2 {
  margin-top: 16px;
}
</style>
