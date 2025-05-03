<script setup>
import { ref, computed, onMounted, watch } from "vue";
import AppItem from "./AppItem.vue";
// import AppCreateModal from "./appcreatemodal/AppCreateModalRefactored.vue";
import AppCreateModal from "./appcreatemodalplus/AppCreateModalPlus.vue";
import AppConfigModal from "./appcreatemodalplus/AppConfigModal.vue";
import electronStore from "../../services/electronStore";

const props = defineProps({
  apps: {
    type: Array,
    required: true,
  },
  searchQuery: {
    type: String,
    required: true,
  },
  selectedTags: {
    type: Array,
    required: true,
  },
  filterMode: {
    type: String,
    required: true,
  },
  sortBy: {
    type: String,
    required: true,
  },
  sortDirection: {
    type: String,
    required: true,
  },
});

const emit = defineEmits([
  "open-app",
  "open-config",
  "delete-app",
  "clone-app",
  "add-tag-to-filter",
  "update-apps",
]);

// 本地应用列表数据
const localApps = ref([]);

// 监听props.apps的变化，同步到本地
watch(
  () => props.apps,
  (newApps) => {
    console.log("Apps prop updated:", newApps?.length);
    localApps.value = [...newApps];
  },
  { deep: true }
);

// For tracking expanded cards
const expandedCards = ref({});
const toggleExpand = (appId) => {
  expandedCards.value[appId] = !expandedCards.value[appId];
};

// For app actions dropdown
const activeDropdownId = ref(null);
const toggleDropdown = (appId, event) => {
  event.stopPropagation();
  activeDropdownId.value = activeDropdownId.value === appId ? null : appId;
};

const closeDropdowns = () => {
  activeDropdownId.value = null;
};

// Filtered and sorted apps based on props
const filteredAndSortedApps = computed(() => {
  // 使用本地应用列表
  let result = localApps.value.filter(
    (app) =>
      app.name.toLowerCase().includes(props.searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(props.searchQuery.toLowerCase())
  );

  // Then filter by tags
  if (!props.selectedTags.includes("All")) {
    if (props.filterMode === "any") {
      // Show apps that have ANY of the selected tags (OR logic)
      result = result.filter((app) =>
        app.tags.some((tag) => props.selectedTags.includes(tag))
      );
    } else {
      // Show apps that have ALL of the selected tags (AND logic)
      result = result.filter((app) =>
        props.selectedTags.every((tag) => app.tags.includes(tag))
      );
    }
  }

  // Then sort
  result.sort((a, b) => {
    let valueA = a[props.sortBy];
    let valueB = b[props.sortBy];

    // For dates, convert to timestamps for comparison
    if (props.sortBy === "createdAt" || props.sortBy === "lastUsedAt") {
      valueA = new Date(valueA).getTime();
      valueB = new Date(valueB).getTime();
    }

    if (props.sortDirection === "asc") {
      return valueA > valueB ? 1 : -1;
    } else {
      return valueA < valueB ? 1 : -1;
    }
  });

  return result;
});

// Handler methods that forward events to parent
const handleOpenApp = (app, event) => {
  emit("open-app", app, event);
};

const handleOpenConfig = (app, event) => {
  emit("open-config", app, event);
  closeDropdowns();
};

const handleDeleteApp = async (app, event) => {
  if (confirm(`确定要删除应用 "${app.name}" 吗？`)) {
    try {
      // 使用electronStore服务删除应用
      await electronStore.deleteApp(app.id);

      // 从本地列表中移除
      const index = localApps.value.findIndex((a) => a.id == app.id);
      if (index !== -1) {
        localApps.value.splice(index, 1);
        // 通知父组件更新
        emit("update-apps", localApps.value);
      }
    } catch (error) {
      console.error("删除应用失败:", error);
    }
  }
};

const handleCloneApp = (app, event) => {
  emit("clone-app", app, event);
};

const handleAddTagToFilter = (tag, event) => {
  emit("add-tag-to-filter", tag, event);
};

// 应用列表
const showCreateModal = ref(false);
const showConfigModal = ref(false);
const currentEditApp = ref(null);

// 初始化时同步props到本地数据
onMounted(async () => {
  // 初始化electronStore
  await electronStore.initializeStorage();

  // 初始化本地应用列表
  if (props.apps && props.apps.length > 0) {
    localApps.value = [...props.apps];
  } else {
    await loadApps();
  }
});

// 从 electronStore 加载应用数据
async function loadApps() {
  try {
    const loadedApps = await electronStore.getApps();
    if (Array.isArray(loadedApps) && loadedApps.length > 0) {
      localApps.value = loadedApps;
      // 通知父组件更新应用列表
      emit("update-apps", localApps.value);
      console.log("成功加载了", loadedApps.length, "个应用");
    } else {
      console.log("无应用配置或应用列表为空");

      // 如果是开发模式且没有应用，尝试从示例数据创建一些
      // if (electronStore.isDevelopmentMode) {
      //   createSampleApps();
      // }
    }
  } catch (error) {
    console.error("加载应用列表失败:", error);
  }
}

// 创建示例应用
async function createSampleApps() {
  try {
    // 示例数据
    localApps.value = [
      {
        id: Date.now(),
        name: "示例应用",
        description: "这是一个示例应用",
        tags: ["文本生成", "聊天机器人"],
        pythonInfo: {
          version: "3.11",
          installCommands: ["pip install -r requirements.txt"],
          startCommand: "python main.py",
        },
        modelInfo: {
          type: "auto-import",
          modelFolders: ["/path/to/models"],
          hasApiKey: false,
        },
        createdAt: new Date().toISOString().split("T")[0],
        lastUsedAt: new Date().toISOString().split("T")[0],
        icon: "💡",
        status: "completed",
        setupProgress: 100,
      },
    ];

    // 保存到电子存储
    await electronStore.saveApps(localApps.value);

    // 通知父组件更新应用列表
    emit("update-apps", localApps.value);

    console.log("已创建示例应用");
  } catch (error) {
    console.error("创建示例应用失败:", error);
  }
}

// 运行应用
async function runApp(app) {
  try {
    console.log("app", app);
    if (!app.pythonEnvironments?.length) return;
    // 直接使用window.electronAPI.runApp，因为这个还是特殊的功能
    console.log(
      "window.electronAPI.runAppCommand",
      window.electronAPI.runAppCommand
    );
    if (window.electronAPI && window.electronAPI.runAppCommand) {
      console.log("running..");
      let env = app.pythonEnvironments.find((env) => env.isDefault);
      if (!env) {
        env = app.pythonEnvironments[0];
      }
      const pythonPath = env.pythonPath;
      const launchCommand = env.startCommand;
      const cwd = app.folderPath;
      console.log("runApp", pythonPath, launchCommand, cwd);
      const result = await window.electronAPI.runAppCommand({
        pythonPath,
        launchCommand,
        cwd,
      });
      console.log(result);
      if (result && result.success) {
        // 更新最后使用时间
        const appToUpdate = localApps.value.find((a) => a.id == app.id);
        if (appToUpdate) {
          appToUpdate.lastUsedAt = new Date().toISOString().split("T")[0];
          // 保存更新
          await saveApps();
        }
      } else {
        console.error("运行应用失败:", result ? result.message : "未知错误");
      }
    } else {
      console.log("运行应用:", app.name);
    }
  } catch (error) {
    console.error("运行应用出错:", error);
  }
}

// 编辑应用
function editApp(app) {
  console.log("editApp", app);
  currentEditApp.value = JSON.parse(JSON.stringify(app)); // 深拷贝
  showConfigModal.value = true;
}

// 关闭 Modal
function closeModal() {
  showCreateModal.value = false;
  showConfigModal.value = false;
  currentEditApp.value = null;
}

// 处理应用创建事件
async function handleAppCreated(newApp) {
  try {
    // 生成新ID (如果没有)
    if (!newApp.id) {
      newApp.id = Date.now();
    }

    // 设置创建日期和最后使用日期
    if (!newApp.createdAt) {
      newApp.createdAt = new Date().toISOString().split("T")[0];
    }
    if (!newApp.lastUsedAt) {
      newApp.lastUsedAt = newApp.createdAt;
    }

    // 添加到本地列表
    localApps.value.push(newApp);

    // 使用electronStore保存应用
    await electronStore.saveApps(localApps.value);

    // 通知父组件更新应用列表
    emit("update-apps", localApps.value);

    console.log("成功创建应用:", newApp.name);
  } catch (error) {
    console.error("保存新应用失败:", error);
  }
}

// 处理应用更新事件
async function handleAppUpdated(updatedApp) {
  try {
    const index = localApps.value.findIndex((app) => app.id == updatedApp.id);
    if (index !== -1) {
      // 更新应用
      localApps.value[index] = updatedApp;

      // 使用electronStore保存应用
      await electronStore.saveApps(localApps.value);

      // 通知父组件更新应用列表
      emit("update-apps", localApps.value);

      console.log("成功更新应用:", updatedApp.name);
    } else {
      console.warn("未找到要更新的应用:", updatedApp.id);
    }
  } catch (error) {
    console.error("更新应用失败:", error);
  }
}

// 保存应用列表
async function saveApps() {
  try {
    await electronStore.saveApps(localApps.value);
    console.log("应用列表保存成功");
  } catch (error) {
    console.error("保存应用列表失败:", error);
  }
}
</script>

<template>
  <div class="app-list-container">
    <!-- <div class="app-list-header">
      <h1>应用列表</h1>
      <button class="btn-create" @click="showCreateModal = true">创建应用</button>
    </div> -->

    <div class="app-list">
      <div v-if="filteredAndSortedApps.length === 0" class="no-results">
        <div class="no-results-icon">🔍</div>
        <p>No apps found matching your criteria</p>
        <p class="no-results-hint">
          {{
            filterMode === "all"
              ? 'Try switching to "Any Selected Tag" mode or select fewer tags.'
              : "Try different tags or clear your search."
          }}
        </p>
      </div>
      <div v-else class="app-cards-container">
        <AppItem
          v-for="app in filteredAndSortedApps"
          :key="app.id"
          :app="app"
          :is-expanded="expandedCards[app.id]"
          :is-dropdown-active="activeDropdownId === app.id"
          @toggle-expand="toggleExpand(app.id)"
          @toggle-dropdown="toggleDropdown(app.id, $event)"
          @open-app="runApp(app)"
          @open-config="editApp(app)"
          @delete-app="handleDeleteApp(app, $event)"
          @clone-app="handleCloneApp(app, $event)"
          @add-tag-to-filter="handleAddTagToFilter"
        />
      </div>

      <div v-if="localApps.length === 0" class="no-apps">
        <p>暂无应用，点击"创建应用"开始</p>
      </div>
    </div>

    <!-- 创建/编辑应用的 Modal -->
    <AppCreateModal
      v-if="showCreateModal"
      :existing-app="currentEditApp"
      :is-editing="!!currentEditApp"
      @close="closeModal"
      @create="handleAppCreated"
      @update="handleAppUpdated"
    />

    <!-- 配置应用的 Modal -->
    <AppConfigModal
      v-if="showConfigModal"
      :appData="currentEditApp"
      @close="closeModal"
      @save="handleAppUpdated"
      @openSettings="emit('open-config', currentEditApp, $event)"
    />
  </div>
</template>

<style scoped>
.app-list-container {
  width: 100%;
  height: 100%;
  padding: 20px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
}

.app-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.app-list-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-strong);
}

.btn-create {
  background-color: var(--color-primary);
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-create:hover {
  background-color: var(--color-primary-dark);
}

.app-list {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 16px;
}

.app-cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  width: 100%;
}

.no-apps {
  text-align: center;
  padding: 40px;
  background-color: var(--color-background-secondary);
  border-radius: 8px;
  color: var(--color-text-light);
}

.no-results {
  background-color: white;
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  color: #64748b;
  font-size: 1.1rem;
  margin-top: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.no-results-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #94a3b8;
}

.no-results-hint {
  font-size: 0.9rem;
  color: #777;
  margin: 0.5rem 0;
  max-width: 80%;
  margin: 0.5rem auto;
}
</style>
