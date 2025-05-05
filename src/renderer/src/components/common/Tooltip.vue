<template>
  <div class="tooltip-container">
    <slot></slot>
    <div class="tooltip" :class="[position, { active: isActive }, tooltipClass]">
      <slot name="content"></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Tooltip',
  props: {
    // If true, tooltip will only show on hover
    showOnHover: {
      type: Boolean,
      default: true
    },
    // Position of the tooltip (top, right, bottom, left)
    position: {
      type: String,
      default: 'top',
      validator: (value) => ['top', 'right', 'bottom', 'left'].includes(value)
    },
    // Custom classes for styling
    tooltipClass: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      isActive: false
    }
  },
  mounted() {
    const container = this.$el

    if (this.showOnHover) {
      container.addEventListener('mouseenter', this.showTooltip)
      container.addEventListener('mouseleave', this.hideTooltip)
    }
  },
  beforeUnmount() {
    const container = this.$el

    if (this.showOnHover) {
      container.removeEventListener('mouseenter', this.showTooltip)
      container.removeEventListener('mouseleave', this.hideTooltip)
    }
  },
  methods: {
    showTooltip() {
      this.isActive = true
    },
    hideTooltip() {
      this.isActive = false
    }
  }
}
</script>

<style scoped>
.tooltip-container {
  position: relative;
  display: inline-block;
}

.tooltip {
  position: absolute;
  z-index: 1000;
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  white-space: nowrap;
  visibility: hidden;
  opacity: 0;
  transition:
    opacity 0.3s,
    visibility 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

.tooltip.active {
  visibility: visible;
  opacity: 1;
}

/* Position modifiers */
.tooltip-container .tooltip[class*='top'] {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
}

.tooltip-container .tooltip[class*='right'] {
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 8px;
  white-space: nowrap;
  max-width: none;
}

.tooltip-container .tooltip[class*='bottom'] {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
}

.tooltip-container .tooltip[class*='left'] {
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-right: 8px;
}

/* Arrow styles */
.tooltip::after {
  content: '';
  position: absolute;
  border-width: 5px;
  border-style: solid;
}

.tooltip[class*='top']::after {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
}

.tooltip[class*='right']::after {
  top: 50%;
  right: 100%;
  transform: translateY(-50%);
  border-color: transparent rgba(0, 0, 0, 0.8) transparent transparent;
}

.tooltip[class*='bottom']::after {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-color: transparent transparent rgba(0, 0, 0, 0.8) transparent;
}

.tooltip[class*='left']::after {
  top: 50%;
  left: 100%;
  transform: translateY(-50%);
  border-color: transparent transparent transparent rgba(0, 0, 0, 0.8);
}
</style>
