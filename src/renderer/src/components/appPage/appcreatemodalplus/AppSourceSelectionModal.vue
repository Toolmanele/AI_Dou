<template>
  <div class="source-selection-overlay" @click="closeModal">
    <div class="source-selection-container" @click.stop>
      <div class="modal-header">
        <h2>选择创建方式</h2>
        <button class="close-button" @click="closeModal">×</button>
      </div>

      <div class="modal-body">
        <div class="source-options">
          <div
            class="source-option"
            :class="{ selected: selectedSource === 'folder' }"
            @click="selectSource('folder')"
          >
            <div class="source-icon">📁</div>
            <div class="source-info">
              <div class="source-title">从文件夹创建</div>
              <div class="source-description">选择本地文件夹作为应用根目录</div>
            </div>
          </div>

          <div
            class="source-option"
            :class="{ selected: selectedSource === 'github' }"
            @click="selectSource('github')"
          >
            <div class="source-icon">🐙</div>
            <div class="source-info">
              <div class="source-title">从 Git 仓库创建</div>
              <div class="source-description">通过 Git 仓库地址克隆代码</div>
            </div>
          </div>

          <div
            class="source-option"
            :class="{ selected: selectedSource === 'seed' }"
            @click="selectSource('seed')"
          >
            <div class="source-icon">🌱</div>
            <div class="source-info">
              <div class="source-title">从模板创建</div>
              <div class="source-description">使用内置应用模板快速创建</div>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button class="confirm-button" :disabled="!selectedSource" @click="confirmSelection">
            确认
          </button>
          <button class="cancel-button" @click="closeModal">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAppCreateStore } from '../../../stores/appCreateStore'

const store = useAppCreateStore()
const selectedSource = ref('')

// Define emits
const emit = defineEmits(['close', 'select'])

// Function to close the modal
function closeModal() {
  emit('close')
}

// Function to select a source
function selectSource(source) {
  selectedSource.value = source
}

// Function to confirm selection
async function confirmSelection() {
  if (!selectedSource.value) return

  // Call the appropriate store function based on the selected source
  if (selectedSource.value === 'folder') {
    store.setAppDataFromFolder()
  } else if (selectedSource.value === 'github') {
    store.setAppDataFromGithub()
  } else if (selectedSource.value === 'seed') {
    // For seed we don't initialize with a specific seed yet
    // The main modal will handle seed selection
    store.setAppDataFromSeed()
  }

  // Emit selection event
  emit('select', selectedSource.value)
}

// Set default selection on mount
onMounted(() => {
  // Set default selection or restore previous selection if available
  if (store.appData.from) {
    selectedSource.value = store.appData.from
  } else {
    selectedSource.value = 'seed' // Default to seed
  }
})
</script>

<style scoped>
.source-selection-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.source-selection-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 550px;
  max-width: 90%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e8e8e8;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-button {
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.close-button:hover {
  color: #333;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.source-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.source-option {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.source-option:hover {
  border-color: #1890ff;
  background-color: #f0f7ff;
}

.source-option.selected {
  border-color: #1890ff;
  background-color: #e6f7ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.source-icon {
  font-size: 24px;
  margin-right: 16px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f2f5;
  border-radius: 50%;
}

.source-info {
  flex: 1;
}

.source-title {
  font-weight: 600;
  margin-bottom: 4px;
  color: #333;
}

.source-description {
  color: #666;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.confirm-button {
  padding: 8px 16px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.confirm-button:hover {
  background-color: #40a9ff;
}

.confirm-button:disabled {
  background-color: #d9d9d9;
  cursor: not-allowed;
}

.cancel-button {
  padding: 8px 16px;
  background-color: white;
  color: #333;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-button:hover {
  color: #1890ff;
  border-color: #1890ff;
}
</style>
