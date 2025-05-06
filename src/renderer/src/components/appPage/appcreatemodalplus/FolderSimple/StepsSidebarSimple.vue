<template>
  <div class="sidebar">
    <div class="steps">
      <div
        v-for="(step, index) in steps"
        :key="index"
        class="step"
        :class="{
          active: currentStep === index,
          done: index < currentStep
        }"
        @click="handleStepClick(index)"
      >
        <div class="step-marker">
          <!-- <span v-if="index < currentStep">✓</span> -->
          <span>{{ index + 1 }}</span>
        </div>
        <div class="step-title">{{ step.title }}</div>
      </div>
    </div>

    <div class="actions">
      <div class="action-buttons">
        <button class="reset-button" @click="$emit('reset')" title="重置表单">
          <span class="reset-icon">🔄</span>
        </button>

        <button
          class="create-button"
          :disabled="isConfigMode ? !canSaveConfig : !canCreateApp"
          :class="{ loading: isConfigMode ? isSaving : isCreating }"
          @click="handleActionClick"
        >
          <span class="create-text">
            {{ actionButtonText }}
          </span>
          <span v-if="isConfigMode ? isSaving : isCreating" class="loading-icon"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  currentStep: {
    type: Number,
    required: true
  },
  canCreateApp: {
    type: Boolean,
    default: false
  },
  canSaveConfig: {
    type: Boolean,
    default: false
  },
  isCreating: {
    type: Boolean,
    default: false
  },
  isSaving: {
    type: Boolean,
    default: false
  },
  isConfigMode: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['step-change', 'reset', 'create', 'save'])

// Computed steps based on mode
const steps = computed(() => {
  const baseSteps = [
    { title: '基本信息', key: 'basic' },
    { title: 'Python环境', key: 'python' },
    { title: '目录设置', key: 'directory' }
  ]

  // If not in config mode, add GitHub setup step
  // if (!props.isConfigMode) {
  //   // Insert GitHub setup as second step
  //   baseSteps.splice(1, 0, { title: "GitHub设置", key: "github" });
  // }

  return baseSteps
})

// Compute the action button text
const actionButtonText = computed(() => {
  if (props.isConfigMode) {
    return props.isSaving ? '保存中...' : '保存配置'
  } else {
    return props.isCreating ? '创建中...' : '创建应用'
  }
})

// Handle step click
function handleStepClick(index) {
  emit('step-change', index)
}

// Handle action button click
function handleActionClick() {
  if (props.isConfigMode) {
    if (!props.isSaving && props.canSaveConfig) {
      emit('save')
    }
  } else {
    if (!props.isCreating && props.canCreateApp) {
      emit('create')
    }
  }
}
</script>

<style scoped>
.sidebar {
  width: 200px;
  background-color: var(--color-sidebar);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 600px;
}

.steps {
  /* padding-top: 20px; */
}

.step {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.step:hover {
  color: var(--color-card-hover);
  background-color: var(--color-primary-light-light);
}

.step.active {
  color: var(--color-card);
  background-color: var(--color-primary);
}

/* .step.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: var(--color-primary);
} */

.step-marker {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--color-text-lighter);
  color: var(--color-text-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 12px;
}

.step.active .step-marker {
  color: var(--color-text);
  background-color: var(--color-background);
}

.step.done .step-marker {
  background-color: var(--color-success);
}

.step-title {
  font-size: 14px;
  color: var(--color-text-normal);
}

.step.active .step-title {
  /* color: var(--color-card); */
  font-weight: 500;
}

.actions {
  padding: 20px;
  border-top: 1px solid var(--color-border);
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.reset-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 4px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-button:hover {
  background-color: #e9ecef;
}

.reset-icon {
  font-size: 16px;
  line-height: 1;
}

.create-button {
  flex: 1;
  height: 36px;
  border-radius: 4px;
  background-color: var(--color-primary);
  border: none;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.create-button:disabled {
  background-color: #adb5bd;
  cursor: not-allowed;
  opacity: 0.7;
}

.create-button:not(:disabled):hover {
  background-color: var(--color-primary-dark);
}

.create-text {
  white-space: nowrap;
}

.loading-icon {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s infinite linear;
  margin-left: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
