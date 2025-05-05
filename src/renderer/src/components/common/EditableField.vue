<template>
  <div class="editable-field-container">
    <template v-if="isEditing">
      <component
        :is="inputType"
        v-model="tempValue"
        :placeholder="placeholder"
        :class="{ error: error }"
        :style="{ width: '100%' }"
        :rows="rows"
        @keyup.enter="inputType === 'input' ? saveEdit() : null"
      />
      <div class="edit-actions">
        <button class="edit-btn save" @click="saveEdit" :title="saveTitle">✓</button>
        <button class="edit-btn cancel" @click="cancelEdit" :title="cancelTitle">✕</button>
      </div>
    </template>
    <template v-else>
      <div class="field-display">
        <span class="field-value" :class="{ description: inputType === 'textarea' }">
          {{ modelValue || emptyText }}
        </span>
        <button class="edit-btn" @click="startEditing" :title="editTitle">✎</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  inputType: {
    type: String,
    default: 'input', // 'input' or 'textarea'
    validator: (value) => ['input', 'textarea'].includes(value)
  },
  placeholder: {
    type: String,
    default: ''
  },
  emptyText: {
    type: String,
    default: '未设置'
  },
  rows: {
    type: Number,
    default: 3
  },
  error: {
    type: String,
    default: ''
  },
  editTitle: {
    type: String,
    default: '编辑'
  },
  saveTitle: {
    type: String,
    default: '保存'
  },
  cancelTitle: {
    type: String,
    default: '取消'
  }
})

const emit = defineEmits(['update:modelValue'])

const isEditing = ref(false)
const tempValue = ref('')

function startEditing() {
  tempValue.value = props.modelValue
  isEditing.value = true
}

function saveEdit() {
  // For required fields, you can add validation here
  if (props.inputType === 'input' && props.error && !tempValue.value.trim()) {
    return
  }

  emit('update:modelValue', tempValue.value)
  isEditing.value = false
}

function cancelEdit() {
  isEditing.value = false
}

// Keep tempValue in sync with modelValue when it changes externally
watch(
  () => props.modelValue,
  (newValue) => {
    if (!isEditing.value) {
      tempValue.value = newValue
    }
  }
)
</script>

<style scoped>
.editable-field-container {
  position: relative;
  width: 100%;
}

.field-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  min-height: 42px;
}

.field-value {
  flex: 1;
  color: #374151;
  word-break: break-word;
}

.field-value.description {
  white-space: pre-line;
  min-height: 60px;
}

.edit-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.edit-btn:hover {
  color: #4b5563;
  background-color: #e5e7eb;
}

.edit-actions {
  display: flex;
  margin-top: 8px;
  justify-content: flex-end;
  gap: 8px;
}

.edit-btn.save {
  color: #059669;
}

.edit-btn.save:hover {
  background-color: #ecfdf5;
}

.edit-btn.cancel {
  color: #dc2626;
}

.edit-btn.cancel:hover {
  background-color: #fef2f2;
}

input,
textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  color: #374151;
  background-color: white;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

input.error,
textarea.error {
  border-color: #dc2626;
}
</style>
