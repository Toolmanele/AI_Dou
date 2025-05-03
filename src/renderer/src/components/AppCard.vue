<template>
  <div
    class="app-card"
    :class="{
      active: selected,
      [`app-card-${mode}`]: true,
      'app-card-small': small,
    }"
    @click="$emit('select', app.id)"
  >
    <!-- Icon section -->
    <div class="app-icon" :class="{ small: small || mode === 'list' }">
      <component v-if="app.icon" :is="app.icon" />
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        :width="small || mode === 'list' ? 24 : 50"
        :height="small || mode === 'list' ? 24 : 50"
        viewBox="0 0 24 24"
      >
        <path fill="#3b82f6" :d="getIconPath(app.icon)" />
      </svg>
    </div>

    <!-- Info section -->
    <div class="app-info">
      <h3>{{ app.name }}</h3>
      <p v-if="showDescription && app.description">{{ app.description }}</p>

      <!-- Meta data (status, date) -->
      <div v-if="showMeta" class="app-meta">
        <span v-if="app.status" class="app-status" :class="app.status">
          {{ app.statusText }}
        </span>
        <span v-if="app.lastUpdated" class="app-date">
          上次更新: {{ app.lastUpdated }}
        </span>
      </div>
    </div>

    <!-- Action buttons -->
    <div
      v-if="showActions"
      class="app-actions"
      :class="{ 'list-actions': mode === 'list' }"
    >
      <button
        v-if="showConfigButton"
        class="btn"
        :class="mode === 'list' ? 'btn-text' : 'btn-primary'"
        @click.stop="$emit('configure', app.id)"
      >
        配置
      </button>
      <button
        v-if="showRunButton"
        class="btn"
        :class="mode === 'list' ? 'btn-text' : 'btn-secondary'"
        @click.stop="$emit('run', app.id)"
      >
        运行
      </button>
      <button
        v-if="showMenuButton"
        class="btn btn-icon"
        @click.stop="$emit('menu', app.id, $event)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2z"
          />
        </svg>
      </button>
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: 'AppCard',
});

// Props
const props = defineProps({
  // App data object
  app: {
    type: Object,
    required: true,
  },
  // Display mode: 'grid', 'list', etc.
  mode: {
    type: String,
    default: 'grid',
  },
  // Whether this card is selected
  selected: {
    type: Boolean,
    default: false,
  },
  // Small size variant
  small: {
    type: Boolean,
    default: false,
  },
  // Whether to show description
  showDescription: {
    type: Boolean,
    default: true,
  },
  // Whether to show meta information
  showMeta: {
    type: Boolean,
    default: true,
  },
  // Whether to show action buttons
  showActions: {
    type: Boolean,
    default: true,
  },
  // Whether to show configure button
  showConfigButton: {
    type: Boolean,
    default: true,
  },
  // Whether to show run button
  showRunButton: {
    type: Boolean,
    default: true,
  },
  // Whether to show menu button
  showMenuButton: {
    type: Boolean,
    default: true,
  },
});

// Events
defineEmits(['select', 'configure', 'run', 'menu']);

// Helper function to get icon path based on icon name
function getIconPath(iconName) {
  const iconPaths = {
    robot:
      'M12 2a2 2 0 0 1 2 2c0 .74-.4 1.38-1 1.72V7h2a8 8 0 0 1 8 8v2h-2v-2a6 6 0 0 0-6-6h-6a6 6 0 0 0-6 6v2H1v-2a8 8 0 0 1 8-8h2V5.72c-.6-.34-1-.98-1-1.72a2 2 0 0 1 2-2m-4 9c.18 0 .35 0 .53.05c.5.11 1 .38 1.06.94v5c0 .61-.46 1.05-1.08 1.05c-.57 0-1.08-.45-1.08-1.05v-5c0-.53.58-.94 1.08-.94M16 11c.56 0 1.08.38 1.08.94v5c0 .61-.46 1.05-1.08 1.05c-.57 0-1.08-.45-1.08-1.05v-5c0-.53.58-.94 1.08-.94Z',
    document:
      'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 5h5.5L18 11.5V20H6V4h7v3zm-2 8v-1H7v1h4zm0-3v-1H7v1h4zm5 3v-1h-4v1h4zm0-3v-1h-4v1h4z',
    chart:
      'M9 17H7v-7h2v7Zm4 0h-2V7h2v10Zm4 0h-2v-4h2v4Zm2 2H5V5h14v14ZM5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5Z',
    image:
      'M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5zm14 4a1 1 0 1 1-2 0a1 1 0 0 1 2 0zm-4.76 9.97L11 13.83l-3 2.3L8 16l3-2.3l3.24 3.14l3.76-4.9V17H6V9h12v7.97l-3.76-4z',
    file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z',
    globe:
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93c0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41c0 2.08-.8 3.97-2.1 5.39z',
    plug: 'M16 7V3h-2v4h-2V3H8v4H6v4h2v10h8V11h2V7h-2zM8.5 15c-.28 0-.5-.22-.5-.5s.22-.5.5-.5s.5.22.5.5s-.22.5-.5.5zm7 0c-.28 0-.5-.22-.5-.5s.22-.5.5-.5s.5.22.5.5s-.22.5-.5.5zM11 11V7h2v4h-2z',
    computer:
      'M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z',
    app: 'M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z',
  };

  return iconPaths[iconName] || iconPaths.app;
}
</script>

<style scoped>
.app-card {
  background-color: var(--color-card);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  padding: 16px;
  display: flex;
  border: 1px solid var(--color-border);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
}

/* Grid mode */
.app-card-grid {
  flex-direction: column;
}

/* List mode */
.app-card-list {
  flex-direction: row;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
}

.app-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.app-card.active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.app-icon {
  width: 60px;
  height: 60px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-icon.small {
  width: 32px;
  height: 32px;
  margin-bottom: 0;
  flex-shrink: 0;
}

.app-icon img,
.app-icon svg {
  max-width: 100%;
  max-height: 100%;
}

.app-info {
  flex: 1;
}

.app-card-grid .app-info {
  margin-bottom: 16px;
}

.app-info h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--color-text-strong);
}

.app-card-list .app-info h3 {
  font-size: 14px;
  margin-bottom: 4px;
}

.app-info p {
  font-size: 14px;
  color: var(--color-text-light);
  margin-bottom: 16px;
}

.app-card-list .app-info p {
  font-size: 12px;
  margin-bottom: 0;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.app-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  margin-bottom: 16px;
}

.app-card-list .app-meta {
  margin-bottom: 0;
}

.app-status {
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.app-status.active {
  background-color: rgba(34, 197, 94, 0.1);
  color: rgb(34, 197, 94);
}

.app-status.inactive {
  background-color: rgba(156, 163, 175, 0.1);
  color: rgb(156, 163, 175);
}

.app-date {
  color: var(--color-text-light);
}

.app-actions {
  display: flex;
  gap: 8px;
}

.list-actions {
  justify-content: flex-end;
  min-width: 140px;
}

/* Button styles */
.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
}

.btn-secondary {
  background-color: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.btn-secondary:hover {
  background-color: var(--color-hover);
}

.btn-text {
  background-color: transparent;
  color: var(--color-primary);
  padding: 4px 8px;
}

.btn-text:hover {
  background-color: var(--color-hover);
}

.btn-icon {
  background: none;
  border: none;
  color: var(--color-text-light);
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
}

.btn-icon:hover {
  background-color: var(--color-hover);
  color: var(--color-text-strong);
}
</style>
