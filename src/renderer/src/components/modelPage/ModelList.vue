<script setup>
import { ref, computed } from 'vue';
import ModelItem from './ModelItem.vue';

const props = defineProps({
  models: {
    type: Array,
    required: true,
  },
  searchQuery: {
    type: String,
    required: true,
  },
  selectedTags: {
    type: Array,
    required: true,
  },
  filterMode: {
    type: String,
    required: true,
  },
  sortBy: {
    type: String,
    required: true,
  },
  sortDirection: {
    type: String,
    required: true,
  },
});

const emit = defineEmits([
  'open-model',
  'open-config',
  'delete-model',
  'clone-model',
  'add-tag-to-filter',
]);

// For tracking expanded cards
const expandedCards = ref({});
const toggleExpand = (modelId) => {
  expandedCards.value[modelId] = !expandedCards.value[modelId];
};

// For model actions dropdown
const activeDropdownId = ref(null);
const toggleDropdown = (modelId, event) => {
  event.stopPropagation();
  activeDropdownId.value = activeDropdownId.value === modelId ? null : modelId;
};

const closeDropdowns = () => {
  activeDropdownId.value = null;
};

// Filtered and sorted models based on props
const filteredAndSortedModels = computed(() => {
  // First filter by search query
  let result = props.models.filter(
    (model) =>
      model.name.toLowerCase().includes(props.searchQuery.toLowerCase()) ||
      model.description.toLowerCase().includes(props.searchQuery.toLowerCase())
  );

  // Then filter by tags
  if (!props.selectedTags.includes('All')) {
    if (props.filterMode === 'any') {
      // Show models that have ANY of the selected tags (OR logic)
      result = result.filter((model) =>
        model.tags.some((tag) => props.selectedTags.includes(tag))
      );
    } else {
      // Show models that have ALL of the selected tags (AND logic)
      result = result.filter((model) =>
        props.selectedTags.every((tag) => model.tags.includes(tag))
      );
    }
  }

  // Then sort
  result.sort((a, b) => {
    let valueA = a[props.sortBy];
    let valueB = b[props.sortBy];

    // For dates, convert to timestamps for comparison
    if (props.sortBy === 'createdAt' || props.sortBy === 'lastUsedAt') {
      valueA = new Date(valueA).getTime();
      valueB = new Date(valueB).getTime();
    }

    if (props.sortDirection === 'asc') {
      return valueA > valueB ? 1 : -1;
    } else {
      return valueA < valueB ? 1 : -1;
    }
  });

  return result;
});

// Handler methods that forward events to parent
const handleOpenModel = (model, event) => {
  emit('open-model', model, event);
};

const handleOpenConfig = (model, event) => {
  emit('open-config', model, event);
  closeDropdowns();
};

const handleDeleteModel = (model, event) => {
  emit('delete-model', model, event);
};

const handleCloneModel = (model, event) => {
  emit('clone-model', model, event);
};

const handleAddTagToFilter = (tag, event) => {
  emit('add-tag-to-filter', tag, event);
};
</script>

<template>
  <div class="model-list" @click="closeDropdowns">
    <div v-if="filteredAndSortedModels.length === 0" class="no-results">
      <div class="no-results-icon">🔍</div>
      <p>没有找到符合条件的模型</p>
      <p class="no-results-hint">
        {{
          filterMode === 'all'
            ? '尝试切换到"包含任一标签"模式或选择较少的标签'
            : '尝试使用不同的标签或清除搜索'
        }}
      </p>
    </div>
    <div v-else class="model-cards-container">
      <ModelItem
        v-for="model in filteredAndSortedModels"
        :key="model.id"
        :model="model"
        :is-expanded="expandedCards[model.id]"
        :is-dropdown-active="activeDropdownId === model.id"
        @toggle-expand="toggleExpand(model.id)"
        @toggle-dropdown="toggleDropdown(model.id, $event)"
        @open-model="handleOpenModel(model, $event)"
        @open-config="handleOpenConfig(model, $event)"
        @delete-model="handleDeleteModel(model, $event)"
        @clone-model="handleCloneModel(model, $event)"
        @add-tag-to-filter="handleAddTagToFilter"
      />
    </div>
  </div>
</template>

<style scoped>
.model-list {
  flex:1;
  padding-right:10px;
  /* height: 100%; */
  overflow-y: auto;
  /* Scrollbar styling */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
}

.model-cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.2rem;
}

.no-results {
  background-color: white;
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  color: #64748b;
  font-size: 1.1rem;
  margin-top: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.no-results-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #94a3b8;
}

.no-results-hint {
  font-size: 0.9rem;
  color: #777;
  margin: 0.5rem 0;
  max-width: 80%;
  margin: 0.5rem auto;
}

/* Responsive adjustments for grid */
@media (max-width: 1200px) {
  .model-cards-container {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 640px) {
  .model-cards-container {
    grid-template-columns: 1fr;
  }
}
</style> 