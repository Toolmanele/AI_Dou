<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  model: {
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
  'toggle-expand',
  'toggle-dropdown',
  'open-model',
  'open-config',
  'delete-model',
  'clone-model',
  'add-tag-to-filter',
]);

// Function to get status text and class
const getStatusClass = (status) => {
  switch (status) {
    case 'running':
      return 'running';
    case 'stopped':
      return 'stopped';
    case 'error':
      return 'error';
    default:
      return '';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'running':
      return '运行中';
    case 'stopped':
      return '已停止';
    case 'error':
      return '出错';
    default:
      return '未知状态';
  }
};
</script>

<template>
  <div class="model-card" :class="{ expanded: isExpanded }" tabindex="0">
    <div class="model-card-content">
      <!-- Model Header -->
      <div class="model-card-header">
        <div class="model-icon" :title="model.name">{{ model.icon }}</div>
        <div class="model-info">
          <h3 class="model-name">{{ model.name }}</h3>
          <div class="model-meta-info">
            <span class="model-status" :class="getStatusClass(model.status)">
              {{ getStatusText(model.status) }}
            </span>
            <span class="model-tags-mini">
              <span
                v-for="(tag, index) in model.tags.slice(0, 2)"
                :key="tag"
                class="model-tag-mini"
                @click="emit('add-tag-to-filter', tag, $event)"
              >
                {{ tag
                }}{{ index < Math.min(model.tags.length, 2) - 1 ? ',' : '' }}
              </span>
              <span v-if="model.tags.length > 2">...</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Model Description -->
      <p class="model-description">{{ model.description }}</p>

      <!-- Model Info -->
      <div class="model-details">
        <div class="info-item">
          <span class="info-label">API版本</span>
          <span class="info-value">{{ model.version }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">性能</span>
          <span class="info-value">{{ model.performance }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">请求量</span>
          <span class="info-value">{{ model.requestsPerDay.toLocaleString() }} / 日</span>
        </div>
        <div class="info-item">
          <span class="info-label">响应时间</span>
          <span class="info-value">{{ model.responseTime }}</span>
        </div>
      </div>

      <!-- Model Actions -->
      <div class="model-actions">
        <button
          class="action-btn config-btn"
          @click="emit('open-config', $event)"
          title="配置模型"
        >
          配置
        </button>
        <button
          v-if="model.status !== 'running'"
          class="action-btn start-btn"
          @click="emit('open-model', $event)"
          title="启动模型"
        >
          启动
        </button>
        <button
          v-else
          class="action-btn stop-btn"
          @click="emit('open-model', $event)"
          title="停止模型"
        >
          停止
        </button>
        <div class="dropdown-container">
          <button
            class="action-btn more-btn"
            @click="emit('toggle-dropdown', $event)"
            title="更多选项"
          >
            •••
          </button>
          <div v-if="isDropdownActive" class="dropdown-menu" @click.stop>
            <button class="dropdown-item" @click="emit('clone-model', $event)">
              克隆
            </button>
            <button
              class="dropdown-item"
              @click="emit('toggle-expand', $event)"
            >
              {{ isExpanded ? '隐藏详情' : '显示详情' }}
            </button>
            <button
              class="dropdown-item delete-item"
              @click="emit('delete-model', $event)"
            >
              删除
            </button>
          </div>
        </div>
      </div>

      <!-- Expanded Content -->
      <div v-if="isExpanded" class="expanded-content">
        <div class="model-details-expanded">
          <div class="model-detail-item">
            <span class="detail-label">创建时间:</span>
            <span class="detail-value">{{ model.createdAt }}</span>
          </div>
          <div class="model-detail-item">
            <span class="detail-label">最后使用:</span>
            <span class="detail-value">{{ model.lastUsedAt }}</span>
          </div>
          <div class="model-detail-item">
            <span class="detail-label">标签:</span>
            <div class="model-tags">
              <span
                v-for="tag in model.tags"
                :key="tag"
                class="model-tag"
                @click="emit('add-tag-to-filter', tag, $event)"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.model-card {
  border-radius: 12px;
  overflow: hidden;
  background-color: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
}

.model-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.model-card-content {
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.model-card-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.8rem;
}

.model-icon {
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

.model-info {
  flex-grow: 1;
  min-width: 0;
}

.model-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.3rem 0;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-meta-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.model-status {
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 20px;
  color: white;
  font-weight: 500;
}

.model-status.running {
  background-color: #10b981;
}

.model-status.stopped {
  background-color: #6b7280;
}

.model-status.error {
  background-color: #ef4444;
}

.model-tags-mini {
  font-size: 0.75rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-tag-mini {
  cursor: pointer;
  transition: color 0.2s;
}

.model-tag-mini:hover {
  color: var(--primary-color);
  text-decoration: underline;
}

.model-description {
  margin: 0.5rem 0 1rem;
  font-size: 0.9rem;
  color: #4b5563;
  line-height: 1.4;
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.8rem;
  margin-bottom: 1rem;
  padding: 0.8rem;
  background-color: #f9fafb;
  border-radius: 8px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.7rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 0.85rem;
  font-weight: 500;
  color: #1f2937;
}

.model-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
  position: relative;
}

.action-btn {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.config-btn {
  background-color: rgba(76, 110, 245, 0.1);
  color: var(--primary-color);
}

.config-btn:hover {
  background-color: rgba(76, 110, 245, 0.2);
}

.start-btn {
  background-color: #10b981;
  color: white;
}

.start-btn:hover {
  background-color: #059669;
}

.stop-btn {
  background-color: #ef4444;
  color: white;
}

.stop-btn:hover {
  background-color: #dc2626;
}

.more-btn {
  padding: 0.5rem;
  background-color: transparent;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  flex: 0 0 auto;
  width: 36px;
}

.more-btn:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.dropdown-container {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 0.5rem 0;
  z-index: 10;
  min-width: 150px;
  margin-top: 0.5rem;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 0.6rem 1rem;
  text-align: left;
  background: none;
  border: none;
  font-size: 0.85rem;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.dropdown-item:hover {
  background-color: #f3f4f6;
  color: #1f2937;
}

.delete-item {
  color: #ef4444;
}

.delete-item:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

.expanded-content {
  margin-top: 1.2rem;
  padding-top: 1.2rem;
  border-top: 1px solid #e5e7eb;
}

.model-details-expanded {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.model-detail-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.detail-label {
  font-weight: 500;
  color: #4b5563;
  flex: 0 0 40%;
}

.detail-value {
  color: #1f2937;
}

.file-path {
  font-family: monospace;
  background-color: #f3f4f6;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-size: 0.8rem;
  word-break: break-all;
}

.model-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.model-tag {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  background-color: rgba(76, 110, 245, 0.1);
  color: var(--primary-color);
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.model-tag:hover {
  background-color: rgba(76, 110, 245, 0.2);
}
</style> 