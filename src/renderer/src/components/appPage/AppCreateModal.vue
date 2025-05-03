<template>
  <AppCreateModalRefactored
    :existingApp="existingApp"
    :isEditing="isEditing"
    @close="$emit('close')"
    @create="$emit('create', $event)"
    @update="$emit('update', $event)"
    @openSettings="$emit('openSettings')"
  />
</template>

<script setup>
import { defineProps, defineEmits } from "vue";
// import AppCreateModalRefactored from "./appcreatemodal/AppCreateModalRefactored.vue";
import AppCreateModalRefactored from "./appcreatemodalplus/AppCreateModalPlus.vue";
// Props to receive existing app data when editing
const props = defineProps({
  existingApp: {
    type: Object,
    default: null,
  },
  isEditing: {
    type: Boolean,
    default: false,
  },
});

// Emit events
defineEmits(["close", "create", "update", "openSettings"]);
</script>
