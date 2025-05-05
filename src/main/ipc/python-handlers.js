import { ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import { installPython, consoleProgressCallback } from '../install_pythons/install_python'
import { exec, execFile } from 'child_process'
import { promisify } from 'util'
import { getAppSpaceFromSettings } from '../utils/config'
import git from '../utils/git'
import { findFastestUrl } from '../url/findFastestUrl'

const execPromise = promisify(exec)
const execFilePromise = promisify(execFile)

function setupPythonHandlers() {
  // 检测 Python 版本和 pip 版本
  ipcMain.handle('detect-python-version', async (event, pythonPath) => {
    try {
      console.log(`检测Python路径: ${pythonPath}`)

      // 检查 Python 路径是否存在
      if (!fs.existsSync(pythonPath)) {
        return {
          success: false,
          error: `Python路径不存在: ${pythonPath}`
        }
      }

      console.log('检测Python版本')
      // 检测 Python 版本
      const pythonPathQuoted = path.join(pythonPath, 'python.exe')
      let result = {
        success: true,
        pythonPath: pythonPathQuoted,
        pythonVersion: null,
        pipVersion: null,
        pythonExecutable: true,
        pipExecutable: false,
        packages: [],
        error: null
      }
      try {
        // 使用引号处理路径中可能存在的空格
        // const pythonCmd = `${pythonPathQuoted} --version`
        const pythonCmd = `${pythonPathQuoted} --version`
        console.log('pythonCmd', pythonCmd)
        const pythonOutput = await execPromise(pythonCmd)
        console.log('pythonOutput', pythonOutput)
        const versionMatch =
          pythonOutput.stdout.match(/Python\s+([\d.]+)/i) ||
          pythonOutput.stderr.match(/Python\s+([\d.]+)/i)
        if (versionMatch && versionMatch[1]) {
          console.log('Python版本检测成功', versionMatch[1])
          result.pythonVersion = versionMatch[1]
        } else {
          result.pythonExecutable = false
          result.error = 'Python版本检测失败'
        }
      } catch (err) {
        result.pythonExecutable = false
        result.error = `执行Python失败: ${err.message}`
        return result
      }
      console.log('Python版本检测完成')
      console.log('检测pip版本')
      // 检测 pip 版本
      try {
        // 使用引号处理路径中可能存在的空格
        // const pythonPathQuoted = `"${pythonPath}"`
        const pipCmd = `${pythonPathQuoted} -m pip --version`
        const pipOutput = await execPromise(pipCmd)

        const pipVersionMatch =
          pipOutput.stdout.match(/pip\s+([\d.]+)/i) || pipOutput.stderr.match(/pip\s+([\d.]+)/i)
        if (pipVersionMatch && pipVersionMatch[1]) {
          result.pipVersion = pipVersionMatch[1]
          result.pipExecutable = true
          console.log('pip版本检测成功', pipVersionMatch[1])
          // 列出已安装的包
          try {
            const listCmd = `${pythonPathQuoted} -m pip list --format=json`
            const packagesOutput = await execPromise(listCmd)
            const packages = JSON.parse(packagesOutput.stdout)
            result.packages = packages.map((pkg) => ({ name: pkg.name, version: pkg.version }))
            console.log('已安装的包', result.packages)
          } catch (err) {
            console.warn('无法列出已安装的包:', err.message)
            // 不影响主要功能，继续执行
          }
        }
      } catch (err) {
        // pip 可能未安装，这不是致命错误
        console.warn('pip检测失败:', err.message)
      }
      console.log('Python版本检测完成')
      console.log('返回结果', result)
      return result
    } catch (error) {
      console.error('Python版本检测失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  })

  // 处理 Python 环境安装
  ipcMain.handle(
    'install-python-environment',
    async (event, { version, appPath, pipCommands, pytorchCommands }) => {
      console.log(`收到安装 Python ${version} 的请求，应用路径: ${appPath}`)
      try {
        // 从settings.json获取appSpace路径
        const appSpace = getAppSpaceFromSettings()

        if (!appSpace || appSpace.trim() === '') {
          return {
            success: false,
            error: '未配置AppSpace目录。请在设置中配置AppSpace目录后再安装Python环境。',
            needConfig: true
          }
        }

        // Python环境安装目录
        const pythonEnvsDir = path.join(appSpace, 'pythonenvs')
        console.log(`使用AppSpace路径: ${appSpace}, Python环境目录: ${pythonEnvsDir}`)

        // 确保Python环境目录存在
        if (!fs.existsSync(pythonEnvsDir)) {
          fs.mkdirSync(pythonEnvsDir, { recursive: true })
          console.log(`已创建Python环境目录: ${pythonEnvsDir}`)
        }

        // 创建一个用于转发消息到渲染进程的回调
        const progressCallback = (update) => {
          // 同时在控制台记录
          consoleProgressCallback(update)
          // 发送到渲染进程
          event.sender.send('install-progress', update)
        }

        // 首先发送AppSpace路径信息
        progressCallback({
          status: 'info',
          message: `使用AppSpace目录: ${appSpace}`
        })
        progressCallback({
          status: 'info',
          message: `Python环境将安装到: ${pythonEnvsDir}`
        })

        // 开始安装
        const result = await installPython(
          version,
          pythonEnvsDir,
          progressCallback,
          pipCommands,
          pytorchCommands,
          appPath
        )

        console.log('Python 安装完成:', result)
        return result
      } catch (error) {
        console.error('Python 安装失败:', error)
        return {
          success: false,
          error: error.message
        }
      }
    }
  )

  ipcMain.handle('run-app-command', async (event, { pythonPath, launchCommand, cwd }) => {
    console.log('run-app-command', pythonPath, launchCommand, cwd)
    // console.log("run-app-command", pythonPath, launchCommand, cwd);
    // launchCommand 可能是字符串或数组
    // let command = "";
    // if (Array.isArray(launchCommand)) {
    //   // 替换第一个 python 为 pythonPath
    //   launchCommand[0] = pythonPath;
    //   command = launchCommand.join(" ");
    // } else {
    //   command = launchCommand.replace(/^python\b/, pythonPath);
    // }
    // Windows: 用 start 弹出新窗口
    // 添加设置 Python 路径到环境变量的命令
    const pythonDir = path.dirname(pythonPath)
    // 先切换到正确的工作目录，然后设置 PATH 并运行命令
    // const fullCmd = `start cmd /k "cd /d "${cwd}" && set PATH=${pythonDir};%PATH% && ${launchCommand}"`;
    const gitDir = git.getGitPath()
    console.log('gitDir', gitDir)
    const fullCmd = `start cmd /k "cd /d "${cwd}" && set PATH=${gitDir};${pythonDir};${pythonDir}\\Scripts;%PATH% && ${launchCommand}"`

    // 仅用于调试，不影响命令执行
    console.log('Executing command:', fullCmd)

    exec(fullCmd, { cwd }, (error) => {
      if (error) {
        console.error('启动失败:', error)
      }
    })
  })

  // 查找系统上已安装的 Python
  ipcMain.handle('find-python-installations', async (event) => {
    try {
      console.log('查找系统上的Python安装')

      const results = []

      // 检查常见的 Python 安装位置
      const commonPaths = []

      // Windows 常见位置
      if (process.platform === 'win32') {
        // 检查 Python Launcher 注册的版本
        try {
          const pyOutput = await execPromise('py -0')
          const versionLines = pyOutput.stderr.split('\n').filter((line) => line.includes('-'))

          for (const line of versionLines) {
            const match = line.match(/-([\\d.]+)(?:-([\\d]+)?)?/)
            if (match) {
              const version = match[1]
              const arch = match[2] === '64' ? '64-bit' : match[2] === '32' ? '32-bit' : ''

              try {
                // 获取 Python 解释器路径
                const pathOutput = await execPromise(
                  `py -${version} -c "import sys; print(sys.executable)"`
                )
                const pythonPath = pathOutput.stdout.trim().replace(/"/g, '')

                if (pythonPath && fs.existsSync(pythonPath)) {
                  // 检测此 Python 路径的详细信息
                  const versionInfo = await detectPythonVersion(pythonPath)
                  if (versionInfo.success) {
                    results.push({
                      ...versionInfo,
                      source: 'py launcher',
                      architecture: arch
                    })
                  }
                }
              } catch (err) {
                console.warn(`无法获取Python ${version} 路径:`, err.message)
              }
            }
          }
        } catch (err) {
          console.warn('Python Launcher 不可用:', err.message)
        }

        // 检查标准安装位置 (Program Files)
        for (const programFiles of ['C:\\Program Files', 'C:\\Program Files (x86)']) {
          if (fs.existsSync(programFiles)) {
            const pythonDirs = fs
              .readdirSync(programFiles)
              .filter((dir) => dir.toLowerCase().includes('python'))
              .map((dir) => path.join(programFiles, dir))

            for (const pyDir of pythonDirs) {
              const pythonPath = path.join(pyDir, 'python.exe')
              if (fs.existsSync(pythonPath)) {
                commonPaths.push(pythonPath)
              }
            }
          }
        }

        // 检查 AppData Local 目录中的 Python 安装
        const localAppData = process.env.LOCALAPPDATA
        if (localAppData) {
          const pythonDirs = ['Programs\\Python', 'Programs']

          for (const pyDir of pythonDirs) {
            const fullPath = path.join(localAppData, pyDir)
            if (fs.existsSync(fullPath)) {
              const dirs = fs
                .readdirSync(fullPath)
                .filter((dir) => dir.toLowerCase().includes('python'))
                .map((dir) => path.join(fullPath, dir))

              for (const dir of dirs) {
                const pythonPath = path.join(dir, 'python.exe')
                if (fs.existsSync(pythonPath)) {
                  commonPaths.push(pythonPath)
                }
              }
            }
          }
        }
      } else if (process.platform === 'darwin' || process.platform === 'linux') {
        // macOS 和 Linux 路径
        const unixPaths = [
          '/usr/bin/python3',
          '/usr/bin/python',
          '/usr/local/bin/python3',
          '/usr/local/bin/python',
          '/opt/homebrew/bin/python3', // macOS Homebrew
          '/opt/homebrew/bin/python'
        ]

        commonPaths.push(...unixPaths)
      }

      // 检查环境变量中的 Python
      try {
        const pathOutput = await execPromise('python --version')
        if (pathOutput.stdout || pathOutput.stderr) {
          // Python 在环境变量中可用，获取其路径
          const pythonPathOutput = await execPromise(
            'python -c "import sys; print(sys.executable)"'
          )
          const pythonPath = pythonPathOutput.stdout.trim()

          if (pythonPath && fs.existsSync(pythonPath)) {
            commonPaths.push(pythonPath)
          }
        }
      } catch (err) {
        console.warn('环境变量中的 Python 不可用:', err.message)
      }

      try {
        const pathOutput = await execPromise('python3 --version')
        if (pathOutput.stdout || pathOutput.stderr) {
          // Python3 在环境变量中可用，获取其路径
          const pythonPathOutput = await execPromise(
            'python3 -c "import sys; print(sys.executable)"'
          )
          const pythonPath = pythonPathOutput.stdout.trim()

          if (pythonPath && fs.existsSync(pythonPath)) {
            commonPaths.push(pythonPath)
          }
        }
      } catch (err) {
        console.warn('环境变量中的 Python3 不可用:', err.message)
      }

      // 对每个找到的路径检测 Python 版本
      for (const pythonPath of [...new Set(commonPaths)]) {
        try {
          const versionInfo = await detectPythonVersion(pythonPath)
          if (versionInfo.success) {
            results.push({
              ...versionInfo,
              source: '系统安装'
            })
          }
        } catch (err) {
          console.warn(`检测 ${pythonPath} 失败:`, err.message)
        }
      }

      return {
        success: true,
        installations: results
      }
    } catch (error) {
      console.error('查找 Python 安装失败:', error)
      return {
        success: false,
        error: error.message,
        installations: []
      }
    }
  })

  // 辅助函数: 在主进程中检测 Python 版本，供上面的 handler 使用
  async function detectPythonVersion(pythonPath) {
    try {
      if (!fs.existsSync(pythonPath)) {
        return {
          success: false,
          error: `Python路径不存在: ${pythonPath}`
        }
      }

      let result = {
        success: true,
        pythonPath: pythonPath,
        pythonVersion: null,
        pipVersion: null,
        pythonExecutable: true,
        pipExecutable: false,
        packages: [],
        error: null
      }

      // 检测 Python 版本
      try {
        const pythonPathQuoted = `"${pythonPath}"`
        const pythonCmd = `${pythonPathQuoted} --version`
        const pythonOutput = await execPromise(pythonCmd)

        const versionMatch =
          pythonOutput.stdout.match(/Python\s+([\d.]+)/i) ||
          pythonOutput.stderr.match(/Python\s+([\d.]+)/i)
        if (versionMatch && versionMatch[1]) {
          result.pythonVersion = versionMatch[1]
        } else {
          result.pythonExecutable = false
          result.error = 'Python版本检测失败'
        }
      } catch (err) {
        result.pythonExecutable = false
        result.error = `执行Python失败: ${err.message}`
        return result
      }

      // 检测 pip 版本
      try {
        const pythonPathQuoted = `"${pythonPath}"`
        const pipCmd = `${pythonPathQuoted} -m pip --version`
        const pipOutput = await execPromise(pipCmd)

        const pipVersionMatch =
          pipOutput.stdout.match(/pip\s+([\d.]+)/i) || pipOutput.stderr.match(/pip\s+([\d.]+)/i)
        if (pipVersionMatch && pipVersionMatch[1]) {
          result.pipVersion = pipVersionMatch[1]
          result.pipExecutable = true

          // 列出主要的包而不是所有包，以提高性能
          try {
            const listCmd = `${pythonPathQuoted} -m pip list --format=json`
            const packagesOutput = await execPromise(listCmd)
            const allPackages = JSON.parse(packagesOutput.stdout)
            // 只保留一些重要的包信息
            const importantPackages = [
              'numpy',
              'pandas',
              'torch',
              'tensorflow',
              'scipy',
              'matplotlib',
              'scikit-learn'
            ]
            result.packages = allPackages
              .filter((pkg) => importantPackages.includes(pkg.name.toLowerCase()))
              .map((pkg) => ({ name: pkg.name, version: pkg.version }))
          } catch (err) {
            console.warn('无法列出已安装的包:', err.message)
          }
        }
      } catch (err) {
        console.warn('pip检测失败:', err.message)
      }

      return result
    } catch (error) {
      console.error('Python版本检测失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // 使用 detect-python-version 处理函数
  ipcMain.handle('detect-python-version1', async (event, pythonPath) => {
    return await detectPythonVersion(pythonPath)
  })
}

function setupAppHandlers() {
  ipcMain.handle('install-app', async (event, app) => {
    try {
      const result = {
        success: false,
        error: null,
        github: { installed: false, repoPath: null },
        pythonEnvironments: []
      }

      // 从settings.json获取appSpace路径
      const appSpace = getAppSpaceFromSettings()
      console.log('appSpace', appSpace)
      if (!appSpace || appSpace.trim() === '') {
        return {
          success: false,
          error: '未配置AppSpace目录。请在设置中配置AppSpace目录后再安装应用。',
          needConfig: true
        }
      }

      // 检查GitHub仓库是否处于下载/安装状态
      const githubRepos = app.github?.repos || []
      if (githubRepos.length > 0) {
        // 确保repos目录存在
        const reposDir = app.folderPath
        if (!fs.existsSync(reposDir)) {
          fs.mkdirSync(reposDir, { recursive: true })
        }
        let fastestMirrorUrlResult = await findFastestUrl(githubRepos)
        console.log('fastestMirrorUrlResult', fastestMirrorUrlResult)
        let fastestMirrorUrl = fastestMirrorUrlResult.url
        // // 找到默认或第一个仓库
        // const targetRepo =
        //   githubRepos.find((repo) => repo.isDefault) || githubRepos[0];

        // // 检查仓库是否存在
        // if (!targetRepo || !targetRepo.url) {
        //   console.log("没有找到有效的GitHub仓库");
        //   // 继续处理，不返回错误，因为可能还有Python环境需要安装
        // } else {
        //   // 检查是否已安装
        //   if (
        //     targetRepo.isDownloaded &&
        //     targetRepo.localPath &&
        //     fs.existsSync(targetRepo.localPath)
        //   ) {
        //     result.github.installed = true;
        //     result.github.repoPath = targetRepo.localPath;
        //     console.log(`使用已存在的仓库: ${targetRepo.localPath}`);
        //   } else {
        // 找到最快的GitHub镜像
        // const githubMirrors = [
        //   "https://github.com/",
        //   "https://ghproxy.com/https://github.com/",
        //   "https://hub.fastgit.xyz/",
        // ];

        // const fastestMirror = await findFastestUrl(githubMirrors);
        // const mirrorUrl =
        //   fastestMirror && fastestMirror.url
        //     ? fastestMirror.url
        //     : githubMirrors[0];

        // 克隆仓库
        // const fastestMirrorUrl = targetRepo.url;
        const progressCallback = (update) => {
          // 发送到渲染进程
          event.sender.send('github-install-progress', update)
        }

        progressCallback({
          status: 'info',
          message: `开始下载仓库: ${fastestMirrorUrl}`
        })

        // 提取仓库名称并处理重名情况
        let repoName = fastestMirrorUrl
          .split('/')
          .pop()
          .replace(/\.git$/, '')
        // 下载GitHub仓库

        // 使用 reposDir 的 basename 作为仓库名称
        const reposDirBasename = path.basename(reposDir)

        // 获取 reposDir 的父目录，作为 git clone 的目标目录
        const parentDir = path.dirname(reposDir)

        // 检查目标目录是否存在，如果不存在则创建
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true })
        }

        let finalRepoName = reposDirBasename
        let targetPath = reposDir

        // 如果目标路径已存在，尝试使用新名称
        if (fs.existsSync(targetPath)) {
          // 检查是否已经存在git仓库，如果存在则使用
          const gitDir = path.join(targetPath, '.git')
          if (fs.existsSync(gitDir)) {
            progressCallback({
              status: 'info',
              message: `使用已存在的仓库: ${targetPath}`
            })
            result.github.installed = true
            result.github.repoPath = targetPath
          } else {
            // 生成新名称
            finalRepoName = `${reposDirBasename}_${Date.now()}`
            targetPath = path.join(parentDir, finalRepoName)
            progressCallback({
              status: 'info',
              message: `目标目录已存在，将使用新名称: ${finalRepoName}`
            })
          }
        }

        const cloneResult = await git.clone(parentDir, fastestMirrorUrl, finalRepoName, {
          mirror: fastestMirrorUrl,
          depth: 1,
          progressCallback
        })

        if (cloneResult.success) {
          result.github.installed = true
          result.github.repoPath = cloneResult.repoPath

          progressCallback({
            status: 'info',
            message: `仓库下载成功: ${cloneResult.repoPath}`
          })

          // 更新 app.folderPath 为最终克隆的仓库路径
          app.folderPath = cloneResult.repoPath
        } else {
          progressCallback({
            status: 'error',
            message: `仓库下载失败: ${cloneResult.stderr || '未知错误'}`
          })

          // 不立即返回错误，继续安装Python环境
          console.error(`GitHub仓库安装失败: ${cloneResult.stderr || '未知错误'}`)
        }
      }
      // return result;
      // 检查Python环境是否处于安装状态
      const pythonEnvironments = app.pythonEnvironments || []
      if (pythonEnvironments.length > 0) {
        // Python环境安装目录
        const pythonEnvsDir = path.join(appSpace, 'pythonenvs')
        if (!fs.existsSync(pythonEnvsDir)) {
          fs.mkdirSync(pythonEnvsDir, { recursive: true })
        }

        // 按顺序安装每个Python环境
        for (const env of pythonEnvironments) {
          console.log('env', env)
          // 如果环境已安装，跳过
          if (env.isInstalled && env.pythonPath) {
            result.pythonEnvironments.push({
              pythonVersion: env.pythonVersion,
              isInstalled: true,
              pythonPath: env.pythonPath,
              isDefault: env.isDefault || false
            })
            continue
          }

          // 创建进度回调
          const progressCallback = (update) => {
            // 发送到渲染进程
            event.sender.send('python-install-progress', {
              ...update,
              pythonVersion: env.pythonVersion
            })
          }

          progressCallback({
            status: 'info',
            message: `开始安装Python ${env.pythonVersion}环境`
          })

          // 处理pip和pytorch命令
          let pipCommands = []
          let pytorchCommands = []

          if (env.pip?.installCommands) {
            pipCommands = env.pip.installCommands
          }

          if (env.pytorch?.installCommands) {
            pytorchCommands = env.pytorch.installCommands
          }

          console.log('准备安装 python')
          // 安装Python环境
          const installResult = await installPython(
            env.pythonVersion,
            pythonEnvsDir,
            progressCallback,
            pipCommands,
            pytorchCommands,
            result.github.repoPath || app.folderPath || ''
          )
          console.log('安装完成')
          result.pythonEnvironments.push({
            pythonVersion: env.pythonVersion,
            isInstalled: installResult.success,
            pythonPath: installResult.pythonPath,
            error: installResult.error,
            isDefault: env.isDefault || false
          })

          if (!installResult.success) {
            progressCallback({
              status: 'error',
              message: `Python ${env.pythonVersion}环境安装失败: ${
                installResult.error || '未知错误'
              }`
            })
            // 虽然一个环境安装失败，但继续安装其他环境
          }
        }
      }

      // 如果至少一个Python环境安装成功，则将app标记为成功安装
      const hasSuccessfulEnv = result.pythonEnvironments.some((env) => env.isInstalled)

      return {
        success: result.github.installed || hasSuccessfulEnv,
        github: result.github,
        pythonEnvironments: result.pythonEnvironments,
        appPath: result.github.repoPath || app.folderPath || ''
      }
    } catch (error) {
      console.error('应用创建失败:', error)
      return {
        success: false,
        error: error.message || '应用创建过程中发生未知错误',
        github: { installed: false, repoPath: null },
        pythonEnvironments: []
      }
    }
  })
}

export { setupPythonHandlers, setupAppHandlers }
