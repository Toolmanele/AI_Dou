<template>
  <div class="env-modal-overlay" @click="$emit('close')">
    <div class="env-modal-container" @click.stop>
      <div class="env-modal-header">
        <h3>{{ isEditing ? '编辑 Python 环境' : '添加 Python 环境' }}</h3>
        <button class="close-modal-button" @click="$emit('close')">×</button>
      </div>
      <div class="env-modal-body">
        <!-- Python Version Selection - Horizontal Button Group -->
        <div class="form-group">
          <label>Python 版本</label>
          <div class="version-selector">
            <button
              v-for="version in pythonVersions"
              :key="version"
              class="version-button"
              :class="{ active: environment.pythonVersion === version }"
              @click="environment.pythonVersion = version"
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
                  :class="{ active: environment.pytorch.source === 'official' }"
                  @click="updatePytorchSource('official')"
                >
                  官方
                </button>
                <button
                  class="source-button"
                  :class="{ active: environment.pytorch.source === 'aliyun' }"
                  @click="updatePytorchSource('aliyun')"
                >
                  阿里
                </button>
              </div>
            </div>
            <label>PyTorch配置命令</label>
            <div class="config-commands">
              <div
                v-for="(cmd, cmdIndex) in environment.pytorch.installCommands"
                :key="cmdIndex"
                class="command-item"
              >
                <div class="command-display">
                  {{ getFormattedCommands([cmd], 'pytorch', environment.pytorch.source)[0] }}
                </div>
                <textarea
                  ref="commandTextareas"
                  :key="`pytorch-modal-${cmdIndex}`"
                  v-model="environment.pytorch.installCommands[cmdIndex]"
                  :rows="Math.max(1, cmd.split('\n').length)"
                  class="command-textarea hidden"
                  @input="autoResizeTextarea($event.target)"
                ></textarea>
                <button
                  v-if="environment.pytorch.installCommands.length > 1"
                  class="remove-button"
                  @click="removePytorchCommand(cmdIndex)"
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
                  :class="{ active: environment.pip.source === 'official' }"
                  @click="updatePipSource('official')"
                >
                  官方
                </button>
                <button
                  class="source-button"
                  :class="{ active: environment.pip.source === 'tsinghua' }"
                  @click="updatePipSource('tsinghua')"
                >
                  清华
                </button>
                <button
                  class="source-button"
                  :class="{ active: environment.pip.source === 'aliyun' }"
                  @click="updatePipSource('aliyun')"
                >
                  阿里
                </button>
              </div>
            </div>
            <div class="pip-label-row">
              <label>PIP安装命令</label>
              <button class="add-command" @click="addPipCommand">+</button>
            </div>
            <div class="config-commands">
              <div
                v-for="(cmd, cmdIndex) in environment.pip.installCommands"
                :key="cmdIndex"
                class="command-item"
              >
                <div class="command-input-container">
                  <span class="command-tip">
                    --index-url={{ formatData.getSourceUrl(environment.pip.source, 'pip') }}
                  </span>
                  <input
                    type="text"
                    v-model="environment.pip.installCommands[cmdIndex]"
                    class="command-input"
                    placeholder="例如: pip install -r requirements.txt"
                  />
                  <button
                    v-if="environment.pip.installCommands.length > 1"
                    class="remove-button"
                    @click="removePipCommand(cmdIndex)"
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
            v-model="environment.startCommand"
            placeholder="例如: python main.py"
            :class="{ error: errors.startCommand }"
          />
          <div v-if="errors.startCommand" class="error-message">
            {{ errors.startCommand }}
          </div>
          <div class="command-hint">应用启动时执行的命令</div>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="environment.isDefault" />
            <span>设为默认环境</span>
          </label>
        </div>

        <div class="env-modal-actions">
          <button class="cancel-button" @click="$emit('close')">取消</button>
          <button class="save-button" @click="saveEnvironment">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, nextTick } from 'vue'
import formatData from '../../../services/formatData'

const props = defineProps({
  environment: {
    type: Object,
    required: true
  },
  isEditing: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'save'])

// Python versions available for selection
const pythonVersions = ['3.8', '3.9', '3.10', '3.11', '3.12', '3.13']

// Error state
const errors = reactive({
  startCommand: ''
})

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

// Source update functions
function updatePytorchSource(source) {
  props.environment.pytorch.source = source
}

function updatePipSource(source) {
  props.environment.pip.source = source
}

// Command management functions
function addPytorchCommand() {
  props.environment.pytorch.installCommands.push('')
}

function removePytorchCommand(index) {
  props.environment.pytorch.installCommands.splice(index, 1)
}

function addPipCommand() {
  props.environment.pip.installCommands.push('')
}

function removePipCommand(index) {
  props.environment.pip.installCommands.splice(index, 1)
}

// Command formatting
function getFormattedCommands(commands, type, source) {
  return formatData.formatCommands(commands, type, source)
}

// Textarea auto-resize
function autoResizeTextarea(textarea) {
  textarea.style.height = 'auto'
  textarea.style.height = textarea.scrollHeight + 'px'
}

// Save environment
function saveEnvironment() {
  // Validate form
  if (!props.environment.startCommand) {
    errors.startCommand = '启动命令不能为空'
    return
  }

  // Clear errors if no issues
  errors.startCommand = ''

  // Emit save event with environment data
  emit('save', props.environment)
}

// Watch for changes to resize textareas
watch(
  () => props.environment.pytorch.installCommands.concat(props.environment.pip.installCommands),
  resizeAllTextareas,
  { deep: true }
)

onMounted(() => {
  resizeAllTextareas()
})
</script>

<style scoped>
.env-modal-overlay {
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

.env-modal-container {
  width: 700px;
  max-width: 90%;
  max-height: 90vh;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.env-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  height: 32px;
  border-bottom: 1px solid var(--color-border);
}

.env-modal-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  color: var(--color-text-strong);
}

.env-modal-body {
  padding: 5px 20px;
  overflow-y: auto;
  flex: 1;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
}

.env-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.form-group label {
  padding-top: 4px;
  padding-bottom: 6px;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-strong);
  display: flex;
  align-items: center;
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

.version-selector,
.source-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 10px;
  width: 100%;
}

.source-buttons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 10px;
  width: 100%;
}

.version-button,
.source-button {
  min-width: 80px;
  max-width: 120px;
  height: 40px;
  padding: 0 18px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-sizing: border-box;
  width: 100%;
  justify-self: center;
}

.version-button:hover,
.source-button:hover {
  background-color: var(--color-hover);
}

.version-button.active,
.source-button.active {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.add-command {
  margin-left: 8px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background);
  /* border-radius: 50%; */
  cursor: pointer;
  font-size: 16px;
  color: var(--color-primary);
  border: 1px solid var(--color-border);
}

.add-command:hover {
  background-color: var(--color-hover);
}

.command-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.command-input-container {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  margin-bottom: 8px;
}

.command-tip {
  position: absolute;
  top: -14px;
  right: 0px;
  background: rgba(233, 233, 233, 0.85);
  color: #838383;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 6px;
  z-index: 2;
  pointer-events: none;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #ccc;
}

.command-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  font-family: monospace;
  font-size: 14px;
  line-height: 1.4;
}

.command-input:focus {
  outline: none;
}

.cancel-button {
  color: var(--color-text);
  padding: 8px 16px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
}

.save-button {
  padding: 8px 16px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.save-button:hover {
  background-color: var(--color-primary-dark);
}

.config-commands {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.command-display {
  width: 100%;
  padding: 8px 12px;
  border-radius: 6px;
  background-color: var(--color-background-secondary);
  font-family: monospace;
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 8px;
  white-space: pre-wrap;
  word-break: break-all;
}

.hidden {
  display: none;
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

.pip-label-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.pip-label-row label {
  margin-bottom: 0;
}

.close-modal-button {
  background: none;
  border: none;
  font-size: 18px;
  padding: 5px;
  cursor: pointer;
  color: var(--color-text-light);
}
.close-modal-button:hover {
  background-color: transparent;
  box-shadow: none;
  /* box-shadow: var(--shadow-md); */
}
.pytorch-config,
.pip-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.source-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.source-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
}
</style>
