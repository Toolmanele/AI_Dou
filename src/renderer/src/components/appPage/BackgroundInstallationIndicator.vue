<script setup>
// 导入 computed API，用于动态计算显示文本
import { computed } from 'vue'

const props = defineProps({
  installations: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['click'])

// 计算安装数量文本
const countText = computed(() => {
  const count = props.installations.length
  return `${count} 个应用正在后台安装`
})

// 点击事件处理
const handleClick = () => {
  emit('click')
}
</script>

<template>
  <div
    v-if="installations.length > 0"
    class="background-installations-indicator"
    @click="handleClick"
  >
    <div class="indicator-icon">
      <span class="spinner"></span>
    </div>
    <div class="indicator-text">
      {{ countText }}
    </div>
  </div>
</template>

<style scoped>
.background-installations-indicator {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.background-installations-indicator:hover {
  background-color: rgba(0, 0, 0, 0.8);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.indicator-icon {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-primary);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.9);
}

.spinner {
  width: 12px;
  height: 12px;
  border: 2px solid transparent;
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.indicator-text {
  font-size: 0.9rem;
  color: white;
  font-weight: 500;
}
</style>
