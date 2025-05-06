<template>
  <div id="step-0" ref="stepRef" class="step-form" :class="{ active: isActive }">
    <h3 class="step-title">基本信息</h3>
    <!-- Source Selection -->
    <div class="form-group">
      <div class="form-group">
        <div class="repo-title-container">
          <Tips position="right">
            Git仓库地址 <span class="required">*</span>
            <template #content>
              <div class="tips-content">输入GitHub仓库地址</div>
            </template>
          </Tips>
          <button class="title-add-button" @click="addRepo">+</button>
        </div>
        <div class="github-repos-container">
          <div v-for="(repo, index) in githubRepos" :key="index" class="github-repo-input">
            <div class="input-wrapper" :class="{ 'has-focus': activeInputIndex === index }">
              <input
                type="text"
                v-model="repo.url"
                placeholder="GitHub仓库地址"
                @input="updateStoreRepos"
                @focus="activeInputIndex = index"
                @blur="handleBlur"
                @mouseenter="hoveredInputIndex = index"
                @mouseleave="hoveredInputIndex = null"
              />
              <span
                v-if="index > 0 && (activeInputIndex === index || hoveredInputIndex === index)"
                class="close-icon"
                @click="removeRepo(index)"
                >×</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, computed, onMounted } from 'vue'
import { useAppCreateStore } from '@stores/appCreateStore'
import { Tips } from '@common'

const props = defineProps({
  isActive: {
    type: Boolean,
    default: false
  }
})

// Use the Pinia store
const store = useAppCreateStore()

const emit = defineEmits(['browse-directory'])

const stepRef = ref(null)
const isAddingCustomTag = ref(false)
const customTag = ref('')
const customTagInput = ref(null)
const showFolderModal = ref(false)
const showGithubModal = ref(false)
const showSeedModal = ref(false)
const githubRepos = ref([{ url: '' }])
const folderPath = computed(() => store.appData.folderPath || '')
const activeInputIndex = ref(null)
const hoveredInputIndex = ref(null)

// Initialize GitHub repos from store if available
onMounted(() => {
  if (store.appData.github && store.appData.github.repos && store.appData.github.repos.length > 0) {
    githubRepos.value = [...store.appData.github.repos]
  }
})

// Function to add a new repo input
function addRepo() {
  githubRepos.value.push({ url: '' })
  updateStoreRepos()
}

// Function to remove a repo input
function removeRepo(index) {
  githubRepos.value.splice(index, 1)
  updateStoreRepos()
}

// Update store with current repos
function updateStoreRepos() {
  if (!store.appData.github) {
    store.appData.github = { repos: [] }
  }

  // Map repos and mark the first valid one as default
  const updatedRepos = githubRepos.value.map((repo, index) => {
    return {
      ...repo,
      isDefault: index === 0
    }
  })

  store.appData.github.repos = updatedRepos
}

// Available tags
const availableTags = [
  '文本生成',
  '图像生成',
  '翻译',
  '代码助手',
  '聊天机器人',
  '数据分析',
  '知识库',
  '音频处理',
  '视频处理',
  '自动化工具'
]

// Add functions to handle tag management
function startAddCustomTag() {
  isAddingCustomTag.value = true
  nextTick(() => {
    if (customTagInput.value) {
      customTagInput.value.focus()
    }
  })
}

function addCustomTag() {
  const tag = customTag.value.trim()
  if (tag) {
    store.addTag(tag)
    customTag.value = ''
  }
}

function finishAddTag() {
  if (customTag.value.trim()) {
    addCustomTag()
  }
  isAddingCustomTag.value = false
}

// Open source modal
function openSourceModal(source) {
  store.selectSource(source)

  if (source === 'folder') {
    showFolderModal.value = true
  } else if (source === 'github') {
    showGithubModal.value = true
  } else if (source === 'seed') {
    showSeedModal.value = true
  }
}

// Handle selecting different sources
function selectSource(source) {
  store.selectSource(source)
}

// Public method to set selected seed (used by parent)
function setSelectedSeed(seed) {
  store.selectedSeed = seed
}

// Expose functions and refs to parent component
defineExpose({
  stepRef,
  setSelectedSeed
})

function getGitSummary() {
  if (githubRepos.value && githubRepos.value.length > 0) {
    const defaultRepo = githubRepos.value.find((repo) => repo.isDefault) || githubRepos.value[0]
    return defaultRepo.url || '未设置仓库地址'
  }
  return '未设置仓库地址'
}

function handleBlur() {
  activeInputIndex.value = null
  hoveredInputIndex.value = null
}
</script>

<style scoped>
.step-form {
  /* padding: 20px 0; */
  margin-bottom: 20px;
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.step-form.active {
  padding: 20px;
  margin-left: -20px;
  margin-right: -20px;
}
.tips-content {
  white-space: nowrap;
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

.required {
  color: #e53e3e;
  margin-left: 2px;
}

input,
textarea,
select {
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
  color: var(--color-text);
  font-size: 14px;
  transition: all 0.2s ease;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-hover);
}

input.error {
  border-color: #e53e3e;
}

.error-message {
  color: #e53e3e;
  font-size: 13px;
}

.step-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-strong);
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
}

.section-divider {
  height: 1px;
  background-color: var(--color-border);
  margin: 30px 0;
}

/* Tags styling */
.tags-input-container {
  margin-bottom: 12px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px 10px;
  background-color: var(--color-card);
  min-height: 42px;
}

.selected-tag {
  display: flex;
  align-items: center;
  padding: 4px 8px 4px 12px;
  background-color: var(--color-primary-light);
  border-radius: 20px;
  font-size: 13px;
  color: white;
}

.tag-remove {
  margin-left: 6px;
  font-size: 16px;
  cursor: pointer;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.tag-remove:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.tag-input-wrapper {
  flex: 1;
  min-width: 120px;
}

.custom-tag-input {
  border: none;
  padding: 4px 0;
  width: 100%;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font-size: 14px;
}

.custom-tag-input:focus {
  box-shadow: none;
}

.add-tag-button {
  color: var(--color-primary);
  cursor: pointer;
  font-size: 13px;
  padding: 4px 0;
}

.add-tag-button:hover {
  color: var(--color-primary-dark);
}

.predefined-tags {
  margin-top: 12px;
}

.predefined-tags-label {
  font-size: 13px;
  color: var(--color-text-light);
  margin-bottom: 8px;
  display: block;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  padding: 6px 12px;
  background-color: var(--color-background-secondary);
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--color-text);
}

.tag-item:hover {
  background-color: var(--color-hover);
}

.tag-item.selected {
  background-color: var(--color-primary);
  color: white;
}

/* Source selection styling */
.source-selection {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.source-options {
  display: flex;
  gap: 12px;
}

.source-option {
  flex: 1;
  display: flex;
  padding: 14px;
  border-radius: 8px;
  background-color: var(--color-background-secondary);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.source-option:hover {
  background-color: var(--color-hover);
}

.source-option.selected {
  border-color: var(--color-primary);
  background-color: var(--color-primary-light-10);
}

.source-icon {
  font-size: 24px;
  margin-right: 12px;
  display: flex;
  align-items: center;
}

.source-info {
  display: flex;
  flex-direction: column;
}

.source-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--color-text-strong);
}

.source-description {
  font-size: 12px;
  color: var(--color-text-light);
  margin-top: 4px;
}

/* Source summary styling */
.source-summary {
  background-color: var(--color-background-secondary);
  border-radius: 8px;
  border: 1px solid var(--color-border);
  padding: 12px;
}

.summary-content {
  display: flex;
  align-items: center;
}

.summary-icon {
  font-size: 24px;
  margin-right: 12px;
}

.summary-details {
  flex: 1;
}

.summary-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--color-text-strong);
  margin-bottom: 4px;
}

.summary-path {
  font-size: 13px;
  color: var(--color-text);
  word-break: break-all;
}

.change-button {
  padding: 4px 12px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  color: var(--color-text);
  transition: all 0.2s;
}

.change-button:hover {
  background-color: var(--color-hover);
}

/* GitHub Repository List Styles */
.repo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.repo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.repo-url {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.repo-icon {
  flex-shrink: 0;
}

.repo-link {
  color: var(--color-primary);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.repo-link:hover {
  text-decoration: underline;
}

.repo-badges {
  display: flex;
  gap: 8px;
}

.repo-default-badge {
  background-color: var(--color-primary);
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

/* Edit field container styles */
.edit-field-container {
  position: relative;
  width: 100%;
}

.field-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  min-height: 42px;
}

.field-value {
  flex: 1;
  color: #374151;
  word-break: break-word;
}

.field-value.description {
  white-space: nowrap;
  min-height: 60px;
}

.edit-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.edit-btn:hover {
  color: #4b5563;
  background-color: #e5e7eb;
}

.edit-actions {
  display: flex;
  margin-top: 8px;
  justify-content: flex-end;
  gap: 8px;
}

.edit-btn.save {
  color: #059669;
}

.edit-btn.save:hover {
  background-color: #ecfdf5;
}

.edit-btn.cancel {
  color: #dc2626;
}

.edit-btn.cancel:hover {
  background-color: #fef2f2;
}

input {
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
  color: var(--color-text);
  font-size: 14px;
  transition: all 0.2s ease;
}

input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-hover);
}

.folder-path-input {
  display: flex;
  gap: 8px;
}

.folder-path-input input {
  flex: 1;
}

.browse-button {
  padding: 8px 12px;
  background-color: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.browse-button:hover {
  background-color: var(--color-primary-dark);
}

.folder-selection-info {
  background-color: var(--color-background-secondary, #f5f7fa);
  border-radius: 6px;
  padding: 16px;
  font-size: 14px;
  color: var(--color-text);
  line-height: 1.5;
}

/* GitHub Repository Input Styles */
.github-repos-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.github-repo-input {
  display: flex;
  width: 100%;
  margin-bottom: 6px;
}

.github-repo-input:last-child {
  margin-bottom: 0;
}

.input-wrapper {
  position: relative;
  flex: 1;
  display: flex;
}

.input-wrapper input {
  width: 100%;
  padding-right: 30px; /* 为关闭图标留出空间 */
}

.close-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #666;
  font-size: 18px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
  z-index: 2;
}

.close-icon:hover {
  background-color: rgba(0, 0, 0, 0.1);
  color: #e53e3e;
}

.add-repo-button {
  padding: 8px 12px;
  background-color: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  min-width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-repo-button:hover {
  background-color: var(--color-primary-dark);
}

.folder-path-input {
  display: flex;
  gap: 8px;
}

/* Repository Title Container Styles */
.repo-title-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-add-button {
  background-color: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 4px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
  line-height: 1;
  margin-left: 5px;
}

.title-add-button:hover {
  background-color: var(--color-primary-dark);
}

.has-focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-hover);
}
</style>
