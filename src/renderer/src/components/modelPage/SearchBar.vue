<script setup>
import { defineProps, defineEmits, ref } from 'vue';

const props = defineProps({
  searchQuery: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['update:searchQuery']);

const clearSearch = () => {
  emit('update:searchQuery', '');
};

const isFocused = ref(false);

const handleFocus = () => {
  isFocused.value = true;
};

const handleBlur = () => {
  isFocused.value = false;
};
</script>

<template>
  <div class="search-container">
    <div class="search-wrapper" :class="{ 'is-focused': isFocused }">
      <i class="search-icon">🔍</i>
      <input
        type="text"
        :value="searchQuery"
        @input="($event) => emit('update:searchQuery', $event.target.value)"
        @focus="handleFocus"
        @blur="handleBlur"
        placeholder="搜索模型..."
        class="search-input"
      />
      <button v-if="searchQuery" @click="clearSearch" class="clear-search">
        ✕
      </button>
    </div>
  </div>
</template>

<style scoped>
.search-container {
  /* margin-bottom: 1.5rem; */
  padding: 1rem 1.5rem 0;
}

.search-wrapper {
  padding-right:12px;
  position: relative;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: #888;
  font-size: 1rem;
  font-style: normal;
  transition: color 0.3s ease;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(76, 110, 245, 0.2);
}

.clear-search {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: #888;
  font-size: 1rem;
  cursor: pointer;
  transition: color 0.3s ease;
}

.clear-search:hover {
  color: #555;
}

/* 添加搜索框聚焦时的脉冲动画 */
@keyframes searchPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}

.search-wrapper.is-focused {
  animation: searchPulse 0.3s ease;
}

.search-wrapper.is-focused .search-icon {
  color: var(--primary-color);
}
</style> 