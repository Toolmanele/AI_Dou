<template>
  <div class="view-options">
    <button
      class="view-option"
      :class="{ active: modelValue === 'grid' }"
      @click="updateView('grid')"
      title="网格视图"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          d="M3 3v8h8V3H3zm6 6H5V5h4v4zm0 0H5V5h4v4zm2-6v8h8V3h-8zm6 6h-4V5h4v4zm-8 4v8h8v-8h-8zm6 6h-4v-4h4v4zm2-6v8h8v-8h-8zm6 6h-4v-4h4v4zM3 13v8h8v-8H3zm6 6H5v-4h4v4z"
        />
      </svg>
    </button>
    <button
      class="view-option"
      :class="{ active: modelValue === 'list' }"
      @click="updateView('list')"
      title="列表视图"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"
        />
      </svg>
    </button>
  </div>
</template>

<script setup>
defineOptions({
  name: 'ViewOptions',
});

// 接收当前视图模式作为v-model
const props = defineProps({
  modelValue: {
    type: String,
    default: 'grid',
    validator: (value) => ['grid', 'list', 'card', 'table'].includes(value),
  },
  // 可选参数，用于自定义可用的视图模式
  availableViews: {
    type: Array,
    default: () => ['grid', 'list'],
  },
});

// 发出更新事件
const emit = defineEmits(['update:modelValue']);

// 更新视图模式
const updateView = (view) => {
  if (props.availableViews.includes(view) && view !== props.modelValue) {
    emit('update:modelValue', view);
  }
};
</script>

<style scoped>
.view-options {
  display: flex;
  gap: 8px;
}

.view-option {
  background: none;
  border: 1px solid var(--color-border);
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--color-text-light);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-option:hover {
  background-color: var(--color-hover);
  color: var(--color-text-strong);
}

.view-option.active {
  background-color: var(--color-active);
  color: var(--color-primary);
  border-color: var(--color-primary);
}
</style>
