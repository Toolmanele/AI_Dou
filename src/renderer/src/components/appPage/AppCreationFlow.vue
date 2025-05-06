<template>
  <div>
    <!-- Source Selection Modal -->
    <AppSourceSelectionModal
      v-if="showSourceSelectionModal"
      @close="closeSourceSelectionModal"
      @select="handleSourceSelection"
    />

    <!-- App Creation Modal -->
    <AppCreateModalPlusFolder
      v-if="showAppCreateModal && store.creatingApp.from === 'folder'"
      :existingApp="existingApp"
      :isEditing="isEditing"
      @close="closeAppCreateModal"
      @create="handleAppCreated"
      @update="handleAppUpdated"
      @openSettings="handleOpenSettings"
    />

    <!-- App Creation Modal -->
    <AppCreateModalPlusGitHub
      v-if="showAppCreateModal && store.creatingApp.from === 'github'"
      :existingApp="existingApp"
      :isEditing="isEditing"
      @close="closeAppCreateModal"
      @create="handleAppCreated"
      @update="handleAppUpdated"
      @openSettings="handleOpenSettings"
    />

    <!-- App Creation Modal -->
    <AppCreateModalPlusSeed
      v-if="showAppCreateModal && store.creatingApp.from === 'seed'"
      :existingApp="existingApp"
      :isEditing="isEditing"
      @close="closeAppCreateModal"
      @create="handleAppCreated"
      @update="handleAppUpdated"
      @openSettings="handleOpenSettings"
    />
  </div>
</template>

<script setup>
console.log('AppCreationFlow Show')
import { ref } from 'vue'
import {
  AppCreateModalPlus,
  AppSourceSelectionModal,
  AppCreateModalPlusFolder,
  AppCreateModalPlusGitHub,
  AppCreateModalPlusSeed
} from './appcreatemodalplus'
import createAppStore from '@stores/ai_dou_createApp'

const store = createAppStore()

// Props
const props = defineProps({
  existingApp: {
    type: Object,
    default: null
  },
  isEditing: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['close', 'create', 'update', 'openSettings'])

// Component state
const showSourceSelectionModal = ref(false)
const showAppCreateModal = ref(false)

// Public methods (exposed to parent components)
function openAppCreation() {
  // If editing an existing app, skip source selection
  if (props.isEditing && props.existingApp) {
    store.loadExistingApp(props.existingApp)
    showAppCreateModal.value = true
  } else {
    // For new apps, show source selection first
    showSourceSelectionModal.value = true
  }
}

// Close source selection modal
function closeSourceSelectionModal() {
  showSourceSelectionModal.value = false
  emit('close')
}

// Handle source selection
function handleSourceSelection(source) {
  console.log('Selected source:', source)
  showSourceSelectionModal.value = false
  showAppCreateModal.value = true
}

// Close app creation modal
function closeAppCreateModal() {
  showAppCreateModal.value = false
  emit('close')
}

// Handle app creation
function handleAppCreated(app) {
  emit('create', app)
  showAppCreateModal.value = false
}

// Handle app update
function handleAppUpdated(app) {
  emit('update', app)
  showAppCreateModal.value = false
}

// Handle settings
function handleOpenSettings() {
  emit('openSettings')
}

// Expose methods to parent components
defineExpose({
  openAppCreation
})
</script>
