<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h2>{{ store.appData.id ? "编辑应用" : "应用配置" }}</h2>
        <div class="header-actions">
          <button class="close-button" @click="closeModal">×</button>
        </div>
      </div>

      <div class="modal-body">
        <!-- Step sidebar -->
        <StepsSidebar
          :currentStep="currentStep"
          :canSaveConfig="canSaveConfig"
          :isSaving="isSaving"
          :isConfigMode="true"
          @step-change="scrollToStep"
          @reset="resetForm"
          @save="saveConfig"
        />

        <!-- Step content -->
        <div
          class="content-container"
          ref="contentContainer"
          @scroll="handleScroll"
        >
          <div class="step-content">
            <!-- Step 1: Basic Info -->
            <BasicInfoStep
              ref="step0"
              :isActive="currentStep === 0"
              :isConfigMode="true"
              @browse-directory="browseDirectory"
            />

            <!-- Step 2: Directory Setup -->
            <DirectorySetupStep
              ref="step1"
              :isActive="currentStep === 1"
              @browse-directory="browseDirectory"
            />

            <!-- Step 3: Python Environment -->
            <PythonEnvironmentStep
              ref="step2"
              :isActive="currentStep === 2"
              @install-environment="installEnvironment"
              @go-to-settings="goToSettings"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
console.log("appconfigModal", AppCreateModal);
import { ref, computed, nextTick, onMounted, watch } from "vue";
import { useAppCreateStore } from "../../../stores/appCreateStore";
import { useSettingsStore } from "../../../stores/settings";
import electronStore from "../../../services/electronStore";

// Import components
import BasicInfoStep from "./BasicInfoStepConfig.vue";
import DirectorySetupStep from "./DirectorySetupStep.vue";
import PythonEnvironmentStep from "./PythonEnvironmentStepPlus.vue";
import StepsSidebar from "./StepsSidebarConfig.vue";
import AppCreateModal from "../AppCreateModal.vue";

// Get the stores
const store = useAppCreateStore();
const settingsStore = useSettingsStore();

// Define props
const props = defineProps({
  appData: {
    type: Object,
    default: null,
  },
});
console.log("props", props.appData);
// Emit events
const emit = defineEmits(["close", "save", "openSettings"]);

// Current step
const currentStep = ref(0);

// References for step components
const step0 = ref(null);
const step1 = ref(null);
const step2 = ref(null);
const contentContainer = ref(null);

// Saving state
const isSaving = ref(false);

// Computed property to determine if the config can be saved
const canSaveConfig = computed(() => {
  // 基本验证：应用名称不能为空且默认环境的启动命令不能为空
  return (
    store.appData.name.trim().length > 0 &&
    store.appData.pythonEnvironments[0]?.startCommand.trim().length > 0
  );
});

// Function to close the modal
function closeModal() {
  emit("close");
}

// Scroll variables
let scrollTimeout = null;
let isScrolling = false;

// Scroll to a specific step
function scrollToStep(index) {
  if (!contentContainer.value) return;

  // Disable scroll handler to prevent triggering handleScroll
  isScrolling = true;

  // Get references to all steps
  const stepRefs = [step0.value, step1.value, step2.value];
  const targetStep = stepRefs[index]?.stepRef;

  if (targetStep) {
    // Scroll to target position
    contentContainer.value.scrollTo({
      top: targetStep.offsetTop - 20, // Slight offset for better visual effect
      behavior: "smooth",
    });

    // Set current step
    currentStep.value = index;

    // Re-enable scroll handler after a delay
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
    }, 500);
  }
}

// Handle scroll event
function handleScroll() {
  if (isScrolling || !contentContainer.value) return;

  // Add throttling to avoid excessive calculations
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    // Get DOM positions of each step
    const stepRefs = [step0.value, step1.value, step2.value];
    const container = contentContainer.value;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;

    // Determine which step is closest to viewport center
    let closestStep = 0;
    let minDistance = Infinity;

    stepRefs.forEach((step, index) => {
      if (!step || !step.stepRef) return;

      const stepRef = step.stepRef;
      const stepTop = stepRef.offsetTop;
      const stepHeight = stepRef.clientHeight;
      const stepCenter = stepTop + stepHeight / 2;
      const viewportCenter = scrollTop + containerHeight / 2;
      const distance = Math.abs(stepCenter - viewportCenter);

      if (distance < minDistance) {
        minDistance = distance;
        closestStep = index;
      }
    });

    // Update current step
    if (currentStep.value !== closestStep) {
      currentStep.value = closestStep;
    }
  }, 100);
}

// Directory browsing
async function browseDirectory(directory) {
  try {
    // 使用 Electron API 打开目录选择对话框
    if (window.electronAPI && window.electronAPI.showOpenDialog) {
      // 设置对话框标题
      let title = "选择目录";
      if (directory === "workingDir") title = "选择工作目录";
      else if (directory === "modelDir") title = "选择模型目录";
      else if (directory === "modelCacheDir") title = "选择模型缓存目录";
      else if (directory === "outputDir") title = "选择输出目录";

      // 调用 electron 的文件夹选择对话框
      const result = await window.electronAPI.showOpenDialog({
        title: title,
        defaultPath: store.appData[directory] || "",
        properties: ["openDirectory"],
      });

      // 如果用户选择了目录
      if (
        result &&
        !result.canceled &&
        result.filePaths &&
        result.filePaths.length > 0
      ) {
        const selectedPath = result.filePaths[0];
        store.appData[directory] = selectedPath;

        // If it's the working directory, update the folderPath in the store
        if (directory === "workingDir") {
          store.setFolderPath(selectedPath);
        }

        console.log(`已选择${directory}:`, selectedPath);
        return selectedPath;
      }
    } else if (window.electronAPI && window.electronAPI.selectDirectory) {
      // 尝试使用备用方法
      const result = await window.electronAPI.selectDirectory();
      if (result && !result.canceled && result.filePath) {
        store.appData[directory] = result.filePath;

        // If it's the working directory, update the folderPath in the store
        if (directory === "workingDir") {
          store.setFolderPath(result.filePath);
        }

        console.log(`已选择${directory}:`, result.filePath);
        return result.filePath;
      }
    } else {
      // 如果没有可用的 electronAPI，显示一个警告
      console.warn("目录选择功能需要 Electron 环境");
    }
  } catch (err) {
    console.error(`选择${directory}失败:`, err);
  }
  return null;
}

// Install environment function
async function installEnvironment(index) {
  if (!window.electronAPI) {
    alert("安装环境需要使用Electron API，但当前环境不支持。");
    return;
  }

  const env = store.appData.pythonEnvironments[index];

  // 设置安装状态
  env.isInstalling = true;
  env.installProgress = 0;
  env.installLogs = [];
  env.installError = "";
  env.needConfigAppSpace = false;

  try {
    console.log(`开始安装Python ${env.pythonVersion}环境...`);

    // 创建安装进度监听器
    const removeListener = window.electronAPI.onPythonInstallProgress(
      (data) => {
        console.log("安装进度更新:", data);

        // 更新安装日志
        if (data.message) {
          env.installLogs.push(data.message);
        }

        // 更新进度
        if (data.status === "progress" && typeof data.progress === "number") {
          env.installProgress = data.progress;
        }

        // 安装完成
        if (data.status === "progress" && data.progress === 100) {
          env.isInstalled = true;
          env.isInstalling = false;
        }

        // 安装失败
        if (data.status === "error") {
          env.isInstalling = false;
          env.installError = data.message;
        }
      }
    );

    // 获取pip镜像URL
    const pipMirrorUrl = getPipMirrorUrl(env);

    // 获取GitHub镜像URL
    const githubMirrorUrl = getGithubMirrorUrl();

    // 调用安装API
    const result = await window.electronAPI.installPythonEnvironment({
      version: env.pythonVersion,
      appPath: store.appData.workingDir || "",
      pipMirrorUrl: pipMirrorUrl,
      githubMirrorUrl: githubMirrorUrl,
    });

    console.log("安装结果:", result);

    if (result.success) {
      env.isInstalled = true;
      env.pythonPath = result.pythonPath;
      env.installLogs.push("✅ 安装成功！");
    } else {
      // 检查是否是AppSpace配置问题
      if (result.needConfig) {
        env.needConfigAppSpace = true;
        env.installError = result.error;
        env.installLogs.push("⚠️ " + result.error);
        env.installLogs.push("请前往设置页面配置AppSpace目录后再试。");
      } else {
        env.installError = result.error || "安装失败";
        env.installLogs.push("❌ " + (result.error || "安装失败"));
      }
    }
  } catch (error) {
    console.error("安装过程出错:", error);
    env.installError = error.message || "安装过程出错";
    env.installLogs.push("❌ " + (error.message || "安装过程出错"));
  } finally {
    env.isInstalling = false;
  }
}

// Reset form function
function resetForm() {
  if (confirm("确定要重置表单吗？此操作将清空所有已填写的信息。")) {
    store.resetForm();
  }
}

// Function to get GitHub mirror URL based on type
function getGithubMirrorUrl() {
  if (!store.appData.github.useMirror) return null;

  switch (store.appData.github.mirrorType) {
    case "global":
      // Get from the settings store
      return settingsStore.githubMirrorUrl || null;
    case "default":
      return "https://ghproxy.com/";
    case "custom":
      return store.appData.github.customMirrorUrl || null;
    default:
      return null;
  }
}

// Function to get pip mirror URL based on type
function getPipMirrorUrl(env) {
  switch (env.pipMirrorType) {
    case "default":
      return "https://pypi.org/simple";
    case "tsinghua":
      return "https://pypi.tuna.tsinghua.edu.cn/simple";
    case "aliyun":
      return "https://mirrors.aliyun.com/pypi/simple/";
    case "tencent":
      return "https://mirrors.cloud.tencent.com/pypi/simple";
    case "huawei":
      return "https://repo.huaweicloud.com/repository/pypi/simple";
    case "custom":
      return env.customPipMirrorUrl || null;
    default:
      return "https://pypi.org/simple";
  }
}

// Save config function
async function saveConfig() {
  if (!canSaveConfig.value) {
    console.warn("Cannot save config: validation failed", {
      name: store.appData.name,
      startCommand: store.appData.pythonEnvironments[0]?.startCommand,
    });
    return;
  }

  try {
    isSaving.value = true;
    console.log("Starting config save process");

    // Validate all required fields
    if (!store.validateForm()) {
      isSaving.value = false;
      return;
    }

    // Prepare app data - fit for existing apps.json format
    const appConfig = {
      id: store.appData.id || Date.now(),
      name: store.appData.name,
      version: store.appData.version || "1.0.0",
      type: store.appData.type || "app",
      from: store.appData.from || "folder",
      description: store.appData.description || "无描述",
      tags: store.appData.tags.length ? store.appData.tags : [],
      lastUsedAt: new Date().toISOString().split("T")[0],
      icon: "💡",
      createdAt:
        store.appData.createdAt || new Date().toISOString().split("T")[0],

      // GitHub configuration
      github: {
        repos: store.appData.github.repos || [],
      },

      // Python environment information
      pythonInfo: store.appData.pythonEnvironments.map((env) => ({
        pythonVersion: env.pythonVersion,
        installCommands: env.installCommands.filter((cmd) => cmd.trim()),
        startCommand: env.startCommand,
        isInstalled: env.isInstalled || false,
        isDefault: env.isDefault || false,
        pipMirrorType: env.pipMirrorType || "default",
        customPipMirrorUrl: env.customPipMirrorUrl || "",
        customPipMirrorName: env.customPipMirrorName || "",
        pythonPath: env.pythonPath || "",
      })),

      // Model information
      modelInfo: {
        type: store.appData.modelType || "auto-import",
        modelDir: store.appData.modelDir || "",
        modelCacheDir: store.appData.modelCacheDir || "",
        outputDir: store.appData.outputDir || "",
        modelFolders: [
          store.appData.modelDir,
          store.appData.modelCacheDir,
          store.appData.outputDir,
        ].filter((dir) => dir.trim()),
        apiProvider: store.appData.apiProvider || "openai",
        apiEndpoint: store.appData.customApiEndpoint || "",
        hasApiKey:
          !!store.appData.apiKey && store.appData.apiKey !== "********",
      },
    };

    // Handle API key
    if (store.appData.apiKey && store.appData.apiKey !== "********") {
      appConfig.modelInfo.apiKey = store.appData.apiKey;
    }

    // Emit the updated config
    emit("save", appConfig);

    // Close the modal
    closeModal();
  } catch (error) {
    console.error("Error saving config:", error);
    alert("保存失败，请重试");
  } finally {
    isSaving.value = false;
  }
}

// Go to settings page
function goToSettings() {
  closeModal();
  emit("openSettings");
}

// Component onMounted
onMounted(() => {
  // Initialize scroll position
  nextTick(() => {
    if (contentContainer.value && step0.value?.stepRef) {
      contentContainer.value.scrollTop = 0;
    }
  });

  // Set app data if provided
  if (props.appData) {
    store.setAppData(props.appData);
  }
});
</script>

<style scoped>
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
  backdrop-filter: blur(2px);
}

.modal-container {
  background-color: var(--color-card);
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  width: 850px;
  max-width: 95vw;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modal-appear 0.3s ease-out;
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 6px;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-card);
}

.modal-header h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  color: var(--color-text-strong);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--color-text-light);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
}

.close-button:hover {
  background-color: var(--color-hover);
}

.modal-body {
  display: flex;
  flex: 1;
  height: 600px;
  overflow: hidden;
  position: relative;
}

/* Content container */
.content-container {
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
  scroll-padding-top: 20px;
  height: 600px;
  padding: 0 30px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
}

.step-content {
  padding-top: 20px;
  padding-bottom: 30px;
}
</style>
