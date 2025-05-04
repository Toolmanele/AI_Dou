<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  /** Current value of the progress (0-1) */
  value: {
    type: Number,
    required: true,
    default: 0,
  },

  /** Progress bar color */
  color: {
    type: String,
    default: "#4caf50", // Default green
  },
  /** Show percentage text */
  showPercentage: {
    type: Boolean,
    default: true,
  },
  /** Custom class for the progress bar */
  progressClass: {
    type: String,
    default: "",
  },
});

// Keep track of the last valid progress value
const lastProgress = ref(0);

// Computed percentage value
const percentage = computed(() => {
  if (props.value !== null && props.value >= 0 && props.value <= 1) {
    lastProgress.value = props.value;
  }
  return lastProgress.value * 100;
});

// Format the display label (percentage)
const displayLabel = computed(() => {
  return `${Math.round(percentage.value)}%`;
});
</script>

<template>
  <div class="progress-bar-container">
    <div
      class="progress-bar"
      :class="progressClass"
      :style="{
        width: `${percentage}%`,
        backgroundColor: color,
      }"
    ></div>
    <div v-if="showPercentage" class="progress-text">
      {{ displayLabel }}
    </div>
  </div>
</template>

<style scoped>
.progress-bar-container {
  height: 24px;
  background-color: #2d2d2d;
  position: relative;
  padding: 2px;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #4caf50;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 0.8rem;
  font-weight: bold;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
  user-select: none;
}
</style>
