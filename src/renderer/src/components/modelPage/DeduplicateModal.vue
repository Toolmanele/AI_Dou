<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="modal-container">
      <div class="modal-header">
        <h2>模型去重</h2>
        <button class="close-button" @click="close">×</button>
      </div>
      
      <div class="modal-body">
        <div v-if="duplicates.length === 0" class="no-duplicates">
          <p>没有找到重复的模型</p>
        </div>
        
        <div v-else class="duplicates-list">
          <p class="info-text">发现以下重复模型组，请选择每组中要保留的模型：</p>
          
          <div v-for="(group, groupIndex) in duplicates" :key="groupIndex" class="duplicate-group">
            <h3>重复组 {{ groupIndex + 1 }}: "{{ group.name }}"</h3>
            
            <div class="models-container">
              <div 
                v-for="model in group.models" 
                :key="model.id" 
                class="model-item"
                :class="{ selected: selectedModels[groupIndex] === model.id }"
                @click="selectModel(groupIndex, model.id)"
              >
                <div class="model-info">
                  <div class="model-name">{{ model.name }}</div>
                  <div class="model-meta">
                    <span class="model-version">版本: {{ model.version }}</span>
                    <span class="model-created">创建: {{ model.createdAt }}</span>
                  </div>
                </div>
                <div class="model-select">
                  <div class="radio" :class="{ checked: selectedModels[groupIndex] === model.id }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-secondary" @click="close">取消</button>
        <button 
          class="btn-primary" 
          @click="deduplicateSelected"
          :disabled="!isSelectionComplete || duplicates.length === 0"
        >
          确认去重
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, watch } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  duplicates: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'deduplicate']);

// Track selected models for each duplicate group
const selectedModels = ref({});

// Reset selections when duplicates change
watch(() => props.duplicates, () => {
  selectedModels.value = {};
}, { deep: true });

// Check if selection is complete (one model selected for each group)
const isSelectionComplete = computed(() => {
  if (props.duplicates.length === 0) return false;
  
  return props.duplicates.every((group, index) => {
    return selectedModels.value[index] !== undefined;
  });
});

// Select a model from a duplicate group
const selectModel = (groupIndex, modelId) => {
  selectedModels.value[groupIndex] = modelId;
};

// Close the modal
const close = () => {
  emit('close');
};

// Execute deduplication with selected models
const deduplicateSelected = () => {
  // Convert selection to a map of models to keep
  const modelsToKeep = [];
  
  props.duplicates.forEach((group, index) => {
    const selectedId = selectedModels.value[index];
    if (selectedId) {
      modelsToKeep.push(selectedId);
    }
  });
  
  // Emit deduplicate event with models to keep
  emit('deduplicate', modelsToKeep);
  close();
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  width: 80%;
  max-width: 800px;
  max-height: 90vh;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  font-size: 1.25rem;
  margin: 0;
  color: #1f2937;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  max-height: 60vh;
}

.no-duplicates {
  text-align: center;
  padding: 2rem 0;
  color: #6b7280;
}

.info-text {
  margin-bottom: 1.5rem;
  color: #6b7280;
}

.duplicate-group {
  margin-bottom: 2rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.duplicate-group h3 {
  margin: 0;
  padding: 0.75rem 1rem;
  background-color: #f9fafb;
  font-size: 1rem;
  color: #111827;
  border-bottom: 1px solid #e5e7eb;
}

.models-container {
  padding: 0.5rem;
}

.model-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin: 0.5rem 0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.model-item:hover {
  background-color: #f3f4f6;
}

.model-item.selected {
  background-color: rgba(76, 110, 245, 0.1);
  border: 1px solid rgba(76, 110, 245, 0.3);
}

.model-info {
  flex: 1;
}

.model-name {
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.model-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #6b7280;
}

.model-select {
  margin-left: 1rem;
}

.radio {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #d1d5db;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.radio.checked {
  border-color: var(--color-primary, #4c6ef5);
  background-color: var(--color-primary, #4c6ef5);
  position: relative;
}

.radio.checked::after {
  content: "";
  width: 0.5rem;
  height: 0.5rem;
  background-color: white;
  border-radius: 9999px;
  position: absolute;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.btn-primary, .btn-secondary {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  border: none;
}

.btn-primary {
  background-color: var(--color-primary, #4c6ef5);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-darker, #405cd6);
}

.btn-primary:disabled {
  background-color: #d1d5db;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background-color: #f3f4f6;
  color: #4b5563;
}
</style> 