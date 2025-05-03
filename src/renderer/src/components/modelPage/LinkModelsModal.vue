<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="modal-container">
      <div class="modal-header">
        <h2>模型链接</h2>
        <button class="close-button" @click="close">×</button>
      </div>
      
      <div class="modal-body">
        <div class="link-models-content">
          <div class="step-indicator">
            <div class="step" :class="{ active: currentStep === 1 }">1. 选择源模型</div>
            <div class="step-divider"></div>
            <div class="step" :class="{ active: currentStep === 2 }">2. 选择目标模型</div>
          </div>
          
          <div v-if="currentStep === 1" class="model-selection">
            <h3>选择要链接的源模型</h3>
            <p class="info-text">请选择作为源模型的一个或多个模型：</p>
            
            <div class="models-container">
              <div 
                v-for="model in availableModels" 
                :key="model.id" 
                class="model-item"
                :class="{ selected: sourceModels.includes(model.id) }"
                @click="toggleSourceModel(model.id)"
              >
                <div class="model-info">
                  <div class="model-name">{{ model.name }}</div>
                  <div class="model-meta">
                    <span class="model-version">版本: {{ model.version }}</span>
                    <span class="model-type">类型: {{ model.type }}</span>
                  </div>
                </div>
                <div class="model-select">
                  <div class="checkbox" :class="{ checked: sourceModels.includes(model.id) }"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="currentStep === 2" class="model-selection">
            <h3>选择目标模型</h3>
            <p class="info-text">请选择要链接到的目标模型：</p>
            
            <div class="models-container">
              <div 
                v-for="model in targetModelsList" 
                :key="model.id" 
                class="model-item"
                :class="{ selected: targetModel === model.id, disabled: sourceModels.includes(model.id) }"
                @click="selectTargetModel(model.id)"
              >
                <div class="model-info">
                  <div class="model-name">{{ model.name }}</div>
                  <div class="model-meta">
                    <span class="model-version">版本: {{ model.version }}</span>
                    <span class="model-type">类型: {{ model.type }}</span>
                  </div>
                </div>
                <div class="model-select">
                  <div class="radio" :class="{ checked: targetModel === model.id }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button 
          v-if="currentStep === 2" 
          class="btn-outline" 
          @click="currentStep = 1"
        >
          返回
        </button>
        <button class="btn-secondary" @click="close">取消</button>
        <button 
          v-if="currentStep === 1"
          class="btn-primary" 
          @click="goToStep2"
          :disabled="sourceModels.length === 0"
        >
          下一步
        </button>
        <button 
          v-if="currentStep === 2"
          class="btn-primary" 
          @click="linkSelectedModels"
          :disabled="!targetModel"
        >
          确认链接
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
  models: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'link']);

const currentStep = ref(1);
const sourceModels = ref([]);
const targetModel = ref(null);

// Reset when the modal is opened or closed
watch(() => props.show, (newValue) => {
  if (newValue) {
    currentStep.value = 1;
    sourceModels.value = [];
    targetModel.value = null;
  }
});

// All available models for selection
const availableModels = computed(() => {
  return props.models;
});

// Models that can be selected as target (excluding sources)
const targetModelsList = computed(() => {
  return props.models.filter(model => !sourceModels.value.includes(model.id));
});

const toggleSourceModel = (modelId) => {
  const index = sourceModels.value.indexOf(modelId);
  if (index === -1) {
    sourceModels.value.push(modelId);
  } else {
    sourceModels.value.splice(index, 1);
  }
};

const selectTargetModel = (modelId) => {
  // Cannot select a source model as target
  if (sourceModels.value.includes(modelId)) return;
  targetModel.value = modelId;
};

const goToStep2 = () => {
  if (sourceModels.value.length > 0) {
    currentStep.value = 2;
  }
};

const linkSelectedModels = () => {
  if (targetModel.value && sourceModels.value.length > 0) {
    emit('link', {
      sourceModelIds: sourceModels.value,
      targetModelId: targetModel.value
    });
    close();
  }
};

const close = () => {
  emit('close');
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

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
}

.step {
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  background-color: #f3f4f6;
  color: #6b7280;
  font-weight: 500;
  transition: all 0.2s;
}

.step.active {
  background-color: var(--color-primary, #4c6ef5);
  color: white;
}

.step-divider {
  height: 2px;
  width: 4rem;
  background-color: #e5e7eb;
  margin: 0 1rem;
}

.model-selection h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #111827;
  font-size: 1.1rem;
}

.info-text {
  margin-bottom: 1.5rem;
  color: #6b7280;
}

.models-container {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  max-height: 40vh;
  overflow-y: auto;
}

.model-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: background-color 0.2s;
}

.model-item:last-child {
  border-bottom: none;
}

.model-item:hover:not(.disabled) {
  background-color: #f3f4f6;
}

.model-item.selected {
  background-color: rgba(76, 110, 245, 0.1);
  border-color: rgba(76, 110, 245, 0.3);
}

.model-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #f9fafb;
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

.checkbox {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.checkbox.checked {
  border-color: var(--color-primary, #4c6ef5);
  background-color: var(--color-primary, #4c6ef5);
  position: relative;
}

.checkbox.checked::after {
  content: "✓";
  color: white;
  font-size: 0.8rem;
  font-weight: bold;
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

.btn-primary, .btn-secondary, .btn-outline {
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

.btn-outline {
  background-color: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.btn-outline:hover {
  background-color: #f3f4f6;
  color: #4b5563;
}
</style> 