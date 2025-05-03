import { defineStore } from "pinia";
import { ref, reactive } from "vue";
export const useAppCreateStore = defineStore("appCreate", () => {
  // 应用基本数据
  const pythonEnvTemplate = [
    {
      pythonVersion: "3.10",
      pytorch: {
        source: "",
        installCommands: ["pip install torch torchvision torchaudio"],
      },
      pip: {
        source: "",
        installCommands: ["pip install -r requirements.txt"],
      },
      startCommand: "",
      isInstalled: false,
      isDefault: true,
      isCollapsed: false,
      isInstalling: false,
      installProgress: 0,
      installLogs: [],
      installError: "",
      needConfigAppSpace: false,
      showLogs: false,
      pythonPath: "",
    },
  ];
  const appDataTemplate = {
    id: "",
    name: "",
    version: "1.0.0",
    type: "app",
    from: "", // folder, github, seed
    description: "",
    tags: [],
    folderPath: "",
    modelDir: "",
    outputDir: "",
    createdAt: "",

    // GitHub 仓库配置
    github: {
      repos: [],
    },

    // GitHub 安装进度跟踪
    githubInstallLogs: [],
    githubInstallStatus: "", // 'progress', 'success', 'error'
    githubInstallError: "",

    // 种子数据
    seedData: null,
    // Python 环境配置
    pythonEnvironments: pythonEnvTemplate,
  };

  const appData = reactive({ ...appDataTemplate });
  const githubTemp = reactive({
    repos: [],
  });
  const seedTemp = reactive({
    seed: null,
  });
  const folderTemp = reactive({
    workingDir: "",
  });
  // 错误信息
  const errors = reactive({
    name: "",
    startCommand: "",
    repoUrl: "",
    customMirrorUrl: "",
  });

  const lastSelectedSource = ref("");
  // 当前选中的种子
  const selectedSeed = ref(null);

  // 选择创建来源
  async function selectSource(source) {
    if (lastSelectedSource.value !== source) {
      // 保存当前数据到临时存储
      if (appData.from === "folder") {
        if (folderTemp.workingDir) {
          // basename
          // appData.name = await window.electronAPI.getFolderBasename(
          //   folderTemp.workingDir
          // );
          // console.log(appData.name);
          appData.folderPath = folderTemp.workingDir;
        }
      } else if (appData.from === "github") {
        if (githubTemp.repos && githubTemp.repos.length) {
          let selectedRepo = githubTemp.repos.find((repo) => repo.isSelected);
          if (selectedRepo) {
            let url = new URL(selectedRepo.url);
            appData.name = url.pathname.split("/").pop();
            appData.folderPath =
              await window.electronAPI.getAppappData.folderPath(
                selectedRepo.path
              );
          }
        }
      }

      // 切换来源
      appData.from = source;

      // 恢复临时存储的数据
    }
  }

  // 处理文件夹选择结果
  function handleFolderConfirm(data) {
    appData.from = "folder";
    appData.folderPath = data.path;
    appData.workingDir = data.path;
  }

  // 处理GitHub设置结果
  function handleGithubConfirm(data) {
    // showGithubModal.value = false;
    appData.from = "github";

    // 保存 Git 仓库配置
    appData.github = {
      ...appData.github,
      ...data.config,
    };

    // 同时更新临时存储
    appData.githubTemp = {
      repoUrl: data.config.repoUrl,
      repoAddresses: data.config.repoAddresses || [],
      name: data.config.name || "",
      defaultRepoUrl: data.config.defaultRepoUrl || data.config.repoUrl,
    };
  }

  // 处理种子选择结果
  function handleSeedConfirm(data) {
    appData.from = "seed";
    selectedSeed.value = data.seed;
    appData.seedData = data.seed;

    // 自动填充应用信息
    if (data.seed.name && !appData.name) {
      appData.name = data.seed.name;
    }

    if (data.seed.description && !appData.description) {
      appData.description = data.seed.description;
    }

    // 添加标签
    if (
      data.seed.tags &&
      data.seed.tags.length > 0 &&
      appData.tags.length === 0
    ) {
      appData.tags = [...data.seed.tags];
    }
  }

  // 重置表单
  function resetForm() {
    Object.assign(appData, { ...appDataTemplate });

    // 重置错误信息
    Object.assign(errors, {
      name: "",
      startCommand: "",
      repoUrl: "",
      customMirrorUrl: "",
    });

    // 重置 GitHub 安装进度
    appData.githubInstallLogs = [];
    appData.githubInstallStatus = "";
    appData.githubInstallError = "";

    // 重置其他状态
    selectedSeed.value = null;
  }

  // 加载现有应用数据
  function loadExistingApp(app) {
    if (!app) return;

    // 加载基本信息
    appData.id = app.id || `app-${Date.now()}`;
    appData.name = app.name || "";
    appData.description = app.description || "";
    appData.tags = Array.isArray(app.tags) ? [...app.tags] : [];
    appData.createdAt = app.createdAt || new Date().toISOString();

    // 加载GitHub信息
    if (app.github) {
      appData.github = {
        repoUrl: app.github.repoUrl || "",
        useMirror: app.github.useMirror || false,
        mirrorType: app.github.mirrorType || "global",
        customMirrorUrl: app.github.customMirrorUrl || "",
        name: app.github.name || "",
        defaultRepoUrl: app.github.defaultRepoUrl || "",
        repoAddresses: app.github.repoAddresses || [],
      };
    }

    // 加载Python环境信息
    if (app.pythonInfo) {
      // 兼容旧数据格式
      if (!Array.isArray(app.pythonInfo)) {
        appData.pythonEnvironments = [
          {
            pythonVersion: app.pythonInfo.version || "3.10",
            installCommands:
              Array.isArray(app.pythonInfo.installCommands) &&
              app.pythonInfo.installCommands.length
                ? [...app.pythonInfo.installCommands]
                : ["pip install -r requirements.txt"],
            startCommand: app.pythonInfo.startCommand || "python main.py",
            isInstalled: app.pythonInfo.isInstalled || false,
            isDefault: true,
            isCollapsed: false,
            isInstalling: false,
            installProgress: 0,
            installLogs: [],
            installError: "",
            needConfigAppSpace: false,
            showLogs: false,
            pythonPath: app.pythonInfo.pythonPath || "",
            pipMirrorType: app.pythonInfo.pipMirrorType || "default",
            customPipMirrorUrl: app.pythonInfo.customPipMirrorUrl || "",
            customPipMirrorName: app.pythonInfo.customPipMirrorName || "",
          },
        ];
      } else {
        // 新格式：环境列表
        appData.pythonEnvironments = app.pythonInfo.map((env, index) => ({
          pythonVersion: env.pythonVersion || "3.10",
          installCommands: env.installCommands || [
            "pip install -r requirements.txt",
          ],
          startCommand: env.startCommand || "",
          isDefault: env.isDefault || index === 0,
          isInstalled: env.isInstalled || false,
          isCollapsed: index !== 0,
          isInstalling: false,
          installProgress: 0,
          installLogs: env.installLogs || [],
          installError: env.installError || "",
          needConfigAppSpace: false,
          showLogs: false,
          pythonPath: env.pythonPath || "",
          pipMirrorType: env.pipMirrorType || "default",
          customPipMirrorUrl: env.customPipMirrorUrl || "",
          customPipMirrorName: env.customPipMirrorName || "",
        }));

        // 确保至少有一个默认环境
        if (!appData.pythonEnvironments.some((env) => env.isDefault)) {
          appData.pythonEnvironments[0].isDefault = true;
        }
      }

      appData.workingDir = app.pythonInfo.workingDir || "";

      // 更新appData.folderPath
      if (app.pythonInfo.workingDir) {
        appData.folderPath = app.pythonInfo.workingDir;
      }
    }

    // 加载模型信息
    if (app.modelInfo) {
      appData.modelType = app.modelInfo.type || "auto-import";

      // 加载直接定义的目录
      if (app.modelInfo.modelDir) {
        appData.modelDir = app.modelInfo.modelDir;
      }

      if (app.modelInfo.modelCacheDir) {
        appData.modelCacheDir = app.modelInfo.modelCacheDir;
      }

      if (app.modelInfo.outputDir) {
        appData.outputDir = app.modelInfo.outputDir;
      }

      // 兼容旧版本：从modelFolders数组加载目录
      if (
        Array.isArray(app.modelInfo.modelFolders) &&
        app.modelInfo.modelFolders.length
      ) {
        // 如果目录未直接设置，从modelFolders获取
        if (!appData.modelDir && app.modelInfo.modelFolders[0]) {
          appData.modelDir = app.modelInfo.modelFolders[0];
        }

        if (!appData.modelCacheDir && app.modelInfo.modelFolders[1]) {
          appData.modelCacheDir = app.modelInfo.modelFolders[1];
        }

        if (!appData.outputDir && app.modelInfo.modelFolders[2]) {
          appData.outputDir = app.modelInfo.modelFolders[2];
        }
      }

      // API相关信息
      appData.apiProvider = app.modelInfo.apiProvider || "openai";
      appData.customApiEndpoint = app.modelInfo.apiEndpoint || "";

      // 出于安全考虑，不直接加载API密钥
      // 而是表明是否有密钥
      appData.apiKey = app.modelInfo.hasApiKey ? "********" : "";
    }

    // 根据from设置正确的创建来源
    if (app.pythonInfo && app.pythonInfo.workingDir) {
      appData.from = "folder";
    } else if (app.github && app.github.repoUrl) {
      appData.from = "github";
    } else {
      appData.from = "seed";
    }
  }

  // 添加/移除标签
  function addTag(tag) {
    if (tag && !appData.tags.includes(tag)) {
      appData.tags.push(tag);
    }
  }

  function removeTag(tag) {
    const index = appData.tags.indexOf(tag);
    if (index !== -1) {
      appData.tags.splice(index, 1);
    }
  }

  function toggleTag(tag) {
    if (appData.tags.includes(tag)) {
      removeTag(tag);
    } else {
      addTag(tag);
    }
  }

  // 验证表单
  function validateForm() {
    let isValid = true;

    // 验证应用名称
    if (!appData.name.trim()) {
      errors.name = "应用名称不能为空";
      isValid = false;
    } else {
      errors.name = "";
    }

    // 验证启动命令
    if (!appData.pythonEnvironments[0]?.startCommand.trim()) {
      errors.startCommand = "启动命令不能为空";
      isValid = false;
    } else {
      errors.startCommand = "";
    }

    // 验证GitHub仓库地址（仅当选择GitHub来源时）
    if (appData.from === "github") {
      if (!appData.github.repoUrl.trim()) {
        errors.repoUrl = "GitHub 仓库地址不能为空";
        isValid = false;
      } else {
        const githubUrlPattern =
          /^(https?:\/\/)?(www\.)?github\.com\/[\w.-]+\/[\w.-]+(\.git)?$/;
        if (!githubUrlPattern.test(appData.github.repoUrl)) {
          errors.repoUrl = "GitHub 仓库地址格式不正确";
          isValid = false;
        } else {
          errors.repoUrl = "";
        }
      }
    }

    return isValid;
  }

  // 设置文件夹路径
  async function setFolderPath(path) {
    appData.folderPath = path;
    appData.workingDir = path;

    let result = await window.electronAPI.getFolderBasename(path);
    console.log("result", result);
  }

  // 直接设置应用数据
  function setAppData(data) {
    if (!data) return;

    // 设置基本信息
    if (data.name) appData.name = data.name;
    if (data.description) appData.description = data.description;
    if (Array.isArray(data.tags)) appData.tags = [...data.tags];
    if (data.folderPath) {
      appData.folderPath = data.folderPath;
    }

    // 设置模型相关信息
    if (data.modelDir) appData.modelDir = data.modelDir;
    if (data.outputDir) appData.outputDir = data.outputDir;

    // 设置环境信息
    if (
      Array.isArray(data.pythonEnvironments) &&
      data.pythonEnvironments.length > 0
    ) {
      appData.pythonEnvironments = data.pythonEnvironments.map((env) => ({
        pythonVersion: env.pythonVersion || "3.10",
        pytorch: {
          source: env.pytorch?.source || "",
          installCommands: env.pytorch?.installCommands || [
            "pip install torch torchvision torchaudio",
          ],
        },
        pip: {
          source: env.pip?.source || "",
          installCommands: env.pip?.installCommands || [
            "pip install -r requirements.txt",
          ],
        },
        startCommand: env.startCommand || "",
        isInstalled: env.isInstalled || false,
        isDefault: env.isDefault || false,
        isCollapsed: false,
        isInstalling: false,
        installProgress: 0,
        installLogs: [],
        installError: "",
        needConfigAppSpace: false,
        showLogs: false,
        pythonPath: env.pythonPath || "",
      }));

      // 确保至少有一个默认环境
      if (!appData.pythonEnvironments.some((env) => env.isDefault)) {
        appData.pythonEnvironments[0].isDefault = true;
      }
    }
  }

  // 从种子数据直接设置应用数据
  async function setAppDataFromSeed(seed) {
    console.log("seed", seed);
    if (!seed) return;

    // 设置来源为种子
    appData.from = "seed";
    selectedSeed.value = seed;
    appData.seedData = seed;
    appData.folderPath = await window.electronAPI.getAppFolderPath(seed.name);

    // 设置基本信息
    if (seed.name && !appData.name) {
      appData.name = seed.name;
    }

    if (seed.description && !appData.description) {
      appData.description = seed.description;
    }

    // 添加标签
    if (seed.tags && seed.tags.length > 0 && appData.tags.length === 0) {
      appData.tags = [...seed.tags];
    }

    // 设置Python环境信息
    if (
      seed.pytorch?.installCommands &&
      seed.pytorch.installCommands.length > 0
    ) {
      // 检测系统类型和GPU信息
      let systemInfo = {
        platform: "unknown",
        gpu: "unknown",
        hasNvidia: false,
        hasAMD: false,
        hasIntel: false,
      };

      // 尝试从后端获取系统信息
      try {
        // 使用 window.electronAPI 获取系统信息
        if (window.electronAPI && window.electronAPI.getGpuOsInfo) {
          // 使用异步函数获取系统信息
          const info = await window.electronAPI.getGpuOsInfo();
          console.log("info", info);

          systemInfo = {
            platform: info.platform || "unknown", // "win32", "darwin", "linux"
            gpu: info.gpuType || "unknown",
            hasNvidia: info.hasNvidia || false,
            hasAMD: info.hasAMD || false,
            hasIntel: info.hasIntel || false,
          };

          // 处理安装命令
          processInstallCommands(seed, systemInfo);
        } else {
          // 回退到浏览器检测
          fallbackSystemDetection(seed);
        }
      } catch (error) {
        console.error("获取系统信息失败:", error);
        // 回退到浏览器检测
        fallbackSystemDetection(seed);
      }
    }

    console.log("appData", appData);
    // 处理安装命令的函数
    function processInstallCommands(seed, systemInfo) {
      // 创建默认的Python环境
      const defaultEnv = {
        pythonVersion: seed.python || "3.10",
        startCommand: seed.launch_command?.[0] || "python main.py",
        isInstalled: false,
        isDefault: true,
        isCollapsed: false,
        isInstalling: false,
        installProgress: 0,
        installLogs: [],
        installError: "",
        needConfigAppSpace: false,
        showLogs: false,
        pythonPath: "",
        pytorch: {
          source: seed.pytorch?.source || "",
          installCommands: [],
        },
        pip: {
          source: seed.pip?.source || "",
          installCommands: [],
        },
      };

      // 处理PyTorch安装命令
      if (
        seed.pytorch?.installCommands &&
        seed.pytorch.installCommands.length > 0
      ) {
        let selectedCommand = "pip install torch torchvision torchaudio";

        // 根据系统平台和GPU类型选择安装命令
        if (
          systemInfo.platform === "win32" ||
          systemInfo.platform === "Windows"
        ) {
          if (systemInfo.hasNvidia) {
            // 查找NVIDIA命令
            const nvidiaCommand = seed.pytorch.installCommands.find(
              (cmd) => cmd.name === "nvidia" || cmd.name === "cuda"
            );
            if (nvidiaCommand) {
              selectedCommand = nvidiaCommand.value;
            }
          } else if (systemInfo.hasAMD) {
            // 查找AMD Windows命令
            const amdCommand = seed.pytorch.installCommands.find(
              (cmd) => cmd.name === "amd-windows" || cmd.name === "directml"
            );
            if (amdCommand) {
              selectedCommand = amdCommand.value;
            }
          } else if (systemInfo.hasIntel) {
            // 查找Intel命令
            const intelCommand = seed.pytorch.installCommands.find(
              (cmd) => cmd.name === "xpu" || cmd.name === "intel"
            );
            if (intelCommand) {
              selectedCommand = intelCommand.value;
            }
          } else {
            // 默认CPU版本
            const cpuCommand = seed.pytorch.installCommands.find(
              (cmd) => cmd.name === "cpu"
            );
            if (cpuCommand) {
              selectedCommand = cpuCommand.value;
            }
          }
        } else if (systemInfo.platform === "linux") {
          if (systemInfo.hasNvidia) {
            // 查找NVIDIA命令
            const nvidiaCommand = seed.pytorch.installCommands.find(
              (cmd) => cmd.name === "nvidia" || cmd.name === "cuda"
            );
            if (nvidiaCommand) {
              selectedCommand = nvidiaCommand.value;
            }
          } else if (systemInfo.hasAMD) {
            // 查找AMD Linux命令
            const amdCommand = seed.pytorch.installCommands.find(
              (cmd) => cmd.name === "amd-linux" || cmd.name === "rocm"
            );
            if (amdCommand) {
              selectedCommand = amdCommand.value;
            }
          } else if (systemInfo.hasIntel) {
            // 查找Intel命令
            const intelCommand = seed.pytorch.installCommands.find(
              (cmd) => cmd.name === "xpu" || cmd.name === "intel"
            );
            if (intelCommand) {
              selectedCommand = intelCommand.value;
            }
          } else {
            // 默认CPU版本
            const cpuCommand = seed.pytorch.installCommands.find(
              (cmd) => cmd.name === "cpu"
            );
            if (cpuCommand) {
              selectedCommand = cpuCommand.value;
            }
          }
        } else if (
          systemInfo.platform === "darwin" ||
          systemInfo.platform === "Mac"
        ) {
          // Mac通常使用CPU版本
          const cpuCommand = seed.pytorch.installCommands.find(
            (cmd) => cmd.name === "cpu" || cmd.name === "mac"
          );
          if (cpuCommand) {
            selectedCommand = cpuCommand.value;
          }
        } else {
          // 未知平台，使用默认命令
          const cpuCommand = seed.pytorch.installCommands.find(
            (cmd) => cmd.name === "cpu"
          );
          if (cpuCommand) {
            selectedCommand = cpuCommand.value;
          }
        }

        defaultEnv.pytorch.installCommands = [selectedCommand];
      }

      // 处理pip安装命令
      if (seed.pip?.installCommands && seed.pip.installCommands.length > 0) {
        defaultEnv.pip.installCommands = seed.pip.installCommands;
      }

      // 设置环境
      appData.pythonEnvironments = [defaultEnv];

      // 设置模型和输出目录
      if (seed.modelsFolder) {
        appData.modelDir = seed.modelsFolder;
      }

      if (seed.outputFolder) {
        appData.outputDir = seed.outputFolder;
      }

      // 设置GitHub信息
      if (seed.github?.repos && seed.github.repos.length > 0) {
        appData.github = {
          repos: seed.github.repos,
        };
      }
    }

    // 回退到浏览器检测
    function fallbackSystemDetection(seed) {
      // 检测系统类型
      const userAgent = navigator.userAgent.toLowerCase();
      let platform = "unknown";

      if (userAgent.includes("windows")) {
        platform = "win32";
      } else if (userAgent.includes("mac")) {
        platform = "darwin";
      } else if (userAgent.includes("linux")) {
        platform = "linux";
      }

      // 尝试检测GPU
      let hasNvidia = false;
      let hasAMD = false;
      let hasIntel = false;

      if (window.WebGLRenderingContext) {
        const canvas = document.createElement("canvas");
        const gl =
          canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (gl) {
          const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
          if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            if (renderer.toLowerCase().includes("nvidia")) {
              hasNvidia = true;
            } else if (
              renderer.toLowerCase().includes("amd") ||
              renderer.toLowerCase().includes("radeon")
            ) {
              hasAMD = true;
            } else if (renderer.toLowerCase().includes("intel")) {
              hasIntel = true;
            }
          }
        }
      }

      const systemInfo = {
        platform: platform,
        gpu: hasNvidia
          ? "nvidia"
          : hasAMD
          ? "amd"
          : hasIntel
          ? "intel"
          : "unknown",
        hasNvidia: hasNvidia,
        hasAMD: hasAMD,
        hasIntel: hasIntel,
      };

      // 处理安装命令
      processInstallCommands(seed, systemInfo);
    }
  }

  return {
    // 状态

    appData,
    errors,
    selectedSeed,
    githubTemp,
    seedTemp,
    folderTemp,
    // 方法
    selectSource,
    handleFolderConfirm,
    handleGithubConfirm,
    handleSeedConfirm,
    resetForm,
    loadExistingApp,
    addTag,
    removeTag,
    toggleTag,
    validateForm,
    setFolderPath,
    setAppData,
    setAppDataFromSeed,
  };
});
