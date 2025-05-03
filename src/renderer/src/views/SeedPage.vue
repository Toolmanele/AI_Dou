<template>
  <div class="seed-page">
    <div class="page-header">
      <h1>种子模板</h1>
      <div class="header-description">使用预配置的模板快速创建应用</div>
    </div>

    <div class="page-content">
      <Seed @import="handleSeedImport" />
    </div>

    <!-- App Creation Modal -->
    <AppCreateModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @create="handleAppCreated"
    />
  </div>
</template>

<script setup>
import { ref, provide } from "vue";
import { eventBus, EVENT_NAMES } from "../services/eventBus";
import Seed from "../components/appPage/Seed.vue";
import AppCreateModal from "../components/appPage/AppCreateModal.vue";

// State
const showCreateModal = ref(false);
const currentSeed = ref(null);

// Provide the seed data to any component that needs it
provide("seed-data", currentSeed);

// Handle seed import
function handleSeedImport(seed) {
  console.log("Importing seed:", seed);

  // Store the selected seed
  currentSeed.value = seed;

  // Open the app creation modal
  showCreateModal.value = true;
}

// Handle app creation
function handleAppCreated(newApp) {
  showCreateModal.value = false;
  console.log("New app created:", newApp);

  // Show success message
  alert(`已成功创建应用: ${newApp.name}`);

  // Reset current seed
  currentSeed.value = null;
}
</script>

<style scoped>
.seed-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-background);
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-strong);
  margin: 0 0 8px 0;
}

.header-description {
  font-size: 14px;
  color: var(--color-text-light);
}

.page-content {
  flex: 1;
  background-color: var(--color-card);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
</style>
