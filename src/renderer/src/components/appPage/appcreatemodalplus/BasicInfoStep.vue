<template>
  <div id="step-0" ref="stepRef" class="step-form" :class="{ active: isActive }">
    <h3 class="step-title">基本信息</h3>
    <!-- Source Selection -->
    <div class="form-group">
      <label for="source-type">创建来源</label>
      <div class="source-selection">
        <!-- <div class="source-options">
          <div
            class="source-option"
            :class="{ selected: store.appData.from === 'folder' }"
            @click="selectSource('folder')"
          >
            <div class="source-icon">📁</div>
            <div class="source-info">
              <div class="source-title">从文件夹创建</div>
              <div class="source-description">选择本地文件夹作为应用根目录</div>
            </div>
          </div>

          <div
            class="source-option"
            :class="{ selected: store.appData.from === 'github' }"
            @click="selectSource('github')"
          >
            <div class="source-icon">🐙</div>
            <div class="source-info">
              <div class="source-title">从 Git 仓库创建</div>
              <div class="source-description">通过 Git 仓库地址克隆代码</div>
            </div>
          </div>

          <div
            class="source-option"
            :class="{ selected: store.appData.from === 'seed' }"
            @click="selectSource('seed')"
          >
            <div class="source-icon">🌱</div>
            <div class="source-info">
              <div class="source-title">从模板创建</div>
              <div class="source-description">使用内置应用模板快速创建</div>
            </div>
          </div>
        </div> -->

        <div v-if="store.appData.from" class="source-summary">
          <!-- Folder Source Summary -->
          <div v-if="store.appData.from === 'folder'" class="summary-content">
            <div class="summary-icon">📁</div>
            <div class="summary-details">
              <div class="summary-title">从文件夹创建</div>
              <div class="summary-path">
                {{ store.appData.folderPath || '未选择文件夹' }}
              </div>
            </div>
            <button class="change-button" @click="openSourceModal('folder')">配置</button>
          </div>

          <!-- GitHub Source Summary -->
          <div v-if="store.appData.from === 'github'" class="summary-content">
            <div class="summary-icon">🐙</div>
            <div class="summary-details">
              <div class="summary-title">从 Git 仓库创建</div>
              <div class="summary-path">
                {{ getGitSummary() }}
              </div>
            </div>
            <button class="change-button" @click="openSourceModal('github')">配置</button>
          </div>

          <!-- Seed Source Summary -->
          <div v-if="store.appData.from === 'seed'" class="summary-content">
            <div class="summary-icon">🌱</div>
            <div class="summary-details">
              <div class="summary-title">从模板创建</div>
              <div class="summary-path">
                {{ store.selectedSeed?.name || '未选择模板' }}
              </div>
            </div>
            <button class="change-button" @click="openSourceModal('seed')">配置</button>
          </div>
        </div>
      </div>
    </div>

    <!-- GitHub 仓库地址列表 -->
    <div class="form-group">
      <label>GitHub 仓库地址</label>
      <div
        class="repo-list"
        v-if="store.appData.github.repos && store.appData.github.repos.length > 0"
      >
        <div v-for="(repo, index) in store.appData.github.repos" :key="index" class="repo-item">
          <div class="repo-url">
            <span class="repo-icon">🔗</span>
            <span class="repo-link">{{ repo }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="form-group">
      <label for="app-name">应用名称 <span class="required">*</span></label>
      <div class="edit-field-container">
        <template v-if="isNameEditing">
          <input
            id="app-name"
            v-model="tempName"
            type="text"
            placeholder="给你的应用起个名字"
            :class="{ error: store.errors.name }"
            style="width: 100%"
          />
          <div class="edit-actions">
            <button class="edit-btn save" @click="saveNameEdit" title="保存">✓</button>
            <button class="edit-btn cancel" @click="cancelNameEdit" title="取消">✕</button>
          </div>
        </template>
        <template v-else>
          <div class="field-display">
            <span class="field-value">{{ store.appData.name || '未设置' }}</span>
            <button class="edit-btn" @click="startEditingName" title="编辑">✎</button>
          </div>
        </template>
      </div>
      <div v-if="store.errors.name" class="error-message">
        {{ store.errors.name }}
      </div>
    </div>

    <div class="form-group">
      <label for="app-description">应用描述</label>
      <div class="edit-field-container">
        <template v-if="isDescriptionEditing">
          <textarea
            id="app-description"
            v-model="tempDescription"
            placeholder="描述一下这个应用的功能和用途"
            rows="3"
            style="width: 100%"
          ></textarea>
          <div class="edit-actions">
            <button class="edit-btn save" @click="saveDescriptionEdit" title="保存">✓</button>
            <button class="edit-btn cancel" @click="cancelDescriptionEdit" title="取消">✕</button>
          </div>
        </template>
        <template v-else>
          <div class="field-display">
            <span class="field-value description">{{
              store.appData.description || '未设置描述'
            }}</span>
            <button class="edit-btn" @click="startEditingDescription" title="编辑">✎</button>
          </div>
        </template>
      </div>
    </div>

    <div class="form-group">
      <label for="app-tags">应用标签</label>
      <div class="tags-input-container">
        <div class="tags-container">
          <div v-for="tag in store.appData.tags" :key="tag" class="selected-tag">
            {{ tag }}
            <span class="tag-remove" @click="store.removeTag(tag)">×</span>
          </div>
          <div class="tag-input-wrapper" v-if="isAddingCustomTag">
            <input
              v-model="customTag"
              @keyup.enter="addCustomTag"
              @blur="finishAddTag"
              ref="customTagInput"
              placeholder="输入标签名称"
              type="text"
              class="custom-tag-input"
            />
          </div>
          <div v-else class="add-tag-button" @click="startAddCustomTag">+ 添加标签</div>
        </div>
      </div>
      <div class="predefined-tags">
        <span class="predefined-tags-label">推荐标签:</span>
        <div class="tags-list">
          <div
            v-for="tag in availableTags"
            :key="tag"
            class="tag-item"
            :class="{ selected: store.appData.tags.includes(tag) }"
            @click="store.toggleTag(tag)"
          >
            {{ tag }}
          </div>
        </div>
      </div>
    </div>
    <div class="section-divider"></div>

    <!-- Source Modals -->
    <FolderSourceModal
      v-if="showFolderModal"
      @close="showFolderModal = false"
      @browse-directory="handleBrowseDirectory"
      @confirm="store.handleFolderConfirm"
    />

    <GithubSourceModal
      v-if="showGithubModal"
      @close="showGithubModal = false"
      @confirm="store.handleGithubConfirm"
    />

    <SeedSourceModal v-if="showSeedModal" @close="showSeedModal = false" />
  </div>
</template>

<script setup>
import { ref, nextTick, computed } from 'vue'
import { useAppCreateStore } from '../../../stores/appCreateStore'
import FolderSourceModal from './FolderSourceModal.vue'
import GithubSourceModal from './GithubSourceModal.vue'
import SeedSourceModal from './SeedSourceModal.vue'

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

// First, add the editing state variables in the script section
// Find the script setup section and add these variables after the imports
const isNameEditing = ref(false)
const isDescriptionEditing = ref(false)

// Add temporary storage for the values while editing
const tempName = ref('')
const tempDescription = ref('')

// Add functions to handle editing
function startEditingName() {
  tempName.value = store.appData.name
  isNameEditing.value = true
}

function saveNameEdit() {
  if (tempName.value.trim()) {
    store.appData.name = tempName.value
    isNameEditing.value = false
  }
}

function cancelNameEdit() {
  isNameEditing.value = false
}

function startEditingDescription() {
  tempDescription.value = store.appData.description
  isDescriptionEditing.value = true
}

function saveDescriptionEdit() {
  store.appData.description = tempDescription.value
  isDescriptionEditing.value = false
}

function cancelDescriptionEdit() {
  isDescriptionEditing.value = false
}

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

function selectSource(source) {
  store.selectSource(source)
}

// Handle folder directory browsing
async function handleBrowseDirectory(directory) {
  const result = await emit('browse-directory', directory)
  return result
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
  const github = store.appData.github
  if (github.repos && github.repos.length > 0) {
    const defaultRepo = github.repos.find((repo) => repo.isDefault) || github.repos[0]
    return defaultRepo.url
  }
  return github.repoUrl || '未设置仓库地址'
}
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
  white-space: pre-line;
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
</style>
