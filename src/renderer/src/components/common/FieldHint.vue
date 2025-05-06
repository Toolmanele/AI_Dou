<template>
  <div class="field-hint">
    <tooltip v-if="hint" :position="position">
      <label class="field-label">
        <slot></slot>
      </label>
      <template #content>
        <div class="source-hint" v-if="typeof hint === 'string'">{{ hint }}</div>
        <div class="source-hint" v-else>
          <slot name="hint-content"></slot>
        </div>
      </template>
    </tooltip>
    <label v-else class="field-label">
      <slot></slot>
    </label>
  </div>
</template>

<script>
import Tooltip from './Tooltip.vue'

export default {
  name: 'FieldHint',
  components: {
    Tooltip
  },
  props: {
    // The hint text to display
    hint: {
      type: String,
      default: ''
    },
    // Whether the field is required
    required: {
      type: Boolean,
      default: false
    },
    // Position of the tooltip
    position: {
      type: String,
      default: 'right',
      validator: (value) => ['top', 'right', 'bottom', 'left'].includes(value)
    }
  }
}
</script>

<style scoped>
.field-hint {
  display: inline-block;
}

.field-label {
  display: inline-flex;
  align-items: center;
  position: relative;
  cursor: help;
}

/* Required field indicator */
.field-label :deep(.required) {
  color: #ff5252;
  margin-left: 4px;
}

/* Source hint styling */
.source-hint {
  font-size: 13px;
  white-space: pre-wrap;
  line-height: 1.4;
}
</style>
