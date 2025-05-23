<template>
  <div id="step-2" ref="stepRef" class="step-form" :class="{ active: isActive }">
    <h3 class="step-title">目录设置</h3>

    <div class="form-group">
      <Tips position="right">
        <label>工作目录</label>
        <template #content>
          <div class="tips-content">应用的根目录，包含主要代码文件</div>
        </template>
      </Tips>
      <div class="directory-input">
        <input
          type="text"
          v-model="store.appData.folderPath"
          placeholder="应用工作目录路径"
          readonly
        />
        <!-- <button class="browse-button" @click="browsePath('workingDir')">
          浏览...
        </button> -->
      </div>
    </div>

    <div class="form-group">
      <Tips position="right">
        <label>模型目录</label>
        <template #content>
          <div class="tips-content">存放模型文件的目录，相对于工作目录</div>
        </template>
      </Tips>
      <div class="directory-input">
        <input
          type="text"
          v-model="store.appData.modelDir"
          placeholder="模型文件目录路径"
          @focus="showModelDropdown = true"
          @click="showModelDropdown = true"
          @blur="handleBlur('model')"
        />
        <button class="browse-button" @click="browsePath('modelDir')">浏览...</button>
      </div>
      <div
        class="directory-dropdown"
        v-if="showModelDropdown"
        v-click-outside="() => (showModelDropdown = false)"
      >
        <div class="dropdown-title">建议路径:</div>
        <div class="dropdown-paths">
          <div
            v-for="(path, index) in suggestedModelPaths"
            :key="`model-${index}`"
            class="dropdown-path"
            @click="useModelPath(path)"
          >
            {{ path }}
          </div>
        </div>
      </div>
    </div>

    <div class="form-group">
      <Tips position="right">
        <label>输出目录</label>
        <template #content>
          <div class="tips-content">存放生成内容的目录，相对于工作目录</div>
        </template>
      </Tips>
      <div class="directory-input">
        <input
          type="text"
          v-model="store.appData.outputDir"
          placeholder="输出文件目录路径"
          @focus="showOutputDropdown = true"
          @click="showOutputDropdown = true"
          @blur="handleBlur('output')"
        />
        <button class="browse-button" @click="browsePath('outputDir')">浏览...</button>
      </div>
      <div
        class="directory-dropdown"
        v-if="showOutputDropdown"
        v-click-outside="() => (showOutputDropdown = false)"
      >
        <div class="dropdown-title">建议路径:</div>
        <div class="dropdown-paths">
          <div
            v-for="(path, index) in suggestedOutputPaths"
            :key="`output-${index}`"
            class="dropdown-path"
            @click="useOutputPath(path)"
          >
            {{ path }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAppCreateStore } from '@stores/appCreateStore'
import { Tips } from '@common'

const props = defineProps({
  isActive: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['browse-directory'])
const store = useAppCreateStore()
const stepRef = ref(null)

// 控制下拉框显示状态
const showModelDropdown = ref(false)
const showOutputDropdown = ref(false)
// 用于防止点击下拉选项时因blur事件导致下拉框消失
const isSelectingOption = ref(false)

// Common directory paths for models and outputs
const suggestedModelPaths = [
  './models',
  './model',
  './weights',
  './assets/models',
  './resources/models'
]

const suggestedOutputPaths = [
  './output',
  './outputs',
  './results',
  './generated',
  './assets/output'
]

// Browse for directory
async function browsePath(directory) {
  const result = await emit('browse-directory', directory)
  return result
}

// 处理输入框失去焦点事件
function handleBlur(type) {
  // 添加延时，确保点击选项的事件先被处理
  setTimeout(() => {
    if (!isSelectingOption.value) {
      if (type === 'model') {
        showModelDropdown.value = false
      } else if (type === 'output') {
        showOutputDropdown.value = false
      }
    }
    isSelectingOption.value = false
  }, 100)
}

// 修改使用路径的函数，设置状态避免blur事件关闭下拉框
function useModelPath(path) {
  isSelectingOption.value = true
  store.appData.modelDir = path
  showModelDropdown.value = false
}

// Use suggested output path
function useOutputPath(path) {
  isSelectingOption.value = true
  store.appData.outputDir = path
  showOutputDropdown.value = false
}

// 点击外部关闭下拉框
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutside)
  }
}

// Expose the stepRef to parent
defineExpose({
  stepRef
})
</script>

<style scoped>
.step-form {
  padding: 20px 0;
  margin-bottom: 20px;
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.step-form.active {
  padding: 20px;
  margin-left: -20px;
  margin-right: -20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  position: relative;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-strong);
}

.directory-input {
  display: flex;
  gap: 8px;
}

.directory-input input {
  flex: 1;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
  color: var(--color-text);
  font-size: 14px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.directory-input input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-hover);
}

.browse-button {
  padding: 8px 12px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.browse-button:hover {
  background-color: var(--color-primary-dark);
}

.directory-hint {
  font-size: 12px;
  color: var(--color-text-light);
  margin-top: 4px;
}

.step-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-strong);
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
}

.directory-dropdown {
  position: absolute;
  width: fit-content;
  margin-top: 2px;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--color-card);
  border-radius: 6px;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
  z-index: 10;
  padding: 8px;
  max-height: 200px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-card);
}

.dropdown-title {
  font-size: 12px;
  color: var(--color-text-light);
  margin-bottom: 8px;
  padding-left: 4px;
}

.dropdown-paths {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dropdown-path {
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.dropdown-path:hover {
  background-color: var(--color-hover);
  color: var(--color-primary);
}

.tips-content {
  white-space: nowrap;
}

.tips-list {
  width: fit-content;
  margin: 0;
  padding: 0 0 0 18px;
  list-style-type: disc;
  text-align: left;
}

.tips-list li {
  margin-bottom: 4px;
  white-space: nowrap;
}

.tips-list li:last-child {
  margin-bottom: 0;
}
</style>
