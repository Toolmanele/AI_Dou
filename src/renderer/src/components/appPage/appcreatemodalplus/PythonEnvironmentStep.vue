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
        <div class="form-group">
          <label>Python 版本</label>
          <select v-model="env.pythonVersion">
            <option value="3.8">Python 3.8</option>
            <option value="3.9">Python 3.9</option>
            <option value="3.10">Python 3.10</option>
            <option value="3.11">Python 3.11</option>
            <option value="3.12">Python 3.12</option>
          </select>
        </div>

        <div class="form-group">
          <label>
            安装命令
            <span class="add-command" @click="addInstallPIPCommand(index)"
              >+</span
            >
          </label>
          <div
            v-for="(cmd, cmdIndex) in env.pip.installCommands"
            :key="cmdIndex"
            class="command-item"
          >
            <input type="text" v-model="env.installCommands[cmdIndex]" />
            <button
              class="remove-button"
              @click="removeInstallCommand(index, cmdIndex)"
            >
              ×
            </button>
          </div>
          <div class="command-hint">
            每行一条安装命令，如 pip install -r requirements.txt
          </div>
        </div>

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
import { ref } from "vue";
import { useAppCreateStore } from "../../../stores/appCreateStore";

const props = defineProps({
  isActive: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["install-environment", "go-to-settings"]);
const store = useAppCreateStore();
const stepRef = ref(null);

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

// Add installation command
function addPIPInstallCommand(index) {
  store.appData.pythonEnvironments[index].pip.installCommands.push("");
}

// Remove installation command
function removePIPInstallCommand(envIndex, cmdIndex) {
  store.appData.pythonEnvironments[envIndex].pip.installCommands.splice(
    cmdIndex,
    1
  );
}

// Add new environment
function addEnvironment() {
  store.appData.pythonEnvironments.push({
    pythonVersion: "3.10",
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
    pipMirrorType: "default",
    customPipMirrorUrl: "",
    customPipMirrorName: "",
  });
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
</style>
