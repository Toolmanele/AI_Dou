<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3>从模板创建</h3>
        <button class="close-button" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label>搜索模板</label>
          <div class="search-input">
            <input
              type="text"
              v-model="searchQuery"
              placeholder="输入关键词搜索模板..."
              @input="searchSeeds"
            />
            <button class="clear-button" v-if="searchQuery" @click="clearSearch">×</button>
          </div>
        </div>

        <div class="seed-list-container">
          <div v-if="loading" class="seed-loading">
            <div class="spinner"></div>
            <span>加载模板中...</span>
          </div>

          <div v-else-if="error" class="seed-error">
            {{ error }}
          </div>

          <div v-else-if="filteredSeeds.length === 0" class="no-seeds">
            <p>未找到匹配的模板</p>
          </div>

          <div v-else class="seed-list">
            <div
              v-for="seed in filteredSeeds"
              :key="seed.id"
              class="seed-item"
              :class="{ selected: isSelected(seed) }"
              @click="selectSeed(seed)"
            >
              <div class="seed-icon">🌱</div>
              <div class="seed-info">
                <div class="seed-name">{{ seed.name }}</div>
                <div class="seed-description">{{ seed.description }}</div>
                <div class="seed-tags">
                  <span v-for="tag in seed.tags" :key="tag" class="seed-tag">
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="cancel-button" @click="$emit('close')">取消</button>
        <button class="confirm-button" @click="confirmSelection" :disabled="!selectedSeed">
          确认
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAppCreateStore } from '../../../stores/appCreateStore'
import { getAvailableSeeds } from '../../../services/seedService'
const emit = defineEmits(['close', 'confirm'])
const store = useAppCreateStore()

// State variables
const loading = ref(false)
const error = ref(null)
const seeds = ref([])
const filteredSeeds = ref([])
const searchQuery = ref('')
// const selectedSeed = ref(store.selectedSeed);
const selectedSeed = computed(() => store.selectedSeed)
// Search seeds based on the query
function searchSeeds() {
  if (!searchQuery.value.trim()) {
    filteredSeeds.value = seeds.value
    return
  }

  const query = searchQuery.value.toLowerCase()
  filteredSeeds.value = seeds.value.filter((seed) => {
    return (
      seed.name.toLowerCase().includes(query) ||
      (seed.description && seed.description.toLowerCase().includes(query)) ||
      (seed.tags && seed.tags.some((tag) => tag.toLowerCase().includes(query)))
    )
  })
}

// Clear search query
function clearSearch() {
  searchQuery.value = ''
  filteredSeeds.value = seeds.value
}

// Check if a seed is currently selected
function isSelected(seed) {
  return selectedSeed.value && selectedSeed.value.id === seed.id
}

// Select a seed
function selectSeed(seed) {
  store.selectedSeed = seed
  // selectedSeed.value = seed;
}

// Confirm selection
function confirmSelection() {
  emit('close')
  if (selectedSeed.value) {
    // 直接使用 setAppDataFromSeed 函数设置数据
    store.setAppBySeed(selectedSeed.value)
  }
}

// Load seeds data on component mount
onMounted(async () => {
  try {
    loading.value = true
    error.value = null
    let seedsData = await getAvailableSeeds()
    if (seedsData && seedsData.length > 0) {
      seedsData.forEach((seed) => {
        // 为 seed 生成 id
        seed.id = Math.random().toString(36).substring(2, 15)
      })
    }
    seeds.value = seedsData

    filteredSeeds.value = seeds.value

    // If there's a previously selected seed, find and select it
    if (store.selectedSeed) {
      const existingSeed = seeds.value.find((seed) => seed.id === store.selectedSeed.id)
      if (existingSeed) {
        selectedSeed.value = existingSeed
      }
    }
  } catch (err) {
    console.error('加载种子模板失败:', err)
    error.value = '加载模板失败: ' + (err.message || '未知错误')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-container {
  background-color: var(--color-card, #ffffff);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 600px;
  max-width: 95vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modal-appear 0.2s ease-out;
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border, #e0e0e0);
}

.modal-header h3 {
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

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid var(--color-border, #e0e0e0);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-strong);
}

.search-input {
  position: relative;
}

.search-input input {
  width: 100%;
  padding: 10px 12px;
  padding-right: 40px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
  color: var(--color-text);
  font-size: 14px;
  transition: all 0.2s ease;
}

.search-input input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-hover);
}

.clear-button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 16px;
  color: var(--color-text-light);
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.clear-button:hover {
  background-color: var(--color-hover);
}

.seed-list-container {
  height: 350px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.seed-loading,
.seed-error,
.no-seeds {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
  text-align: center;
  color: var(--color-text-light);
  font-size: 14px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.seed-list {
  padding: 8px;
}

.seed-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.seed-item:hover {
  background-color: var(--color-hover);
}

.seed-item.selected {
  background-color: var(--color-primary-light-10);
  border: 1px solid var(--color-primary-light);
}

.seed-icon {
  font-size: 24px;
  display: flex;
  align-items: center;
}

.seed-info {
  flex: 1;
}

.seed-name {
  font-weight: 600;
  font-size: 15px;
  color: var(--color-text-strong);
  margin-bottom: 4px;
}

.seed-description {
  font-size: 13px;
  color: var(--color-text);
  margin-bottom: 8px;
  line-height: 1.4;
}

.seed-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.seed-tag {
  padding: 2px 8px;
  background-color: var(--color-background-secondary);
  border-radius: 20px;
  font-size: 12px;
  color: var(--color-text-light);
}

.cancel-button,
.confirm-button {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button {
  background-color: var(--color-background-secondary, #f0f0f0);
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.cancel-button:hover {
  background-color: var(--color-hover);
}

.confirm-button {
  background-color: var(--color-primary);
  border: none;
  color: white;
}

.confirm-button:hover {
  background-color: var(--color-primary-dark);
}

.confirm-button:disabled {
  background-color: var(--color-primary-light);
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
