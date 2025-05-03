<template>
  <div class="seed-container">
    <!-- Search Bar -->
    <div class="seed-search">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="搜索种子模板..."
        @input="searchSeeds"
      />
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

    <!-- Seeds List -->
    <div class="seeds-list">
      <div v-if="loading" class="loading-message">加载种子模板中...</div>
      <div v-else-if="filteredSeeds.length === 0" class="empty-message">
        <span v-if="searchQuery">没有匹配的种子模板</span>
        <span v-else>暂无种子模板</span>
      </div>
      <div
        v-else
        v-for="seed in filteredSeeds"
        :key="seed.name"
        class="seed-item"
        @click="selectSeed(seed)"
        :class="{ active: selectedSeed && selectedSeed.name === seed.name }"
      >
        <div class="seed-icon">🌱</div>
        <div class="seed-info">
          <div class="seed-name">{{ seed.name }}</div>
          <div class="seed-description">{{ seed.description }}</div>
          <div class="seed-tags">
            <span v-for="tag in seed.tags" :key="tag" class="seed-tag">{{
              tag
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Seed Details Panel -->
    <div v-if="selectedSeed" class="seed-details">
      <div class="details-header">
        <h3>种子详情</h3>
        <div class="header-actions">
          <button class="import-button" @click="importSeed">导入配置</button>
          <button class="close-button" @click="selectedSeed = null">×</button>
        </div>
      </div>
      <div class="details-content">
        <pre class="seed-json">{{ JSON.stringify(selectedSeed, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";

const props = defineProps({
  onImport: {
    type: Function,
    default: () => {},
  },
});

const emit = defineEmits(["import"]);

// State
const seeds = ref([]);
const filteredSeeds = ref([]);
const searchQuery = ref("");
const selectedSeed = ref(null);
const loading = ref(true);

// Load seed data when component mounts
onMounted(async () => {
  await loadSeeds();
});

// Load seeds from the seeds directory
async function loadSeeds() {
  try {
    loading.value = true;

    // In a real app, we would load this from the file system
    // For now, we're hard-coding sample data
    const sampleSeeds = [
      {
        name: "ComfyUI",
        version: "1.0.0",
        type: "seed",
        description: "ComfyUI 是一个功能强大的稳定扩散 UI 和后端",
        tags: ["ComfyUI", "图像生成", "AI"],
        github: "https://github.com/comfyanonymous/ComfyUI.git",
        github_mirror: "https://gitee.com/mirrors/comfyui.git",
        python: "3.10",
        pip: [
          {
            nvidia:
              "pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu126",
            amd: "pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm6.2.4",
            "amd-win": "pip install torch-directml",
            intel:
              "pip install --pre torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nightly/xpu",
          },
          "pip install -r requirements.txt",
        ],
        launch_command: ["python main.py"],
        modelsFolder: "./models",
        outputFolder: "./output",
        flowFolder: "./flows",
      },
      {
        name: "Stable Diffusion Web UI",
        version: "1.0.0",
        type: "seed",
        description: "AUTOMATIC1111 的 Stable Diffusion WebUI",
        tags: ["Stable Diffusion", "AI", "图像生成"],
        github: "https://github.com/AUTOMATIC1111/stable-diffusion-webui.git",
        github_mirror: "https://gitee.com/mirrors/stable-diffusion-webui.git",
        python: "3.10",
        pip: ["pip install -r requirements.txt"],
        launch_command: ["python launch.py"],
        modelsFolder: "./models",
        outputFolder: "./outputs",
        configFolder: "./config",
      },
      {
        name: "ChatGLM WebUI",
        version: "1.0.0",
        type: "seed",
        description: "基于 ChatGLM 大型语言模型的本地聊天应用",
        tags: ["LLM", "聊天机器人", "AI"],
        github: "https://github.com/Akegarasu/ChatGLM-webui.git",
        python: "3.10",
        pip: ["pip install -r requirements.txt"],
        launch_command: ["python app.py"],
        modelsFolder: "./models",
        outputFolder: "./outputs",
      },
      {
        name: "LangChain 应用",
        version: "1.0.0",
        type: "seed",
        description: "使用 LangChain 构建的 AI 应用",
        tags: ["LangChain", "AI", "知识库"],
        github: "https://github.com/example/langchain-app.git",
        python: "3.10",
        pip: ["pip install langchain", "pip install -r requirements.txt"],
        launch_command: ["python app.py"],
        modelsFolder: "./models",
        outputFolder: "./output",
      },
    ];

    seeds.value = sampleSeeds;
    filteredSeeds.value = [...sampleSeeds];

    // If you want to load from the filesystem using Electron:
    // if (window.electronAPI && window.electronAPI.readSeedDirectory) {
    //   const seedFiles = await window.electronAPI.readSeedDirectory('seeds');
    //   const loadedSeeds = [];
    //
    //   for (const file of seedFiles) {
    //     if (file.endsWith('.aiseed.json')) {
    //       const seedData = await window.electronAPI.readSeedFile(`seeds/${file}`);
    //       loadedSeeds.push(seedData);
    //     }
    //   }
    //
    //   seeds.value = loadedSeeds;
    //   filteredSeeds.value = [...loadedSeeds];
    // }
  } catch (error) {
    console.error("Error loading seeds:", error);
    // Show error message to user
  } finally {
    loading.value = false;
  }
}

// Search seeds based on user input
function searchSeeds() {
  const query = searchQuery.value.toLowerCase().trim();

  if (!query) {
    filteredSeeds.value = [...seeds.value];
    return;
  }

  filteredSeeds.value = seeds.value.filter((seed) => {
    return (
      seed.name.toLowerCase().includes(query) ||
      seed.description.toLowerCase().includes(query) ||
      seed.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });
}

// Select a seed to view details
function selectSeed(seed) {
  selectedSeed.value = seed;
}

// Import the selected seed
function importSeed() {
  if (selectedSeed.value) {
    emit("import", selectedSeed.value);

    // If props.onImport is provided, call it with the selected seed
    if (props.onImport) {
      props.onImport(selectedSeed.value);
    }
  }
}
</script>

<style scoped>
.seed-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-background);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.seed-search {
  padding: 12px 16px;
  position: relative;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-card);
}

.seed-search input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 14px;
}

.seed-search input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-hover);
}

.search-icon {
  position: absolute;
  left: 24px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-light);
  pointer-events: none;
}

.seeds-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.loading-message,
.empty-message {
  padding: 20px;
  text-align: center;
  color: var(--color-text-light);
  font-size: 14px;
}

.seed-item {
  display: flex;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: var(--color-card);
  border: 1px solid transparent;
}

.seed-item:hover {
  background-color: var(--color-hover);
}

.seed-item.active {
  border-color: var(--color-primary);
  background-color: var(--color-active);
}

.seed-icon {
  font-size: 24px;
  margin-right: 12px;
  display: flex;
  align-items: center;
}

.seed-info {
  flex: 1;
  min-width: 0;
}

.seed-name {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 4px;
  color: var(--color-text-strong);
}

.seed-description {
  font-size: 13px;
  color: var(--color-text);
  margin-bottom: 8px;
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
  background-color: var(--color-background-secondary);
  color: var(--color-text-light);
}

.seed-details {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 350px;
  background-color: var(--color-card);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  z-index: 10;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.details-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.details-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-strong);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.import-button {
  padding: 6px 12px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.import-button:hover {
  background-color: var(--color-primary-dark);
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--color-text-light);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
}

.close-button:hover {
  background-color: var(--color-hover);
  color: var(--color-text);
}

.details-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.seed-json {
  white-space: pre;
  font-size: 13px;
  font-family: monospace;
  color: var(--color-text);
  line-height: 1.5;
  overflow-wrap: break-word;
}
</style>
