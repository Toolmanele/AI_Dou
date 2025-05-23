import { getAppUserDataPath, getSettingsData } from '../utils/check'
import path from 'path'
import fsp from 'fs/promises'
import fs from 'fs'
import { checkUniqueDir, ensureDir } from '../utils/fs'
import { is } from '@electron-toolkit/utils'
import { getAppSpaceFromSettings } from '../utils/config'
import { findFastestUrl } from '../url/findFastestUrl'
import git from '../utils/git'
import { installPython, consoleProgressCallback } from '../install_pythons/install_python'
import { formatCommands, getFinalPipMirrorUrl, getFinalPytorchMirrorUrl } from '../utils/pippytorch'
let appsData = null
let appDataPath = getAppUserDataPath()
// 这里放置的是单个 app 的信息
let appsInfoPath = path.join(appDataPath, 'apps')
export async function getAppsData() {
  if (!appsData) {
    appsData = []
    try {
      await ensureDir(appsInfoPath)
      const appsInfoJson = await fsp.readdir(appsInfoPath)

      for (const app of appsInfoJson) {
        try {
          const filePath = path.join(appsInfoPath, app)
          const fileContent = await fsp.readFile(filePath, 'utf-8')
          try {
            const appInfo = JSON.parse(fileContent)
            appsData.push(appInfo)
          } catch (jsonError) {
            console.error(`Error parsing JSON for app ${app}:`, jsonError)
            // 继续处理下一个文件
          }
        } catch (fileError) {
          console.error(`Error reading file ${app}:`, fileError)
          // 继续处理下一个文件
        }
      }
    } catch (dirError) {
      console.error('Error reading apps directory:', dirError)
      // 返回空数组，而不是中断执行
    }
  }
  return appsData
}

export async function checkAppName(appName) {
  const appsData = await getAppsData()
  return appsData.some((app) => app.name === appName)
}

export async function createApp(event, app) {
  try {
    const result = {
      success: false,
      error: null,
      github: { installed: false, repoPath: null },
      pythonEnvironments: []
    }

    // 从settings.json获取appSpace路径
    const settings = await getSettingsData()
    if (!settings || !settings.appSpace) {
      return {
        success: false,
        error: '未配置AppSpace目录。请在设置中配置AppSpace目录后再安装应用。',
        needConfig: true
      }
    }

    const appSpace = settings.appSpace
    await ensureDir(appSpace)
    // 检查GitHub仓库是否处于下载/安装状态
    const githubRepos = app.github?.repos || []
    if (githubRepos.length > 0) {
      // 确保repos目录存在
      // const reposDir = await checkUniqueDir(path.join(appSpace, 'apps'), app.name)
      // 这里传入的 app.folderPath 不是完整版的，需要拼接,只能是一个文件夹的名称
      // const reposDir = path.join(appSpace, 'apps', app.folderPath)
      // if (!fs.existsSync(reposDir)) {
      //   fs.mkdirSync(reposDir, { recursive: true })
      // }
      // console.log('reposDir', reposDir)
      let fastestMirrorUrlResult = await findFastestUrl(githubRepos)
      console.log('fastestMirrorUrlResult', fastestMirrorUrlResult)
      let fastestMirrorUrl = fastestMirrorUrlResult.url

      const progressCallback = (update) => {
        // 发送到渲染进程
        console.log('update', update)
        event.sender.send('install-progress', update)
      }

      progressCallback({
        status: 'info',
        message: `开始下载仓库: ${fastestMirrorUrl}`
      })
      const reposDirBasename = path.join(appSpace, 'apps')
      const reposDir = await checkUniqueDir(reposDirBasename, app.name)
      // 使用 reposDir 的 basename 作为仓库名称
      // 获取 reposDir 的父目录，作为 git clone 的目标目录

      const finalRepoName = path.basename(reposDir)

      const cloneResult = await git.clone(reposDirBasename, fastestMirrorUrl, finalRepoName, {
        mirror: fastestMirrorUrl,
        depth: 1,
        progressCallback
      })

      if (cloneResult.success) {
        result.github.installed = true
        result.github.repoPath = cloneResult.repoPath
        console.log('cloneResult.repoPath', cloneResult.repoPath)
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
          console.log('update', update)
          event.sender.send('install-progress', {
            ...update,
            pythonVersion: env.pythonVersion
          })
        }

        progressCallback({
          status: 'info',
          message: `开始安装Python ${env.pythonVersion}环境`
        })

        // 处理pip和pytorch 镜像 和 命令
        // let pipMirrorUrl = getFinalPipMirrorUrl(env.pip?.source)
        // let pytorchMirrorUrl = getFinalPytorchMirrorUrl(env.pytorch?.source)
        let pipCommands = []
        let pytorchCommands = []

        if (env.pip?.installCommands) {
          pipCommands = await formatCommands(env.pip.installCommands, 'pip', env.pip?.source)
        }

        if (env.pytorch?.installCommands) {
          pytorchCommands = await formatCommands(
            env.pytorch.installCommands,
            'pytorch',
            env.pytorch?.source
          )
        }
        progressCallback({
          status: 'info',
          message: `pipCommands: ${JSON.stringify(pipCommands)}`
        })
        progressCallback({
          status: 'info',
          message: `pytorchCommands: ${JSON.stringify(pytorchCommands)}`
        })
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
            message: `Python ${env.pythonVersion}环境安装失败: ${installResult.error || '未知错误'}`
          })
          // 虽然一个环境安装失败，但继续安装其他环境
        }
      }
    }
    // 如果至少一个Python环境安装成功，则将app标记为成功安装
    const hasSuccessfulEnv = result.pythonEnvironments.some((env) => env.isInstalled)
    // 创建app目录

    const appName = app.name
    const appInfoPath = path.join(appDataPath, appName + '.json')
    if (is.dev) {
      await fsp.writeFile(appInfoPath, JSON.stringify(app, null, 2))
    } else {
      await fsp.writeFile(appInfoPath, JSON.stringify(app))
    }

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
}
