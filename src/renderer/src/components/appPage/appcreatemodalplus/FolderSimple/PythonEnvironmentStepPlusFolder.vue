<template>
  <div id="step-3" ref="stepRef" class="step-form" :class="{ active: isActive }">
    <h3 class="step-title">Python 环境</h3>

    <!-- Move the environment creation options to the top -->
    <div class="environment-options">
      <div class="option-card">
        <div class="option-icon">+</div>
        <div class="option-content">
          <h4 class="option-title">自动创建环境</h4>
          <p class="option-description">创建新的 Python 环境并自动配置</p>
          <button class="option-button" @click="addEnvironment">+ 添加环境</button>
        </div>
      </div>

      <div class="option-card">
        <div class="option-icon">📂</div>
        <div class="option-content">
          <h4 class="option-title">从文件夹导入环境</h4>
          <p class="option-description">导入已有的 Python 环境文件夹</p>
          <button class="option-button" @click="showImportModal = true">选择文件夹</button>
        </div>
      </div>
    </div>

    <!-- Existing environments list -->
    <div v-if="store.appData.pythonEnvironments.length > 0" class="environments-list">
      <h4 class="environments-title">已配置环境</h4>

      <div class="environment-list-table">
        <div class="environment-list-header">
          <div class="env-col env-status">状态</div>
          <div class="env-col env-name">环境名称</div>
          <div class="env-col env-version">Python版本</div>
          <div class="env-col env-actions">操作</div>
        </div>

        <div
          v-for="(env, index) in store.appData.pythonEnvironments"
          :key="index"
          class="environment-list-item"
          :class="{ 'is-default': env.isDefault }"
        >
          <div class="env-col env-status">
            <span
              class="status-badge"
              :class="{ 'is-default': env.isDefault, 'is-installed': env.isInstalled }"
            >
              {{ env.isDefault ? '默认' : env.isInstalled ? '已安装' : '未安装' }}
            </span>
          </div>
          <div class="env-col env-name">
            {{ env.isDefault ? '默认环境' : '环境 ' + (index + 1) }}
          </div>
          <div class="env-col env-version">Python {{ env.pythonVersion }}</div>
          <div class="env-col env-actions">
            <button class="env-action-btn edit-btn" @click="editEnvironment(index)">编辑</button>
            <button
              v-if="!env.isDefault"
              class="env-action-btn default-btn"
              @click="setDefaultEnvironment(index)"
            >
              设为默认
            </button>
            <button
              v-if="!env.isInstalled"
              class="env-action-btn install-btn"
              @click="installEnvironment(index)"
            >
              安装
            </button>
            <button
              v-if="!isFirst(index)"
              class="env-action-btn delete-btn"
              @click="deleteEnvironment(index)"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Import Python Environment Modal -->
    <div v-if="showImportModal" class="modal-overlay" @click="closeImportModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>导入 Python 环境</h3>
          <button class="close-modal-button" @click="closeImportModal">×</button>
        </div>
        <div class="modal-body">
          <p class="modal-description">
            从系统中选择已安装的 Python 环境文件夹进行导入。系统将自动检测版本信息。
          </p>

          <div class="form-group">
            <label>Python 环境路径</label>
            <div class="path-input-group">
              <input type="text" v-model="importPath" placeholder="选择 Python 环境路径" readonly />
              <button class="browse-button" @click="browsePythonFolder">浏览...</button>
            </div>
          </div>

          <div v-if="importEnvInfo" class="env-info-preview">
            <div class="info-item">
              <span class="info-label">版本:</span>
              <span class="info-value">Python {{ importEnvInfo.version }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">路径:</span>
              <span class="info-value">{{ importEnvInfo.path }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">设置为:</span>
              <div class="env-type-selector">
                <label class="env-type-option">
                  <input type="radio" v-model="importEnvType" value="default" name="env-type" />
                  <span>默认环境</span>
                </label>
                <label class="env-type-option">
                  <input type="radio" v-model="importEnvType" value="additional" name="env-type" />
                  <span>附加环境</span>
                </label>
              </div>
            </div>
          </div>

          <div v-if="importError" class="import-error">
            {{ importError }}
          </div>

          <div class="modal-actions">
            <button class="cancel-button" @click="closeImportModal">取消</button>
            <button class="import-button" :disabled="!importPath" @click="importPythonEnvironment">
              导入
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Environment Edit/Create Modal -->
    <PythonEnvironmentModal
      v-if="showEnvModal"
      :environment="currentEnv"
      :isEditing="isEditingEnv"
      @close="closeEnvModal"
      @save="saveEnvironment"
    />

    <div class="python-tips">
      <h4>Python 环境提示：</h4>
      <ul>
        <li>可以添加多个 Python 环境，适用于不同场景</li>
        <li>默认环境将在应用启动时使用</li>
        <li>安装命令按顺序执行，通常先安装依赖再启动应用</li>
        <li>如果环境尚未安装，可以点击"安装"按钮自动配置</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAppCreateStore } from '@stores/appCreateStore'
import formatData from '@services/formatData'
import PythonEnvironmentModal from '../PythonEnvironmentModal.vue'

const props = defineProps({
  isActive: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['install-environment', 'go-to-settings'])
const store = useAppCreateStore()
const stepRef = ref(null)

// Python versions available for selection
const pythonVersions = ['3.8', '3.9', '3.10', '3.11', '3.12', '3.13']

// Modal states
const showEnvModal = ref(false)
const isEditingEnv = ref(false)
const editingEnvIndex = ref(-1)
const currentEnv = ref({
  pythonVersion: '3.10',
  pythonPath: '',
  executable: 'python',
  pip: {
    source: 'official',
    installCommands: ['pip install -r requirements.txt']
  },
  pytorch: {
    source: 'official',
    installCommands: ['pip install torch torchvision torchaudio']
  },
  startCommand: 'python main.py',
  isInstalled: false,
  isDefault: false,
  isCollapsed: false,
  isInstalling: false,
  installProgress: 0,
  installLogs: [],
  installError: '',
  needConfigAppSpace: false,
  showLogs: false
})

// Import modal state
const showImportModal = ref(false)
const importPath = ref('')
const importEnvInfo = ref(null)
const importError = ref('')
const importEnvType = ref('default')

// Check if this is the first environment
function isFirst(index) {
  return index === 0
}

// Set default environment
function setDefaultEnvironment(index) {
  // Remove default flag from all environments
  store.appData.pythonEnvironments.forEach((env, i) => {
    env.isDefault = i === index
  })
}

// Add new environment
function addEnvironment() {
  console.log('addEnvironment - opening modal')

  // Reset the current environment to default values
  currentEnv.value = {
    pythonVersion: '3.10',
    pythonPath: '',
    executable: 'python',
    pip: {
      source: 'official',
      installCommands: ['pip install -r requirements.txt']
    },
    pytorch: {
      source: 'official',
      installCommands: ['pip install torch torchvision torchaudio']
    },
    startCommand: 'python main.py',
    isInstalled: false,
    isDefault: store.appData.pythonEnvironments.length === 0, // Default if first
    isCollapsed: false,
    isInstalling: false,
    installProgress: 0,
    installLogs: [],
    installError: '',
    needConfigAppSpace: false,
    showLogs: false
  }

  isEditingEnv.value = false
  editingEnvIndex.value = -1
  showEnvModal.value = true
}

// Edit environment
function editEnvironment(index) {
  console.log('Editing environment at index', index)

  // Create a deep copy of the environment to edit
  currentEnv.value = JSON.parse(JSON.stringify(store.appData.pythonEnvironments[index]))

  isEditingEnv.value = true
  editingEnvIndex.value = index
  showEnvModal.value = true
}

// Save environment
function saveEnvironment(environment) {
  // Handle default status - if setting this as default, unset others
  if (environment.isDefault) {
    store.appData.pythonEnvironments.forEach((env) => {
      env.isDefault = false
    })
  }

  if (isEditingEnv.value) {
    // Update existing environment
    store.appData.pythonEnvironments[editingEnvIndex.value] = JSON.parse(
      JSON.stringify(environment)
    )
  } else {
    // Add new environment
    store.appData.pythonEnvironments.push(JSON.parse(JSON.stringify(environment)))
  }

  // Close the modal
  closeEnvModal()
}

// Close environment modal
function closeEnvModal() {
  showEnvModal.value = false
}

// Delete environment
function deleteEnvironment(index) {
  if (index > 0 && !store.appData.pythonEnvironments[index].isDefault) {
    if (confirm('确定要删除此环境吗？')) {
      store.appData.pythonEnvironments.splice(index, 1)
    }
  }
}

// Import environment functions
function closeImportModal() {
  showImportModal.value = false
  importPath.value = ''
  importEnvInfo.value = null
  importError.value = ''
  importEnvType.value = 'default'
}

async function browsePythonFolder() {
  let directory = 'pythonPath'
  try {
    // 使用 Electron API 打开目录选择对话框
    if (window.electronAPI && window.electronAPI.showOpenDialog) {
      // 设置对话框标题
      let title = '选择Python环境目录'

      // 调用 electron 的文件夹选择对话框
      const result = await window.electronAPI.showOpenDialog({
        title: title,
        defaultPath: '',
        properties: ['openDirectory']
      })

      // 如果用户选择了目录
      if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
        const selectedPath = result.filePaths[0]
        // store.appData[directory] = selectedPath

        // // If it's the working directory, update the folderPath in the store
        // if (directory === 'workingDir') {
        //   store.setFolderPath(selectedPath)
        // }
        importPath.value = selectedPath
        console.log(`已选择${directory}:`, selectedPath)
        let detectResult = await detectPythonEnvironment(selectedPath)
        console.log(`检测结果:`, detectResult)
        return selectedPath
      }
    } else if (window.electronAPI && window.electronAPI.selectDirectory) {
      // 尝试使用备用方法
      const result = await window.electronAPI.selectDirectory()
      if (result && !result.canceled && result.filePath) {
        store.appData[directory] = result.filePath

        // If it's the working directory, update the folderPath in the store
        if (directory === 'workingDir') {
          store.setFolderPath(result.filePath)
        }

        console.log(`已选择${directory}:`, result.filePath)
        return result.filePath
      }
    } else {
      // 如果没有可用的 electronAPI，显示一个警告
      console.warn('目录选择功能需要 Electron 环境')
    }
  } catch (err) {
    console.error(`选择${directory}失败:`, err)
  }
  return null
}

// 这里是需要检测 python 环境
async function detectPythonEnvironment(path) {
  try {
    importError.value = ''

    // In a real application, you would detect the Python version from the selected folder
    // For now, we'll simulate this with a mock function
    if (window.electronAPI && window.electronAPI.detectPythonVersion) {
      const pythonInfo = await window.electronAPI.detectPythonVersion(path)

      if (pythonInfo && pythonInfo.success) {
        importEnvInfo.value = {
          version: pythonInfo.version,
          path: pythonInfo.path || path,
          executable: pythonInfo.executable || 'python'
        }
      } else {
        importError.value = pythonInfo?.error || '无法在所选文件夹中检测到 Python 环境'
        importEnvInfo.value = null
      }
    } else {
      // Mock for development/testing
      console.log('模拟检测 Python 环境...')

      // Check if path contains python to simulate a real check
      if (path.toLowerCase().includes('python')) {
        // Simulate a successful detection
        setTimeout(() => {
          const mockVersion = path.match(/\d\.\d+/) ? path.match(/\d\.\d+/)[0] : '3.10'
          importEnvInfo.value = {
            version: mockVersion,
            path: path,
            executable: path.includes('win') ? 'python.exe' : 'python'
          }
        }, 300)
      } else {
        importError.value = '所选文件夹不包含有效的 Python 环境'
        importEnvInfo.value = null
      }
    }
  } catch (error) {
    console.error('检测 Python 环境出错:', error)
    importError.value = '检测环境时出错: ' + error.message
    importEnvInfo.value = null
  }
}

function importPythonEnvironment() {
  if (!importEnvInfo.value) return

  try {
    // Create a new environment entry based on the detected info
    const newEnv = {
      pythonVersion: importEnvInfo.value.version,
      pythonPath: importEnvInfo.value.path,
      executable: importEnvInfo.value.executable,
      pip: {
        source: '',
        installCommands: ['pip install -r requirements.txt']
      },
      pytorch: {
        source: '',
        installCommands: ['pip install torch torchvision torchaudio']
      },
      startCommand: 'python main.py',
      isInstalled: true, // Mark as already installed
      isDefault: importEnvType.value === 'default',
      isCollapsed: false,
      isInstalling: false,
      installProgress: 100,
      installLogs: ['环境已导入: ' + importEnvInfo.value.path],
      installError: '',
      needConfigAppSpace: false,
      showLogs: false
    }

    // If setting as default, update other environments
    if (importEnvType.value === 'default') {
      // Remove default flag from all environments
      store.appData.pythonEnvironments.forEach((env) => {
        env.isDefault = false
      })
    }

    // Add the new environment
    store.appData.pythonEnvironments.push(newEnv)

    // Close the modal
    closeImportModal()
  } catch (error) {
    console.error('导入 Python 环境出错:', error)
    importError.value = '导入环境时出错: ' + error.message
  }
}

// Install environment
function installEnvironment(index) {
  emit('install-environment', index)
}

// Go to settings
function goToSettings() {
  emit('go-to-settings')
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
.step-title {
  padding-bottom: 5px;
  margin-bottom: 10px;
  /* border-bottom: 1px solid var(--color-border); */
}
.environment-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.option-card {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 20px;
  background-color: var(--color-background-secondary);
  display: flex;
  gap: 16px;
  transition: all 0.2s ease;
}

.option-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: var(--color-primary-light);
}

.option-icon {
  font-size: 24px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background);
  border-radius: 50%;
  border: 1px solid var(--color-border);
}

.option-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.option-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-strong);
}

.option-description {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: var(--color-text);
}

.option-button {
  align-self: flex-start;
  padding: 8px 16px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text);
  transition: all 0.2s;
}

.option-button:hover {
  background-color: var(--color-hover);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.environments-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-strong);
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
}

.environments-list {
  margin-bottom: 20px;
}

/* Environment list table styles */
.environment-list-table {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}

.environment-list-header {
  display: flex;
  background-color: var(--color-background-secondary);
  font-weight: 600;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}

.environment-list-item {
  display: flex;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  transition: background-color 0.2s ease;
}

.environment-list-item:last-child {
  border-bottom: none;
}

.environment-list-item:hover {
  background-color: var(--color-hover);
}

.environment-list-item.is-default {
  background-color: var(--color-background-highlight);
}

.env-col {
  display: flex;
  align-items: center;
}

.env-status {
  width: 100px;
}

.env-name {
  flex: 1;
}

.env-version {
  width: 120px;
}

.env-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex: 1;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
}

.status-badge.is-default {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.status-badge.is-installed {
  background-color: #e7f5e8;
  color: #4caf50;
  border-color: #4caf50;
}

.env-action-btn {
  padding: 4px 8px;
  border-radius: 4px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.env-action-btn:hover {
  background-color: var(--color-hover);
}

.edit-btn {
  color: var(--color-text);
}

.default-btn {
  color: var(--color-primary);
  border-color: var(--color-primary-light);
}

.install-btn {
  color: #4caf50;
  border-color: #4caf50;
}

.delete-btn {
  color: #e53e3e;
  border-color: #e53e3e;
}

.python-tips {
  background-color: var(--color-background-secondary);
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
}

.python-tips h4 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--color-text-strong);
}

.python-tips ul {
  margin: 0;
  padding-left: 20px;
}

.python-tips li {
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--color-text);
}

/* Import modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  width: 500px;
  max-width: 90%;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--color-text-strong);
}

.modal-body {
  padding: 20px;
}

.modal-description {
  margin-top: 0;
  margin-bottom: 16px;
  color: var(--color-text);
  font-size: 14px;
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

.path-input-group {
  display: flex;
  gap: 8px;
}

.path-input-group input {
  flex: 1;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
  color: var(--color-text);
  font-size: 14px;
}

.browse-button {
  padding: 8px 12px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  color: var(--color-text);
}

.browse-button:hover {
  background-color: var(--color-hover);
}

.env-info-preview {
  margin-top: 16px;
  padding: 12px;
  background-color: var(--color-background-secondary);
  border-radius: 6px;
  border: 1px solid var(--color-border);
}

.info-item {
  display: flex;
  margin-bottom: 8px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  width: 70px;
  font-weight: 600;
  color: var(--color-text-strong);
}

.info-value {
  flex: 1;
  word-break: break-all;
}

.env-type-selector {
  display: flex;
  gap: 16px;
}

.env-type-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.import-error {
  margin-top: 12px;
  padding: 10px;
  background-color: #fef2f2;
  color: #dc2626;
  border-radius: 6px;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.cancel-button {
  padding: 8px 16px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  color: var(--color-text);
}

.import-button {
  padding: 8px 16px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.import-button:hover {
  background-color: var(--color-primary-dark);
}

.import-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.close-modal-button {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: var(--color-text);
}
</style>
