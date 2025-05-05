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

      <div
        v-for="(env, index) in store.appData.pythonEnvironments"
        :key="index"
        class="environment-item"
        :class="{ collapsed: env.isCollapsed && !isFirst(index) }"
      >
        <div class="environment-header" @click="toggleEnvironment(index)">
          <div class="environment-title">
            <div
              class="environment-badge"
              :class="{ default: env.isDefault }"
              @click.stop="setDefaultEnvironment(index)"
            >
              {{ env.isDefault ? '默认' : '环境 ' + (index + 1) }}
            </div>
            <span>Python {{ env.pythonVersion }}</span>
            <span v-if="env.isInstalled" class="installed-badge">已安装</span>
          </div>
          <div class="environment-actions">
            <button
              v-if="!isFirst(index)"
              class="collapse-button"
              @click.stop="toggleEnvironment(index)"
            >
              {{ env.isCollapsed ? '展开' : '收起' }}
            </button>
          </div>
        </div>

        <div class="environment-content">
          <!-- Python Version Selection - Horizontal Button Group -->
          <div class="form-group">
            <label>Python 版本</label>
            <div class="version-selector">
              <button
                v-for="version in pythonVersions"
                :key="version"
                class="version-button"
                :class="{ active: env.pythonVersion === version }"
                @click="env.pythonVersion = version"
              >
                {{ version }}
              </button>
            </div>
          </div>

          <!-- PyTorch Configuration -->
          <div class="form-group">
            <div class="pytorch-config">
              <div class="source-selector">
                <label class="source-label">PyTorch 源</label>
                <div class="source-buttons">
                  <button
                    class="source-button"
                    :class="{ active: env.pytorch.source === 'official' }"
                    @click="updatePytorchSource(env, 'official')"
                  >
                    官方
                  </button>
                  <button
                    class="source-button"
                    :class="{ active: env.pytorch.source === 'aliyun' }"
                    @click="updatePytorchSource(env, 'aliyun')"
                  >
                    阿里
                  </button>
                </div>
              </div>
              <label>PyTorch配置命令</label>
              <div class="config-commands">
                <div
                  v-for="(cmd, cmdIndex) in env.pytorch.installCommands"
                  :key="cmdIndex"
                  class="command-item"
                >
                  <div class="command-display">
                    {{ getFormattedCommands([cmd], 'pytorch', env.pytorch.source)[0] }}
                  </div>
                  <textarea
                    ref="commandTextareas"
                    :key="`pytorch-${index}-${cmdIndex}`"
                    v-model="env.pytorch.installCommands[cmdIndex]"
                    :rows="Math.max(1, cmd.split('\n').length)"
                    class="command-textarea hidden"
                    @input="autoResizeTextarea($event.target)"
                  ></textarea>
                  <button
                    v-if="env.pytorch.installCommands.length > 1"
                    class="remove-button"
                    @click="removePytorchCommand(env, cmdIndex)"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- PIP Source Configuration -->
          <div class="form-group">
            <div class="pip-config">
              <div class="source-selector">
                <label class="source-label">PIP 源</label>
                <div class="source-buttons source-buttons-grid">
                  <button
                    class="source-button"
                    :class="{ active: env.pip.source === 'official' }"
                    @click="updatePipSource(env, 'official')"
                  >
                    官方
                  </button>
                  <button
                    class="source-button"
                    :class="{ active: env.pip.source === 'tsinghua' }"
                    @click="updatePipSource(env, 'tsinghua')"
                  >
                    清华
                  </button>
                  <button
                    class="source-button"
                    :class="{ active: env.pip.source === 'aliyun' }"
                    @click="updatePipSource(env, 'aliyun')"
                  >
                    阿里
                  </button>
                </div>
              </div>
              <div class="pip-label-row">
                <label>PIP安装命令</label>
                <button class="add-command" @click="addPipCommand(env)">+</button>
              </div>
              <div class="config-commands">
                <div
                  v-for="(cmd, cmdIndex) in env.pip.installCommands"
                  :key="cmdIndex"
                  class="command-item"
                >
                  <div class="command-input-container">
                    <span class="command-tip">
                      --index-url={{ formatData.getSourceUrl(env.pip.source, 'pip') }}
                    </span>
                    <input
                      type="text"
                      v-model="env.pip.installCommands[cmdIndex]"
                      class="command-input"
                      placeholder="例如: pip install -r requirements.txt"
                    />
                    <button
                      v-if="env.pip.installCommands.length > 1"
                      class="remove-button"
                      @click="removePipCommand(env, cmdIndex)"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Launch Command -->
          <div class="form-group">
            <label>启动命令 <span class="required">*</span></label>
            <input
              type="text"
              v-model="env.startCommand"
              placeholder="例如: python main.py"
              :class="{ error: store.errors.startCommand && isFirst(index) }"
            />
            <div v-if="store.errors.startCommand && isFirst(index)" class="error-message">
              {{ store.errors.startCommand }}
            </div>
            <div class="command-hint">应用启动时执行的命令</div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="env.isDefault" />
              <span>设为默认环境</span>
            </label>
          </div>

          <div v-if="!env.isInstalled" class="install-section">
            <button
              class="install-button"
              @click="installEnvironment(index)"
              :disabled="env.isInstalling"
            >
              <span v-if="env.isInstalling"> <span class="spinner"></span> 正在安装... </span>
              <span v-else>安装 Python {{ env.pythonVersion }}</span>
            </button>

            <div v-if="env.needConfigAppSpace" class="config-needed">
              <p>需要先配置 AppSpace 目录</p>
              <button class="settings-button" @click="goToSettings">前往设置</button>
            </div>
          </div>

          <div v-if="env.isInstalling || env.installLogs.length > 0" class="installation-logs">
            <div class="logs-header">
              <h4>安装日志</h4>
              <button class="toggle-logs-button" @click="env.showLogs = !env.showLogs">
                {{ env.showLogs ? '隐藏' : '显示' }}
              </button>
            </div>

            <div v-if="env.showLogs" class="logs-content">
              <div v-if="env.isInstalling" class="progress-bar">
                <div class="progress-fill" :style="{ width: env.installProgress + '%' }"></div>
              </div>

              <div v-if="env.installError" class="install-error">
                {{ env.installError }}
              </div>

              <div class="logs">
                <div v-for="(log, logIndex) in env.installLogs" :key="logIndex" class="log-item">
                  {{ log }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

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
            <button
              class="import-button"
              :disabled="!importEnvInfo"
              @click="importPythonEnvironment"
            >
              导入
            </button>
          </div>
        </div>
      </div>
    </div>

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
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import { useAppCreateStore } from '../../../stores/appCreateStore'
import formatData from '../../../services/formatData'

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

// textarea refs
const commandTextareas = ref([])

// 自动调整所有 textarea 高度
function resizeAllTextareas() {
  nextTick(() => {
    if (commandTextareas.value) {
      commandTextareas.value.forEach((el) => {
        if (el) autoResizeTextarea(el)
      })
    }
  })
}

// 监听命令变化
watch(
  () =>
    store.appData.pythonEnvironments
      .map((env) => {
        console.log('env', env)
        return [...env.pytorch.installCommands, ...env.pip.installCommands]
      })
      .flat(),
  resizeAllTextareas,
  { immediate: true }
)

// 自动选择最快的镜像
async function selectFastestMirrors() {
  try {
    // 测试最快的 PIP 镜像
    const fastestPipSource = await formatData.getFastestPipMirrorUrl()
    console.log('最快的 PIP 镜像:', fastestPipSource)

    // 测试最快的 PyTorch 镜像
    const fastestPytorchSource = await formatData.getFastestPytorchMirrorUrl()
    console.log('最快的 PyTorch 镜像:', fastestPytorchSource)

    // 更新所有环境的镜像源
    store.appData.pythonEnvironments.forEach((env) => {
      env.pip.source = fastestPipSource
      env.pytorch.source = fastestPytorchSource
    })
  } catch (error) {
    console.error('选择最快镜像时出错:', error)
  }
}

// 在组件挂载时自动选择最快的镜像
onMounted(() => {
  resizeAllTextareas()
  // 自动选择最快的,暂时不需要这个功能
  // selectFastestMirrors();
})

// Check if this is the first environment
function isFirst(index) {
  return index === 0
}

// Toggle environment collapsed state
function toggleEnvironment(index) {
  // First environment should always be expanded
  if (!isFirst(index)) {
    store.appData.pythonEnvironments[index].isCollapsed =
      !store.appData.pythonEnvironments[index].isCollapsed
  }
}

// Set default environment
function setDefaultEnvironment(index) {
  // Remove default flag from all environments
  store.appData.pythonEnvironments.forEach((env, i) => {
    env.isDefault = i === index
  })
}

// Source update functions
function updatePytorchSource(env, source) {
  env.pytorch.source = source
}

function updatePipSource(env, source) {
  env.pip.source = source
}

// Command management functions
function addPytorchCommand(env) {
  env.pytorch.installCommands.push('')
}

function removePytorchCommand(env, index) {
  env.pytorch.installCommands.splice(index, 1)
}

function addPipCommand(env) {
  env.pip.installCommands.push('')
}

function removePipCommand(env, index) {
  env.pip.installCommands.splice(index, 1)
}

// Command formatting
function getFormattedCommands(commands, type, source) {
  return formatData.formatCommands(commands, type, source)
}

// Create computed properties for formatted commands
const getFormattedPytorchCommands = (env) => {
  return computed(() => {
    return getFormattedCommands(env.pytorch.installCommands, 'pytorch', env.pytorch.source)
  })
}

const getFormattedPipCommands = (env) => {
  return computed(() => {
    return getFormattedCommands(env.pip.installCommands, 'pip', env.pip.source)
  })
}

// Textarea auto-resize
function autoResizeTextarea(textarea) {
  textarea.style.height = 'auto'
  textarea.style.height = textarea.scrollHeight + 'px'
}

// Add new environment
function addEnvironment() {
  // 找到默认环境
  const defaultEnv = store.appData.pythonEnvironments.find((env) => env.isDefault)
  let newEnv
  if (defaultEnv) {
    // 深拷贝默认环境
    newEnv = JSON.parse(JSON.stringify(defaultEnv))
    // 状态字段重置
    newEnv.isDefault = false
    newEnv.isInstalled = false
    newEnv.isInstalling = false
    newEnv.installLogs = []
    newEnv.installError = ''
    newEnv.installProgress = 0
    newEnv.showLogs = false
    // 你可以根据需要重置更多字段
  } else {
    // 没有默认环境时，使用原有的默认模板
    newEnv = {
      pythonVersion: '3.10',
      pytorchCommand: 'pip install torch torchvision torchaudio',
      installCommands: ['pip install -r requirements.txt'],
      startCommand: 'python main.py',
      isInstalled: false,
      isDefault: false,
      isCollapsed: true,
      isInstalling: false,
      installProgress: 0,
      installLogs: [],
      installError: '',
      needConfigAppSpace: false,
      showLogs: false,
      pythonPath: '',
      pipMirrorType: 'official',
      pytorchMirrorType: 'official',
      customPipMirrorUrl: '',
      customPipMirrorName: ''
    }
  }
  store.appData.pythonEnvironments.push(newEnv)
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

// Add these after the existing const declarations
const showImportModal = ref(false)
const importPath = ref('')
const importEnvInfo = ref(null)
const importError = ref('')
const importEnvType = ref('default')

// Add these after the existing functions
function closeImportModal() {
  showImportModal.value = false
  importPath.value = ''
  importEnvInfo.value = null
  importError.value = ''
  importEnvType.value = 'default'
}

async function browsePythonFolder() {
  try {
    // Use Electron dialog to select a folder
    if (window.electronAPI && window.electronAPI.selectFolder) {
      const result = await window.electronAPI.selectFolder({
        title: '选择 Python 环境文件夹',
        defaultPath: ''
      })

      if (result && result.filePaths && result.filePaths.length > 0) {
        importPath.value = result.filePaths[0]

        // Check if the selected folder contains a Python installation
        await detectPythonEnvironment(importPath.value)
      }
    } else {
      // Fallback for development/browser environment
      importError.value = '无法访问文件系统，请确保在 Electron 环境中运行'
    }
  } catch (error) {
    console.error('选择文件夹出错:', error)
    importError.value = '选择文件夹时出错: ' + error.message
  }
}

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
  display: flex;
  align-items: center;
}

.add-command {
  margin-left: 8px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background);
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  color: var(--color-primary);
  border: 1px solid var(--color-border);
}

.add-command:hover {
  background-color: var(--color-hover);
}

.required {
  color: #e53e3e;
  margin-left: 2px;
}

input[type='text'],
select {
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
  color: var(--color-text);
  font-size: 14px;
  transition: all 0.2s ease;
}

input[type='text']:focus,
select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-hover);
}

input[type='text'].error {
  border-color: #e53e3e;
}

.error-message {
  color: #e53e3e;
  font-size: 13px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal !important;
}

.command-hint {
  font-size: 12px;
  color: var(--color-text-light);
}

.step-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-strong);
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
}

.environment-item {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
}

.environment-item.collapsed .environment-content {
  display: none;
}

.environment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--color-background-secondary);
  cursor: pointer;
}

.environment-header:hover {
  background-color: var(--color-hover);
}

.environment-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
}

.environment-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  cursor: pointer;
}

.environment-badge.default {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.environment-badge:hover {
  background-color: var(--color-hover);
}

.environment-badge.default:hover {
  background-color: var(--color-primary-dark);
}

.installed-badge {
  font-size: 12px;
  padding: 2px 6px;
  background-color: #e7f5e8;
  color: #4caf50;
  border-radius: 4px;
}

.environment-content {
  padding: 16px;
}

.command-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.command-item input {
  flex: 1;
}

.remove-button {
  width: 30px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  color: var(--color-text-light);
}

.remove-button:hover {
  background-color: var(--color-hover);
  color: var(--color-text-strong);
}

.collapse-button {
  padding: 4px 8px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.collapse-button:hover {
  background-color: var(--color-hover);
}

.install-section {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.install-button {
  padding: 8px 16px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.install-button:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
}

.install-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.settings-button {
  padding: 6px 12px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.settings-button:hover {
  background-color: var(--color-hover);
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.installation-logs {
  margin-top: 16px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: var(--color-background-secondary);
  border-bottom: 1px solid var(--color-border);
}

.logs-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}

.toggle-logs-button {
  padding: 4px 8px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.toggle-logs-button:hover {
  background-color: var(--color-hover);
}

.logs-content {
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.progress-bar {
  height: 8px;
  background-color: var(--color-background-secondary);
  border-radius: 4px;
  margin-bottom: 12px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-primary);
  transition: width 0.2s;
}

.install-error {
  padding: 8px 12px;
  background-color: #fef2f2;
  color: #e53e3e;
  border-radius: 4px;
  margin-bottom: 12px;
  font-size: 13px;
}

.logs {
  font-family: monospace;
  font-size: 12px;
  color: var(--color-text);
  white-space: pre-wrap;
  line-height: 1.5;
}

.log-item {
  padding: 2px 0;
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

.import-environment {
  display: none;
}

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

.close-modal-button {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: var(--color-text-light);
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

.path-input-group {
  display: flex;
  gap: 8px;
}

.path-input-group input {
  flex: 1;
}

.browse-button {
  padding: 8px 12px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
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
</style>
