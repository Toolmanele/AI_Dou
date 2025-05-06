export const pythonEnvTemplate = [
  {
    pythonVersion: '3.10',
    pytorch: {
      source: '',
      installCommands: ['pip install torch torchvision torchaudio']
    },
    pip: {
      source: '',
      installCommands: ['pip install -r requirements.txt']
    },
    startCommand: '',
    isInstalled: false,
    isDefault: true,
    isCollapsed: false,
    isInstalling: false,
    installProgress: 0,
    installLogs: [],
    installError: '',
    needConfigAppSpace: false,
    showLogs: false,
    pythonPath: ''
  }
]

export const appDataTemplate = {
  id: '',
  name: '',
  version: '1.0.0',
  type: 'app',
  from: '', // folder, github, seed
  description: '',
  tags: [],
  folderPath: '',
  modelDir: '',
  outputDir: '',
  createdAt: '',

  // GitHub 仓库配置
  github: {
    repos: []
  },

  // GitHub 安装进度跟踪
  githubInstallLogs: [],
  githubInstallStatus: '', // 'progress', 'success', 'error'
  githubInstallError: '',

  // 种子数据
  seedData: null,
  // Python 环境配置
  pythonEnvironments: pythonEnvTemplate
}
export const pytorchSource = [
  { name: '官方', url: 'download.pytorch.org/whl' },
  { name: '阿里', url: 'mirrors.aliyun.com/pytorch-wheels' }
]

export const pipSource = [
  { name: '官方', url: 'pypi.org/simple' },
  { name: '阿里', url: 'mirrors.aliyun.com/pypi/simple' },
  { name: '清华', url: 'pypi.tuna.tsinghua.edu.cn/simple' }
]
