import { ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import { installPython, consoleProgressCallback } from '../install_pythons/install_python'
import { exec } from 'child_process'
import { getAppSpaceFromSettings } from '../utils/config'
import git from '../utils/git'
import { findFastestUrl } from '../url/findFastestUrl'

function setupPythonHandlers() {
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

        // 检查同名目录是否已存在，如果存在则添加时间戳
        let finalRepoName = reposDirBasename
        if (fs.existsSync(path.join(parentDir, finalRepoName))) {
          const timestamp = Date.now().toString().slice(-6)
          finalRepoName = `${finalRepoName}-${timestamp}`

          progressCallback({
            status: 'info',
            message: `目标目录已存在，将使用新名称: ${finalRepoName}`
          })
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
