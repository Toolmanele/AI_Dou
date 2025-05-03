<template>
  <div class="seed-list-sidebar" :class="{ visible: show }">
    <div class="seed-list-header">
      <h3>种子模板列表</h3>
      <button class="close-button" @click="$emit('close')">×</button>
    </div>

    <div class="seed-list-search">
      <input type="text" v-model="searchQuery" placeholder="搜索种子模板..." @input="searchSeeds" />
      <div class="search-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>
    </div>

    <div class="seed-list-content">
      <div v-if="loading" class="loading-message">加载种子模板中...</div>
      <div v-else-if="filteredSeeds.length === 0" class="empty-message">
        <span v-if="searchQuery">没有匹配的种子模板</span>
        <span v-else>暂无种子模板</span>
      </div>
      <div
        v-else
        v-for="seed in filteredSeeds"
        :key="seed.id"
        class="seed-item"
        @click="selectSeed(seed)"
        :class="{ active: selectedSeed && selectedSeed.id === seed.id }"
      >
        <div class="seed-icon">🌱</div>
        <div class="seed-info">
          <div class="seed-name">{{ seed.name }}</div>
          <div class="seed-description">{{ seed.description }}</div>
          <div class="seed-tags">
            <span v-for="tag in seed.tags" :key="tag" class="seed-tag">{{ tag }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 导入确认对话框 -->
    <div class="import-dialog" v-if="showImportDialog">
      <div class="import-dialog-content">
        <div class="import-dialog-header">
          <h4>确认导入</h4>
          <button class="close-button" @click="cancelImport">×</button>
        </div>
        <div class="import-dialog-body">
          <p>是否导入种子模板: {{ selectedSeed?.name }}</p>
        </div>
        <div class="import-dialog-footer">
          <button class="cancel-button" @click="cancelImport">取消</button>
          <button class="confirm-button" @click="confirmImport">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { getAvailableSeeds } from '../../services/seedService'
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'select', 'import'])

// State
const seeds = ref([])
const filteredSeeds = ref([])
const searchQuery = ref('')
const selectedSeed = ref(null)
const loading = ref(true)
const showImportDialog = ref(false)

// Reset selection when sidebar is closed
watch(
  () => props.show,
  (newValue) => {
    if (!newValue) {
      selectedSeed.value = null
      searchQuery.value = ''
      showImportDialog.value = false
    }
  }
)

// Load seed data when component mounts
onMounted(async () => {
  await loadSeeds()
})

// 加载种子数据
async function loadSeeds() {
  loading.value = true

  try {
    // 导入种子服务
    // const { getAvailableSeeds } = await import('../../services/seedService')

    // 获取可用的种子列表
    const availableSeeds = await getAvailableSeeds()

    if (availableSeeds && availableSeeds.length > 0) {
      // 使用从API获取的实际种子数据
      seeds.value = availableSeeds.map((seed) => ({
        id: seed.id || seed.name?.toLowerCase().replace(/\s+/g, '-') || `seed-${Date.now()}`,
        name: seed.name || 'Unknown Seed',
        description: seed.description || '无描述',
        tags: seed.tags || [],
        config: {
          pythonVersion: seed.python || '3.10',
          installCommands: Array.isArray(seed.pip)
            ? seed.pip
                .map((cmd) => (typeof cmd === 'string' ? cmd : Object.values(cmd)[0]))
                .filter(Boolean)
            : ['pip install -r requirements.txt'],
          startCommand: Array.isArray(seed.launch_command)
            ? seed.launch_command.join(' ')
            : 'python main.py',
          // 其他配置
          modelDir: seed.modelsFolder || '',
          outputDir: seed.outputFolder || ''
        },
        // 保存原始种子数据
        rawData: seed
      }))
    } else {
      // 如果没有获取到种子数据，使用备用种子数据
      seeds.value = [
        {
          id: 'comfyui',
          name: 'ComfyUI',
          description: '一个强大的基于节点的 Stable Diffusion UI',
          tags: ['图像生成', 'AI绘画', '节点编辑器'],
          config: {
            pythonVersion: '3.10',
            installCommands: ['pip install -r requirements.txt'],
            startCommand: 'python main.py'
          }
        },
        {
          id: 'sd-webui',
          name: 'Stable Diffusion WebUI',
          description: '易用的 Stable Diffusion Web 界面',
          tags: ['图像生成', 'Web界面', 'AI绘画'],
          config: {
            pythonVersion: '3.10',
            installCommands: ['pip install -r requirements.txt'],
            startCommand: 'python launch.py'
          }
        },
        {
          id: 'langchain-app',
          name: 'LangChain 应用',
          description: '使用 LangChain 构建的 AI 应用',
          tags: ['LLM', '知识库', '智能助手'],
          config: {
            pythonVersion: '3.11',
            installCommands: ['pip install -r requirements.txt'],
            startCommand: 'python app.py'
          }
        }
      ]
    }

    // 设置过滤后的种子列表
    filteredSeeds.value = [...seeds.value]
  } catch (error) {
    console.error('加载种子模板失败:', error)
    // 出错时使用备用种子数据
    seeds.value = [
      {
        id: 'default-seed',
        name: '默认模板',
        description: '基础应用模板',
        tags: ['基础', '模板'],
        config: {
          pythonVersion: '3.11',
          installCommands: ['pip install -r requirements.txt'],
          startCommand: 'python main.py'
        }
      }
    ]
    filteredSeeds.value = [...seeds.value]
  } finally {
    loading.value = false
  }
}

// Search seeds based on query
function searchSeeds() {
  const query = searchQuery.value.toLowerCase()

  if (!query) {
    filteredSeeds.value = [...seeds.value]
    return
  }

  filteredSeeds.value = seeds.value.filter((seed) => {
    return (
      seed.name.toLowerCase().includes(query) ||
      seed.description.toLowerCase().includes(query) ||
      seed.tags.some((tag) => tag.toLowerCase().includes(query))
    )
  })
}

// Select a seed
function selectSeed(seed) {
  selectedSeed.value = seed
  emit('select', seed)

  // 显示导入确认对话框
  showImportDialog.value = true
}

// Cancel import
function cancelImport() {
  showImportDialog.value = false
}

// Confirm import
function confirmImport() {
  if (selectedSeed.value) {
    importSeed(selectedSeed.value)
  }
  showImportDialog.value = false
}

// Import the selected seed
function importSeed(seed = null) {
  const seedToImport = seed || selectedSeed.value

  if (seedToImport) {
    // 检查原始数据，确保传递尽可能完整的信息
    const importData = {
      ...seedToImport,
      // 确保配置信息存在
      config: seedToImport.config || {}
    }

    // 发送导入事件
    emit('import', importData)
  }
}
</script>

<style scoped>
.seed-list-sidebar {
  position: fixed;
  top: 10%;
  right: -360px;
  width: 360px;
  height: 80vh;
  background-color: var(--color-card, #ffffff);
  box-shadow: -4px 0 15px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  transition: right 0.3s ease;
  border-left: 1px solid var(--color-border, #e0e0e0);
  border-radius: 0 0 0 8px;
  overflow: hidden;
}

.seed-list-sidebar.visible {
  right: 0;
}

.seed-list-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border, #e0e0e0);
  background-color: var(--color-card, #ffffff);
}

.seed-list-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-strong, #333);
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  color: var(--color-text-light, #666);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-button:hover {
  background-color: var(--color-hover, #f5f5f5);
}

.seed-list-search {
  padding: 12px 16px;
  position: relative;
  border-bottom: 1px solid var(--color-border, #e0e0e0);
}

.seed-list-search input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border-radius: 6px;
  border: 1px solid var(--color-border, #e0e0e0);
  background-color: var(--color-background, #f8f8f8);
  color: var(--color-text, #333);
  font-size: 14px;
}

.seed-list-search input:focus {
  outline: none;
  border-color: var(--color-primary, #4b70e2);
  box-shadow: 0 0 0 2px rgba(75, 112, 226, 0.1);
}

.search-icon {
  position: absolute;
  left: 26px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-light, #888);
  pointer-events: none;
}

.seed-list-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.loading-message,
.empty-message {
  padding: 20px;
  text-align: center;
  color: var(--color-text-light, #888);
  font-size: 14px;
}

.seed-item {
  display: flex;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: var(--color-card, #fff);
  border: 1px solid transparent;
}

.seed-item:hover {
  background-color: var(--color-hover, #f5f5f5);
}

.seed-item.active {
  border-color: var(--color-primary, #4b70e2);
  background-color: var(--color-active, #f0f5ff);
}

.seed-icon {
  color: #4caf50;
  font-size: 22px;
}

.seed-info {
  flex: 1;
  min-width: 0;
}

.seed-name {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 4px;
  color: var(--color-text-strong, #333);
}

.seed-description {
  font-size: 13px;
  color: var(--color-text, #555);
  margin-bottom: 8px;
  line-height: 1.4;
}

.seed-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.seed-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background-color: var(--color-background-secondary, #f0f0f0);
  color: var(--color-text-light, #666);
}

/* 导入确认对话框样式 */
.import-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.import-dialog-content {
  background-color: var(--color-card, #ffffff);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 360px;
  max-width: 90vw;
  overflow: hidden;
  animation: dialog-appear 0.2s ease-out;
}

@keyframes dialog-appear {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.import-dialog-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border, #e0e0e0);
}

.import-dialog-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-strong, #333);
}

.import-dialog-body {
  padding: 20px 16px;
  color: var(--color-text, #333);
  font-size: 14px;
}

.import-dialog-footer {
  padding: 12px 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid var(--color-border, #e0e0e0);
}

.cancel-button {
  padding: 8px 16px;
  background-color: var(--color-background-secondary, #f0f0f0);
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  color: var(--color-text, #333);
  transition: background-color 0.2s;
}

.cancel-button:hover {
  background-color: var(--color-hover, #e5e5e5);
}

.confirm-button {
  padding: 8px 16px;
  background-color: var(--color-primary, #4b70e2);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.confirm-button:hover {
  background-color: var(--color-primary-dark, #3c5bd9);
}
</style>
