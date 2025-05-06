<template>
  <div id="step-2" ref="stepRef" class="step-form" :class="{ active: isActive }">
    <Tips position="right">
      <h3 class="step-title">目录设置</h3>
      <template #content>
        <ul class="tips-list">
          <li>模型目录应该指向应用中存放AI模型文件的位置</li>
          <li>输出目录是应用生成的内容（如图像、文本等）的保存位置</li>
          <li>如果不确定，可以使用默认的建议路径</li>
          <li>你也可以手动设置绝对路径或相对路径</li>
        </ul>
      </template>
    </Tips>

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
          readonly
        />
        <button class="browse-button" @click="browsePath('modelDir')">浏览...</button>
      </div>
      <div class="directory-suggestion">
        <div class="suggestion-title">建议路径:</div>
        <div class="suggestion-paths">
          <div
            v-for="(path, index) in suggestedModelPaths"
            :key="`model-${index}`"
            class="suggestion-path"
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
          readonly
        />
        <button class="browse-button" @click="browsePath('outputDir')">浏览...</button>
      </div>
      <div class="directory-suggestion">
        <div class="suggestion-title">建议路径:</div>
        <div class="suggestion-paths">
          <div
            v-for="(path, index) in suggestedOutputPaths"
            :key="`output-${index}`"
            class="suggestion-path"
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

// Use suggested model path
function useModelPath(path) {
  store.appData.modelDir = path
}

// Use suggested output path
function useOutputPath(path) {
  store.appData.outputDir = path
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

.directory-tips {
  background-color: var(--color-background-secondary);
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
}

.directory-tips h4 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--color-text-strong);
}

.directory-tips ul {
  margin: 0;
  padding-left: 20px;
}

.directory-tips li {
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--color-text);
}

.directory-suggestion {
  margin-top: 8px;
}

.suggestion-title {
  font-size: 12px;
  color: var(--color-text-light);
  margin-bottom: 4px;
}

.suggestion-paths {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.suggestion-path {
  padding: 4px 10px;
  background-color: var(--color-background-secondary);
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--color-border);
}

.suggestion-path:hover {
  background-color: var(--color-hover);
  border-color: var(--color-primary-light);
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
