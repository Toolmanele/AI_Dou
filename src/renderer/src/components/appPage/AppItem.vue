<script setup>
import { defineProps, defineEmits } from "vue";

const props = defineProps({
  app: {
    type: Object,
    required: true,
  },
  isExpanded: {
    type: Boolean,
    default: false,
  },
  isDropdownActive: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "toggle-expand",
  "toggle-dropdown",
  "open-app",
  "open-config",
  "delete-app",
  "clone-app",
  "add-tag-to-filter",
]);

// Function to get random background color for app cards
const getRandomColor = (appId) => {
  const colors = [
    "rgba(76, 110, 245, 0.1)", // blue
    "rgba(94, 234, 212, 0.1)", // teal
    "rgba(249, 115, 22, 0.1)", // orange
    "rgba(168, 85, 247, 0.1)", // purple
    "rgba(236, 72, 153, 0.1)", // pink
  ];
  return colors[appId % colors.length];
};

// Function to show status text
const getStatusText = (status) => {
  switch (status) {
    case "setup":
      return "Setting up environment";
    case "pip":
      return "Configuring packages";
    case "model":
      return "Setting up model";
    case "completed":
      return "Ready to use";
    default:
      return "Unknown status";
  }
};
</script>

<template>
  <div class="app-card" :class="{ expanded: isExpanded }" tabindex="0">
    <div class="app-card-content">
      <!-- App Header -->
      <div class="app-card-header">
        <div class="app-icon" :title="app.name">{{ app.icon }}</div>
        <div class="app-info">
          <h3 class="app-name">{{ app.name }}</h3>
          <div class="app-meta-info">
            <span class="app-status" :class="app.status">
              {{ getStatusText(app.status) }}
            </span>
            <span class="app-tags-mini">
              <span
                v-for="(tag, index) in app.tags.slice(0, 2)"
                :key="tag"
                class="app-tag-mini"
                @click="emit('add-tag-to-filter', tag, $event)"
              >
                {{ tag
                }}{{ index < Math.min(app.tags.length, 2) - 1 ? "," : "" }}
              </span>
              <span v-if="app.tags.length > 2">...</span>
            </span>
          </div>
        </div>
      </div>

      <!-- App Description -->
      <p class="app-description">{{ app.description }}</p>

      <!-- App Progress -->
      <!-- <div v-if="app.status !== 'completed'" class="app-progress">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${app.setupProgress}%` }"
            :class="app.status"
          ></div>
        </div>
        <span class="progress-text">{{ app.setupProgress }}%</span>
      </div> -->

      <!-- App Actions -->
      <div class="app-actions">
        <button
          class="action-btn config-btn"
          @click="emit('open-config', $event)"
          title="Configure app"
        >
          Configure
        </button>
        <button
          class="action-btn start-btn"
          @click="emit('open-app', $event)"
          title="Start app"
        >
          Start
        </button>
        <div class="dropdown-container">
          <button
            class="action-btn more-btn"
            @click="emit('toggle-dropdown', $event)"
            title="More options"
          >
            •••
          </button>
          <div v-if="isDropdownActive" class="dropdown-menu" @click.stop>
            <!-- <button class="dropdown-item" @click="emit('clone-app', $event)">
              Clone
            </button>
            <button
              class="dropdown-item"
              @click="emit('toggle-expand', $event)"
            >
              {{ isExpanded ? "Hide Details" : "Show Details" }}
            </button> -->
            <button
              class="dropdown-item delete-item"
              @click="emit('delete-app', $event)"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Expanded Content -->
      <div v-if="isExpanded" class="expanded-content">
        <div class="app-details-expanded">
          <div class="app-detail-item">
            <span class="detail-label">Created:</span>
            <span class="detail-value">{{ app.createdAt }}</span>
          </div>
          <div class="app-detail-item">
            <span class="detail-label">Last Used:</span>
            <span class="detail-value">{{ app.lastUsedAt }}</span>
          </div>
          <div class="app-detail-item">
            <span class="detail-label">File Path:</span>
            <span class="detail-value file-path">{{ app.filePath }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-card {
  border-radius: 12px;
  overflow: hidden;
  background-color: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
}

.app-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.app-card-content {
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.app-card-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.8rem;
}

.app-icon {
  font-size: 2.2rem;
  padding: 0.8rem;
  border-radius: 12px;
  background: rgba(76, 110, 245, 0.08);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.app-info {
  flex-grow: 1;
  min-width: 0;
}

.app-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.3rem 0;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-meta-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.app-status {
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 20px;
  color: white;
  font-weight: 500;
}

.app-status.setup {
  background-color: #f59e0b;
}

.app-status.pip {
  background-color: #3b82f6;
}

.app-status.model {
  background-color: #8b5cf6;
}

.app-status.completed {
  background-color: #10b981;
}

.app-tags-mini {
  font-size: 0.75rem;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-tag-mini {
  margin-right: 0.25rem;
  cursor: pointer;
}

.app-tag-mini:hover {
  text-decoration: underline;
}

.app-description {
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #555;
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.app-progress {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.progress-bar {
  height: 8px;
  background-color: #f1f1f1;
  border-radius: 10px;
  overflow: hidden;
  flex-grow: 1;
}

.progress-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.progress-fill.setup {
  background-color: #f59e0b;
}

.progress-fill.pip {
  background-color: #3b82f6;
}

.progress-fill.model {
  background-color: #8b5cf6;
}

.progress-text {
  font-size: 0.8rem;
  color: #666;
  font-weight: 500;
  min-width: 40px;
  text-align: right;
}

.app-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

.action-btn {
  padding: 0.6rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.config-btn {
  background-color: #f1f5f9;
  color: #475569;
  flex-grow: 1;
}

.config-btn:hover {
  background-color: #e2e8f0;
}

.start-btn {
  background-color: var(--primary-color);
  color: white;
  flex-grow: 1;
}

.start-btn:hover {
  background-color: #4361d0;
}

.more-btn {
  background-color: #f1f5f9;
  color: #475569;
  padding: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.7rem;
}

.more-btn:hover {
  background-color: #e2e8f0;
}

.dropdown-container {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  bottom: calc(100% + 5px);
  right: 0;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  width: 150px;
  z-index: 10;
  animation: dropdownFade 0.2s ease;
}

@keyframes dropdownFade {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  padding: 0.8rem 1rem;
  width: 100%;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: #f8fafc;
}

.dropdown-item.delete-item {
  color: #ef4444;
}

.dropdown-item.delete-item:hover {
  background-color: #fef2f2;
}

.expanded-content {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
  animation: fadeIn 0.3s ease;
}

.app-details-expanded {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
}

.app-detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.app-detail-item:last-child {
  grid-column: span 2;
}

.detail-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
}

.detail-value {
  font-size: 0.9rem;
  color: #334155;
}

.detail-value.file-path {
  word-break: break-all;
  font-family: monospace;
  background-color: #f8fafc;
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .app-card-header {
    align-items: center;
  }

  .app-meta-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
  }
}
</style>
