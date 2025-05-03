<template>
  <div class="page-container">
    <div class="page-layout">
      <!-- Left sidebar for search, filtering, and file management -->
      <div class="sidebar-container">
        <ModelSidebar
          ref="modelSidebarRef"
          v-model:searchQuery="searchQuery"
          :availableTags="availableTags"
          :selectedTags="selectedTags"
          :tagCounts="tagCounts"
          :filterMode="filterMode"
          :folderData="modelFolderData"
          @toggle-tag="toggleTag"
          @toggle-filter-mode="toggleFilterMode"
          @reset-filters="resetFilters"
          @select-file="handleSelectModelFile"
          @add-folder="handleAddModelFolder"
          @add-file="handleAddModelFile"
          @update-folder-tree="handleUpdateModelFolderTree"
        />
      </div>
      
      <!-- Right content area for model list -->
      <div class="content-container">
        <div class="page-header">
          <h1>模型管理</h1>
          <div class="action-buttons">
            <button @click="openAddModelModal" class="btn-primary">
              添加模型
            </button>
            <button @click="deduplicateModels" class="btn-secondary">
              模型去重
            </button>
            <button @click="linkModels" class="btn-secondary">
              模型链接
            </button>
            <!-- <button @click="resetSidebarLayout" class="btn-icon" title="重置侧边栏布局">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
              </svg>
            </button> -->
          </div>
        </div>
        
        <ModelList
          :models="filteredModels"
          :searchQuery="searchQuery"
          :selectedTags="selectedTags"
          :filterMode="filterMode"
          :sortBy="sortBy"
          :sortDirection="sortDirection"
          @open-model="handleOpenModel"
          @open-config="handleOpenConfig"
          @delete-model="handleDeleteModel"
          @clone-model="handleCloneModel"
          @add-tag-to-filter="addTagToFilter"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import ModelSidebar from '../components/modelPage/ModelSidebar.vue';
import ModelList from '../components/modelPage/ModelList.vue';
import electronStore from '../services/electronStore';

// Models data - will be loaded from storage
const models = ref([]);
const isLoading = ref(true);
const isElectronAvailable = ref(!!window.electronAPI);
const isSaving = ref(false);

// Sample template model for development
const sampleModel = {
  id: 1,
  name: 'GPT-4',
  tags: ['语言', '高级', 'OpenAI'],
  description: '强大的大型语言模型，支持复杂推理和多模态输入',
  createdAt: '2023-06-01',
  lastUsedAt: '2023-09-10',
  icon: '🤖',
  status: 'running',
  version: 'v1.0.3',
  performance: '高',
  requestsPerDay: 12345,
  responseTime: '245ms',
};

// Tag filtering - dynamically generated from models data
const availableTags = ref(['All']);
const selectedTags = ref(['All']);

// Model folder tree data
const modelFolderData = ref({
  id: 'root',
  name: 'Models',
  type: 'folder',
  expanded: true,
  children: []
});

// Add a ref to the ModelSidebar component
const modelSidebarRef = ref(null);

// Function to reset sidebar header position
const resetSidebarLayout = () => {
  if (modelSidebarRef.value) {
    modelSidebarRef.value.resetHeaderPosition();
  }
};

// Generate unique tags from models
function generateAvailableTags() {
  // Start with 'All' tag
  const tags = new Set(['All']);
  
  // Extract all tags from all models
  models.value.forEach(model => {
    if (Array.isArray(model.tags)) {
      model.tags.forEach(tag => tags.add(tag));
    }
  });
  
  // Convert Set to array and sort alphabetically
  availableTags.value = Array.from(tags).sort((a, b) => {
    // Keep 'All' at the beginning
    if (a === 'All') return -1;
    if (b === 'All') return 1;
    return a.localeCompare(b);
  });
}

// Update tags whenever models are loaded or modified
watch(models, generateAvailableTags, { deep: true });

// Load models from storage
async function loadModels() {
  try {
    // Initialize the data storage first
    await electronStore.initializeStorage();
    
    // Get models from storage (assuming there's a getModels method similar to getApps)
    const storedModels = await electronStore.getModels?.() || [];
    
    // Check if we got any models back
    if (Array.isArray(storedModels) && storedModels.length > 0) {
      models.value = storedModels;
    } else if (electronStore.isDevelopmentMode) {
      // If in dev mode and no models, create sample data
      console.log('Development mode: Creating sample model data');
      // Create sample models for development
      const sampleModels = [
        {
          ...JSON.parse(JSON.stringify(sampleModel)),
          id: 1,
          name: 'GPT-4',
          tags: ['语言', '高级', 'OpenAI'],
          status: 'running'
        },
        {
          ...JSON.parse(JSON.stringify(sampleModel)),
          id: 2,
          name: 'Claude 3',
          tags: ['语言', '高级', 'Anthropic'],
          status: 'running',
          version: 'v1.1.0',
          requestsPerDay: 8721,
          responseTime: '189ms'
        },
        {
          ...JSON.parse(JSON.stringify(sampleModel)),
          id: 3,
          name: 'DALL-E 3',
          tags: ['图像', '生成', 'OpenAI'],
          description: '先进的图像生成模型，创造高质量和准确的图像',
          status: 'stopped',
          version: 'v0.9.5',
          performance: '中',
          requestsPerDay: 3502,
          responseTime: '1.2s'
        },
        {
          ...JSON.parse(JSON.stringify(sampleModel)),
          id: 4,
          name: 'Llama 3',
          tags: ['语言', '开源', 'Meta'],
          description: 'Meta的开源大语言模型，经过优化可本地部署',
          status: 'running',
          version: 'v1.0.0',
          performance: '中',
          requestsPerDay: 5421,
          responseTime: '320ms'
        },
        {
          ...JSON.parse(JSON.stringify(sampleModel)),
          id: 5,
          name: 'Stable Diffusion XL',
          tags: ['图像', '生成', '开源'],
          description: '开源图像生成模型，支持多种图像生成和编辑功能',
          status: 'running',
          version: 'v2.0.0',
          performance: '中',
          requestsPerDay: 4231,
          responseTime: '980ms'
        }
      ];
      models.value = sampleModels;
      // Save sample models to storage if the method exists
      if (electronStore.saveModels) {
        await electronStore.saveModels(sampleModels);
      }
    }
    
    // Generate available tags from loaded models
    generateAvailableTags();
    
    // Also load model folder structure if available
    await loadModelFolders();
  } catch (error) {
    console.error('Error loading models:', error);
    throw error; // rethrow to allow the caller to handle it
  }
}

// Load model folder structure from storage
async function loadModelFolders() {
  try {
    // Get model folders from storage (assuming there's a getModelFolders method)
    const storedFolders = await electronStore.getModelFolders?.() || null;
    
    if (storedFolders) {
      modelFolderData.value = storedFolders;
    } else if (electronStore.isDevelopmentMode) {
      // Create sample folder structure in development mode
      console.log('Development mode: Creating sample folder structure');
      modelFolderData.value = {
        id: 'root',
        name: 'Models',
        type: 'folder',
        expanded: true,
        children: [
          {
            id: 'folder_1',
            name: '通用模型',
            type: 'folder',
            expanded: true,
            children: [
              { id: 'file_1', name: 'GPT-4配置.json', type: 'file' },
              { id: 'file_2', name: 'Claude-3配置.json', type: 'file' }
            ]
          },
          {
            id: 'folder_2',
            name: '专业领域模型',
            type: 'folder',
            expanded: false,
            children: [
              { id: 'file_3', name: '医疗模型.json', type: 'file' },
              { id: 'file_4', name: '法律模型.json', type: 'file' }
            ]
          },
          {
            id: 'folder_3',
            name: '图像生成',
            type: 'folder',
            expanded: false,
            children: [
              { id: 'file_5', name: 'DALL-E配置.json', type: 'file' },
              { id: 'file_6', name: 'Stable Diffusion配置.json', type: 'file' }
            ]
          }
        ]
      };
      
      // Save sample folders to storage if the method exists
      if (electronStore.saveModelFolders) {
        await electronStore.saveModelFolders(modelFolderData.value);
      }
    }
  } catch (error) {
    console.error('Error loading model folders:', error);
    // Create empty folder structure as fallback
    modelFolderData.value = {
      id: 'root',
      name: 'Models',
      type: 'folder',
      expanded: true,
      children: []
    };
  }
}

// Save model folders to storage
async function saveModelFolders() {
  try {
    if (electronStore.saveModelFolders) {
      await electronStore.saveModelFolders(modelFolderData.value);
    }
  } catch (error) {
    console.error('Error saving model folders:', error);
  }
}

// Initialize storage and load models
onMounted(async () => {
  try {
    // Initialize data storage & load models
    isLoading.value = true;
    
    // Try to load models
    await loadModels();
  } catch (error) {
    console.error("Error initializing model data:", error);
    
    // Fallback to sample data if there was an error
    if (models.value.length === 0) {
      console.log("Using sample data as fallback");
      // Create sample models for fallback
      models.value = [
        {
          ...JSON.parse(JSON.stringify(sampleModel)),
          id: 1,
          name: 'GPT-4',
          tags: ['语言', '高级', 'OpenAI'],
          status: 'running'
        },
        {
          ...JSON.parse(JSON.stringify(sampleModel)),
          id: 2,
          name: 'Claude 3',
          tags: ['语言', '高级', 'Anthropic'],
          status: 'running'
        }
      ];
    }
  } finally {
    isLoading.value = false;
  }
});

// Search functionality
const searchQuery = ref('');

// Compute tag counts for the models
const tagCounts = computed(() => {
  const counts = {};
  
  // Initialize all available tags with count 0
  availableTags.value.forEach(tag => {
    if (tag !== 'All') {
      counts[tag] = 0;
    }
  });

  // Count models for each tag
  models.value.forEach(model => {
    if (Array.isArray(model.tags)) {
      model.tags.forEach(tag => {
        if (counts[tag] !== undefined) {
          counts[tag]++;
        }
      });
    }
  });

  return counts;
});

// Compute filtered models for display
const filteredModels = computed(() => {
  // First filter by search query
  let result = models.value.filter(
    (model) =>
      model.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      model.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  );

  // Then filter by tags
  if (!selectedTags.value.includes('All')) {
    if (filterMode.value === 'any') {
      // Show models that have ANY of the selected tags (OR logic)
      result = result.filter((model) =>
        model.tags.some((tag) => selectedTags.value.includes(tag))
      );
    } else {
      // Show models that have ALL of the selected tags (AND logic)
      result = result.filter((model) =>
        selectedTags.value.every((tag) => model.tags.includes(tag))
      );
    }
  }

  return result;
});

// Filtering mode - 'all' (AND logic) or 'any' (OR logic)
const filterMode = ref('all');

// Sorting
const sortBy = ref('name');
const sortDirection = ref('asc');

// Tag selection functions
const toggleTag = (tag) => {
  // Special handling for 'All' tag
  if (tag === 'All') {
    selectedTags.value = ['All'];
    return;
  }

  // If 'All' is currently selected and user selects another tag,
  // remove 'All' and add the new tag
  if (selectedTags.value.includes('All')) {
    selectedTags.value = [tag];
    return;
  }

  // Toggle tag - if already selected, remove it
  if (selectedTags.value.includes(tag)) {
    selectedTags.value = selectedTags.value.filter((t) => t !== tag);
    // If all tags are deselected, select 'All' again
    if (selectedTags.value.length === 0) {
      selectedTags.value = ['All'];
    }
  } else {
    // Add tag to selected tags
    selectedTags.value.push(tag);
  }
};

// Toggle filter mode
const toggleFilterMode = () => {
  filterMode.value = filterMode.value === 'any' ? 'all' : 'any';
};

// Reset all filters
const resetFilters = () => {
  searchQuery.value = '';
  selectedTags.value = ['All'];
  filterMode.value = 'all';
};

// Add tag to filter from model card
const addTagToFilter = (tag, event) => {
  event.stopPropagation(); // Prevent card expansion

  // If 'All' is currently selected, replace it with the clicked tag
  if (selectedTags.value.includes('All')) {
    selectedTags.value = [tag];
    return;
  }

  // If tag is not already selected, add it to the filter
  if (!selectedTags.value.includes(tag)) {
    selectedTags.value.push(tag);
  }
};

// Handlers for model folder tree
const handleSelectModelFile = (file) => {
  console.log('Selected model file:', file.name);
  // Implement file opening logic here
  // For example, load model configuration from file
};

const handleAddModelFolder = (folder) => {
  console.log('Added model folder:', folder.name);
  saveModelFolders();
};

const handleAddModelFile = (file, parentFolder) => {
  console.log('Added model file:', file.name, 'to folder:', parentFolder.name);
  saveModelFolders();
};

const handleUpdateModelFolderTree = (treeData) => {
  console.log('Model folder tree updated');
  modelFolderData.value = treeData;
  saveModelFolders();
};

// Handlers for model actions
const handleOpenModel = (model, event) => {
  console.log('Opening model:', model.name);
  // Implement model opening logic
};

const handleOpenConfig = (model, event) => {
  console.log('Opening config for model:', model.name);
  // Implement model configuration logic
};

const handleDeleteModel = (model, event) => {
  console.log('Deleting model:', model.name);
  // Implement model deletion logic
};

const handleCloneModel = (model, event) => {
  console.log('Cloning model:', model.name);
  // Implement model cloning logic
};

const openAddModelModal = () => {
  console.log('Opening add model modal');
  // Implement add model modal logic
};

const deduplicateModels = () => {
  console.log('Deduplicating models');
  // Check if there are any models to deduplicate
  if (models.value.length <= 1) {
    alert('需要至少两个模型才能执行去重操作');
    return;
  }
  
  // Find duplicate models based on name similarity
  const nameCounts = {};
  const duplicates = [];
  
  // Find potential duplicates
  models.value.forEach(model => {
    const normalizedName = model.name.toLowerCase().trim();
    if (!nameCounts[normalizedName]) {
      nameCounts[normalizedName] = [];
    }
    nameCounts[normalizedName].push(model);
  });
  
  // Create list of duplicates
  Object.keys(nameCounts).forEach(name => {
    if (nameCounts[name].length > 1) {
      duplicates.push({
        name: name,
        models: nameCounts[name]
      });
    }
  });
  
  if (duplicates.length === 0) {
    alert('没有找到重复的模型');
    return;
  }
  
  // Show duplicates (in a real app, this would open a modal)
  console.log('Found duplicates:', duplicates);
  alert(`找到 ${duplicates.length} 组重复模型，共 ${duplicates.reduce((acc, group) => acc + group.models.length, 0)} 个模型。\n\n请在控制台查看详情。`);
  
  // In a real implementation, we would open a modal for user to select which models to keep
};

const linkModels = () => {
  console.log('Linking models');
  // Check if there are at least two models to link
  if (models.value.length < 2) {
    alert('需要至少两个模型才能创建链接');
    return;
  }
  
  // In a real implementation, this would open a modal allowing users to:
  // 1. Select source and target models
  // 2. Define the relationship type (fallback, enhancement, etc)
  // 3. Set link properties
  
  // For now, simulate model selection
  const availableModels = models.value.map(model => ({
    id: model.id,
    name: model.name
  }));
  
  console.log('Available models for linking:', availableModels);
  alert('请在控制台查看可用于链接的模型列表。\n\n在实际应用中，这里会打开一个模态窗口，允许您选择源模型和目标模型，并定义它们之间的关系类型。');
  
  // In a real implementation: 
  // 1. User selects models to link from the availableModels list
  // 2. User configures link parameters
  // 3. Link is created and stored
};
</script>

<style scoped>
.page-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.sidebar-container {
  width: 280px;
  /*padding: 1.5rem;*/
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  background-color: var(--color-background, #f9fafc);
}

.content-container {
  flex: 1;
  padding: 1.5rem 0.5rem 1.5rem 1.5rem;
  overflow-y: auto;
  height: 100%;
  background-color: var(--color-background-secondary, #f1f5f9);
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.action-buttons {
  margin-right:20px;
  display: flex;
  gap: 0.75rem;
}

.btn-primary {
  background-color: var(--color-primary, #4c6ef5);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: var(--color-primary-darker, #405cd6);
}

.btn-secondary {
  background-color: var(--color-secondary, #6366f1);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background-color: var(--color-secondary-darker, #5a5ecc);
}

/* Dark mode styles */
.app.dark-mode .sidebar-container {
  background-color: var(--color-background, #1e1e1e);
  border-color: var(--color-border, #2d2d2d);
}

.app.dark-mode .content-container {
  background-color: var(--color-background-secondary, #252526);
}

.app.dark-mode .page-header h1 {
  color: #e0e0e0;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background-color: var(--color-background, #f9fafc);
  border: 1px solid var(--color-border, #e2e8f0);
  color: var(--color-text-light, #64748b);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background-color: var(--color-background-secondary, #f1f5f9);
  color: var(--color-text-strong, #1e293b);
}

.app.dark-mode .btn-icon {
  background-color: var(--color-background, #1e1e1e);
  border-color: var(--color-border, #2d2d2d);
  color: var(--color-text-light, #8b95a3);
}

.app.dark-mode .btn-icon:hover {
  background-color: var(--color-background-secondary, #252526);
  color: var(--color-text-strong, #e0e0e0);
}
</style>
