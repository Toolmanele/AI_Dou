<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  availableTags: {
    type: Array,
    required: true,
  },
  selectedTags: {
    type: Array,
    required: true,
  },
  tagCounts: {
    type: Object,
    required: true,
  },
  filterMode: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['toggle-tag', 'toggle-filter-mode', 'reset-filters']);

const isTagSelected = (tag) => {
  return props.selectedTags.includes(tag);
};
</script>

<template>
  <div class="tags-section">
    <!-- <div class="tags-header">
      <h3>Filter by Tags</h3>
      <div class="filter-controls">
        <button
          v-if="!selectedTags.includes('All')"
          @click="emit('reset-filters')"
          class="reset-button"
          title="Reset all filters"
        >
          Clear
        </button>
      </div>
    </div> -->

    <!-- <div
      v-if="!selectedTags.includes('All')"
      class="filter-mode-toggle-container"
    >
      <span class="filter-mode-label">Filter mode:</span>
      <div class="filter-mode-buttons">
        <button
          @click="emit('toggle-filter-mode')"
          class="filter-mode-button"
          :class="{ active: filterMode === 'all' }"
          title="Apps must have ALL selected tags"
        >
          AND
        </button>
        <button
          @click="emit('toggle-filter-mode')"
          class="filter-mode-button"
          :class="{ active: filterMode === 'any' }"
          title="Apps can have ANY selected tag"
        >
          OR
        </button>
      </div>
    </div> -->

    <!-- <div
      class="selected-tags"
      v-if="!selectedTags.includes('All') && selectedTags.length > 0"
    >
      <div class="selected-tags-header">Selected tags:</div>
      <div class="selected-tags-list">
        <div
          v-for="tag in selectedTags"
          :key="tag"
          class="selected-tag"
          @click="emit('toggle-tag', tag)"
        >
          {{ tag }} <span class="remove-tag">×</span>
        </div>
      </div>
    </div> -->

    <div class="tags-list">
      <button
        v-for="tag in availableTags"
        :key="tag"
        @click="emit('toggle-tag', tag)"
        class="tag-item"
        :class="{ selected: isTagSelected(tag) }"
      >
        <span class="tag-name">{{ tag }}</span>
        <span v-if="tag !== 'All'" class="tag-count">
          {{ tagCounts[tag] || 0 }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.tags-section {
  flex:1;
  overflow-y: auto;
  /* Scrollbar styling */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
}

.tags-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.tags-header h3 {
  font-size: 1.1rem;
  margin: 0;
  color: #334155;
  font-weight: 600;
}

.filter-controls {
  display: flex;
  gap: 0.5rem;
}

.reset-button {
  background-color: rgba(76, 110, 245, 0.1);
  border: 1px solid rgba(76, 110, 245, 0.2);
  border-radius: 6px;
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--primary-color);
}

.reset-button:hover {
  background-color: rgba(76, 110, 245, 0.2);
}

.filter-mode-toggle-container {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  gap: 0.5rem;
  justify-content: space-between;
}

.filter-mode-label {
  font-size: 0.9rem;
  color: #64748b;
}

.filter-mode-buttons {
  display: flex;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.filter-mode-button {
  background: none;
  border: none;
  padding: 0.3rem 0.8rem;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: #64748b;
}

.filter-mode-button.active {
  background-color: var(--primary-color);
  color: white;
}

.selected-tags {
  margin-bottom: 1.25rem;
}

.selected-tags-header {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.selected-tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.selected-tag {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background-color: var(--primary-color);
  color: white;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.selected-tag:hover {
  opacity: 0.9;
}

.remove-tag {
  font-size: 1.1rem;
  font-weight: bold;
  margin-left: 0.2rem;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  overflow-y: auto;
  padding-right: 0.25rem;

}

.tags-list::-webkit-scrollbar {
  width: 4px;
}

.tags-list::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.3rem 0.7rem;
  background-color: rgba(76, 110, 245, 0.1);
  border: none;
  border-radius: 5px;
  font-size: 0.85rem;
  color: #4c6ef5;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  margin: 0 0.1rem 0.5rem 0;
}

.tag-item:hover {
  background-color: rgba(76, 110, 245, 0.2);
}

.tag-item.selected {
  background-color: var(--primary-color);
  color: white;
  box-shadow: 0 2px 4px rgba(76, 110, 245, 0.25);
}

.tag-name {
  white-space: nowrap;
  margin-right: 0.3rem;
}

.tag-count {
  font-size: 0.7rem;
  font-weight: 500;
  background-color: rgba(255, 255, 255, 0.25);
  padding: 0.1rem 0.3rem;
  border-radius: 10px;
  min-width: 1.2rem;
  text-align: center;
  flex-shrink: 0;
}

.tag-item.selected .tag-count {
  background-color: rgba(255, 255, 255, 0.3);
  color: white;
}

/* Add subtle animation when selecting tags */
@keyframes selectPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.tag-item.selected {
  animation: selectPulse 0.3s ease;
}
</style>
