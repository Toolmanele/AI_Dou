import { defineStore } from "pinia";
import { ref, computed } from "vue";
import electronStore from "../services/electronStore";

// 使用组合式API风格定义 Settings Store
export const useSettingsStore = defineStore("settings", () => {
  // 基础设置
  const appSpace = ref(""); // 应用空间路径
  const huggingfaceDir = ref(""); // HuggingFace 模型存储目录
  const pipSource = ref("https://pypi.org/simple"); // pip 默认源
  const githubMirrorUrl = ref(""); // GitHub 镜像地址
  const version = ref("1.0.0"); // 应用版本

  // 高级设置
  const debugMode = ref(false); // 调试模式

  // 系统设置
  const language = ref("zh_CN"); // 应用语言
  const theme = ref("light"); // 应用主题

  // 系统信息缓存
  const cachedSystemInfo = ref(null); // 缓存的系统信息

  // 内置的 pip 源选项
  const pipSourceOptions = [
    { label: "官方源 (PyPI)", value: "https://pypi.org/simple" },
    { label: "清华大学源", value: "https://pypi.tuna.tsinghua.edu.cn/simple" },
    { label: "阿里云源", value: "https://mirrors.aliyun.com/pypi/simple" },
    {
      label: "腾讯云源",
      value: "https://mirrors.cloud.tencent.com/pypi/simple",
    },
    {
      label: "华为云源",
      value: "https://repo.huaweicloud.com/repository/pypi/simple",
    },
  ];

  // 内置的 GitHub 镜像选项
  const githubMirrorOptions = [
    { label: "不使用镜像", value: "" },
    { label: "ghproxy.com", value: "https://ghproxy.com/" },
    { label: "GitHub 镜像 1", value: "https://github.moeyy.xyz/" },
    { label: "FastGit", value: "https://download.fastgit.org/" },
    { label: "GitClone", value: "https://gitclone.com/github.com/" },
    { label: "自定义", value: "custom" },
  ];

  // 获取配置
  async function loadSettings() {
    try {
      // 从存储中读取设置
      const settings = await electronStore.readJsonFile("settings");
      if (settings) {
        // 应用从存储中读取的设置
        appSpace.value = settings.appSpace || "";
        huggingfaceDir.value = settings.huggingfaceDir || "";
        pipSource.value = settings.pipSource || "https://pypi.org/simple";
        githubMirrorUrl.value = settings.githubMirrorUrl || "";
        version.value = settings.version || "1.0.0";
        debugMode.value = settings.debugMode || false;
        language.value = settings.language || "zh_CN";
        theme.value = settings.theme || "light";
        cachedSystemInfo.value = settings.systemInfo || null;
      }
    } catch (error) {
      console.error("加载设置失败:", error);
    }
  }

  // 保存配置
  async function saveSettings() {
    try {
      // 准备设置对象
      const settings = {
        appSpace: appSpace.value,
        huggingfaceDir: huggingfaceDir.value,
        pipSource: pipSource.value,
        githubMirrorUrl: githubMirrorUrl.value,
        version: version.value,
        debugMode: debugMode.value,
        language: language.value,
        theme: theme.value,
        systemInfo: cachedSystemInfo.value,
      };

      // 保存到存储
      await electronStore.writeJsonFile("settings", settings);
      return true;
    } catch (error) {
      console.error("保存设置失败:", error);
      return false;
    }
  }

  // 立即更新并保存单个设置
  async function updateSetting(key, value) {
    try {
      if (key in this) {
        this[key] = value;
        // 立即保存更改
        await saveSettings();
        return true;
      }
      return false;
    } catch (error) {
      console.error(`更新设置失败 (${key}):`, error);
      return false;
    }
  }

  // 缓存系统信息
  async function cacheSystemInfo(systemInfo) {
    if (systemInfo) {
      cachedSystemInfo.value = systemInfo;
      await saveSettings();
      return true;
    }
    return false;
  }

  // 获取缓存的系统信息
  function getCachedSystemInfo() {
    return cachedSystemInfo.value;
  }

  // 选择目录并立即保存设置
  async function selectDirectory(settingName) {
    if (window.electronAPI && window.electronAPI.showOpenDialog) {
      try {
        // 调用 electron 的文件夹选择对话框
        const result = await window.electronAPI.showOpenDialog({
          title:
            settingName === "appSpace"
              ? "选择应用空间目录"
              : "选择HuggingFace模型目录",
          defaultPath:
            settingName === "appSpace" ? appSpace.value : huggingfaceDir.value,
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

          // 根据传入的设置名称更新对应的路径
          if (settingName === "appSpace") {
            appSpace.value = selectedPath;
          } else if (settingName === "huggingfaceDir") {
            huggingfaceDir.value = selectedPath;
          }

          // 立即保存设置
          await saveSettings();
          return selectedPath;
        }
      } catch (error) {
        console.error("选择目录失败:", error);
      }
    } else {
      console.warn("electronAPI.showOpenDialog 不可用");
      // 在开发环境中，模拟选择目录的行为
      if (process.env.NODE_ENV === "development") {
        const mockPath =
          settingName === "appSpace"
            ? "C:\\Users\\User\\AppData\\Local\\AIDoU\\AppSpace"
            : "C:\\Users\\User\\AppData\\Local\\AIDoU\\Models";

        if (settingName === "appSpace") {
          appSpace.value = mockPath;
        } else if (settingName === "huggingfaceDir") {
          huggingfaceDir.value = mockPath;
        }

        // 立即保存设置
        await saveSettings();
        return mockPath;
      }
    }
    return null;
  }

  // 重置为默认设置
  async function resetToDefaults() {
    appSpace.value = "";
    huggingfaceDir.value = "";
    pipSource.value = "https://pypi.org/simple";
    githubMirrorUrl.value = "";
    version.value = "1.0.0";
    debugMode.value = false;
    language.value = "zh_CN";
    theme.value = "light";

    // 立即保存默认设置
    await saveSettings();
  }

  // 初始化设置
  async function initializeSettings() {
    // 确保设置文件存在
    try {
      // 检查设置文件是否存在，不存在则创建
      const settings = await electronStore.readJsonFile("settings");
      if (!settings) {
        // 首次初始化，保存默认设置
        await saveSettings();
      } else {
        // 如果设置已存在，加载它们
        await loadSettings();
      }
      return true;
    } catch (error) {
      console.error("初始化设置失败:", error);
      return false;
    }
  }

  // 返回 store 的公共 API
  return {
    // 状态
    appSpace,
    huggingfaceDir,
    pipSource,
    githubMirrorUrl,
    version,
    debugMode,
    language,
    theme,
    pipSourceOptions,
    githubMirrorOptions,
    cachedSystemInfo,

    // Actions
    loadSettings,
    saveSettings,
    updateSetting,
    selectDirectory,
    resetToDefaults,
    initializeSettings,
    cacheSystemInfo,
    getCachedSystemInfo,
  };
});
