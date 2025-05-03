<template>
  <div
    id="step-3"
    ref="stepRef"
    class="step-form"
    :class="{ active: isActive }"
  >
    <h3 class="step-title">Python 环境</h3>

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
            {{ env.isDefault ? "默认" : "环境 " + (index + 1) }}
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
            {{ env.isCollapsed ? "展开" : "收起" }}
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
                  {{
                    getFormattedCommands(
                      [cmd],
                      "pytorch",
                      env.pytorch.source
                    )[0]
                  }}
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
                    --index-url={{
                      formatData.getSourceUrl(env.pip.source, "pip")
                    }}
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
          <div
            v-if="store.errors.startCommand && isFirst(index)"
            class="error-message"
          >
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
            <span v-if="env.isInstalling">
              <span class="spinner"></span> 正在安装...
            </span>
            <span v-else>安装 Python {{ env.pythonVersion }}</span>
          </button>

          <div v-if="env.needConfigAppSpace" class="config-needed">
            <p>需要先配置 AppSpace 目录</p>
            <button class="settings-button" @click="goToSettings">
              前往设置
            </button>
          </div>
        </div>

        <div
          v-if="env.isInstalling || env.installLogs.length > 0"
          class="installation-logs"
        >
          <div class="logs-header">
            <h4>安装日志</h4>
            <button
              class="toggle-logs-button"
              @click="env.showLogs = !env.showLogs"
            >
              {{ env.showLogs ? "隐藏" : "显示" }}
            </button>
          </div>

          <div v-if="env.showLogs" class="logs-content">
            <div v-if="env.isInstalling" class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: env.installProgress + '%' }"
              ></div>
            </div>

            <div v-if="env.installError" class="install-error">
              {{ env.installError }}
            </div>

            <div class="logs">
              <div
                v-for="(log, logIndex) in env.installLogs"
                :key="logIndex"
                class="log-item"
              >
                {{ log }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="add-environment">
      <button class="add-environment-button" @click="addEnvironment">
        + 添加环境
      </button>
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
import { ref, onMounted, watch, nextTick, computed } from "vue";
import { useAppCreateStore } from "../../../stores/appCreateStore";
import formatData from "../../../services/formatData";

const props = defineProps({
  isActive: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["install-environment", "go-to-settings"]);
const store = useAppCreateStore();
const stepRef = ref(null);

// Python versions available for selection
const pythonVersions = ["3.8", "3.9", "3.10", "3.11", "3.12", "3.13"];

// textarea refs
const commandTextareas = ref([]);

// 自动调整所有 textarea 高度
function resizeAllTextareas() {
  nextTick(() => {
    if (commandTextareas.value) {
      commandTextareas.value.forEach((el) => {
        if (el) autoResizeTextarea(el);
      });
    }
  });
}

// 监听命令变化
watch(
  () =>
    store.appData.pythonEnvironments
      .map((env) => {
        console.log("env", env);
        return [...env.pytorch.installCommands, ...env.pip.installCommands];
      })
      .flat(),
  resizeAllTextareas,
  { immediate: true }
);

// 自动选择最快的镜像
async function selectFastestMirrors() {
  try {
    // 测试最快的 PIP 镜像
    const fastestPipSource = await formatData.getFastestPipMirrorUrl();
    console.log("最快的 PIP 镜像:", fastestPipSource);

    // 测试最快的 PyTorch 镜像
    const fastestPytorchSource = await formatData.getFastestPytorchMirrorUrl();
    console.log("最快的 PyTorch 镜像:", fastestPytorchSource);

    // 更新所有环境的镜像源
    store.appData.pythonEnvironments.forEach((env) => {
      env.pip.source = fastestPipSource;
      env.pytorch.source = fastestPytorchSource;
    });
  } catch (error) {
    console.error("选择最快镜像时出错:", error);
  }
}

// 在组件挂载时自动选择最快的镜像
onMounted(() => {
  resizeAllTextareas();
  // 自动选择最快的,暂时不需要这个功能
  // selectFastestMirrors();
});

// Check if this is the first environment
function isFirst(index) {
  return index === 0;
}

// Toggle environment collapsed state
function toggleEnvironment(index) {
  // First environment should always be expanded
  if (!isFirst(index)) {
    store.appData.pythonEnvironments[index].isCollapsed =
      !store.appData.pythonEnvironments[index].isCollapsed;
  }
}

// Set default environment
function setDefaultEnvironment(index) {
  // Remove default flag from all environments
  store.appData.pythonEnvironments.forEach((env, i) => {
    env.isDefault = i === index;
  });
}

// Source update functions
function updatePytorchSource(env, source) {
  env.pytorch.source = source;
}

function updatePipSource(env, source) {
  env.pip.source = source;
}

// Command management functions
function addPytorchCommand(env) {
  env.pytorch.installCommands.push("");
}

function removePytorchCommand(env, index) {
  env.pytorch.installCommands.splice(index, 1);
}

function addPipCommand(env) {
  env.pip.installCommands.push("");
}

function removePipCommand(env, index) {
  env.pip.installCommands.splice(index, 1);
}

// Command formatting
function getFormattedCommands(commands, type, source) {
  return formatData.formatCommands(commands, type, source);
}

// Create computed properties for formatted commands
const getFormattedPytorchCommands = (env) => {
  return computed(() => {
    return getFormattedCommands(
      env.pytorch.installCommands,
      "pytorch",
      env.pytorch.source
    );
  });
};

const getFormattedPipCommands = (env) => {
  return computed(() => {
    return getFormattedCommands(env.pip.installCommands, "pip", env.pip.source);
  });
};

// Textarea auto-resize
function autoResizeTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
}

// Add new environment
function addEnvironment() {
  // 找到默认环境
  const defaultEnv = store.appData.pythonEnvironments.find(
    (env) => env.isDefault
  );
  let newEnv;
  if (defaultEnv) {
    // 深拷贝默认环境
    newEnv = JSON.parse(JSON.stringify(defaultEnv));
    // 状态字段重置
    newEnv.isDefault = false;
    newEnv.isInstalled = false;
    newEnv.isInstalling = false;
    newEnv.installLogs = [];
    newEnv.installError = "";
    newEnv.installProgress = 0;
    newEnv.showLogs = false;
    // 你可以根据需要重置更多字段
  } else {
    // 没有默认环境时，使用原有的默认模板
    newEnv = {
      pythonVersion: "3.10",
      pytorchCommand: "pip install torch torchvision torchaudio",
      installCommands: ["pip install -r requirements.txt"],
      startCommand: "python main.py",
      isInstalled: false,
      isDefault: false,
      isCollapsed: true,
      isInstalling: false,
      installProgress: 0,
      installLogs: [],
      installError: "",
      needConfigAppSpace: false,
      showLogs: false,
      pythonPath: "",
      pipMirrorType: "official",
      pytorchMirrorType: "official",
      customPipMirrorUrl: "",
      customPipMirrorName: "",
    };
  }
  store.appData.pythonEnvironments.push(newEnv);
}

// Install environment
function installEnvironment(index) {
  emit("install-environment", index);
}

// Go to settings
function goToSettings() {
  emit("go-to-settings");
}

// Expose the stepRef to parent
defineExpose({
  stepRef,
});
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

input[type="text"],
select {
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
  color: var(--color-text);
  font-size: 14px;
  transition: all 0.2s ease;
}

input[type="text"]:focus,
select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-hover);
}

input[type="text"].error {
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

.add-environment {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.add-environment-button {
  padding: 8px 16px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text);
  transition: all 0.2s;
}

.add-environment-button:hover {
  background-color: var(--color-hover);
  border-color: var(--color-primary-light);
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

.config-needed {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-needed p {
  margin: 0;
  font-size: 13px;
  color: #e53e3e;
}

/* New styles for horizontal version selector */
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

/* PyTorch and PIP configuration styles */
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

.config-commands {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.command-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.command-textarea {
  flex: 1;
  min-height: 36px;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  font-family: monospace;
  font-size: 14px;
  line-height: 1.4;
  resize: none;
  overflow-y: hidden;
}

.command-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.add-command {
  align-self: flex-start;
  padding: 4px 12px;
  border-radius: 4px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--color-primary);
  cursor: pointer;
  font-size: 14px;
}

.add-command:hover {
  background: var(--color-hover);
}

.remove-button {
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--color-danger);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}

.remove-button:hover {
  background: var(--color-hover);
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

.command-display {
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
</style>
