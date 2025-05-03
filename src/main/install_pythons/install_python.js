/**
 * Setup script for executing real commands
 * This script will:
 * 1. Print an initialization message with a delay
 * 2. Extract the Python package
 * 3. 安装 pip (离线优先，失败则在线安装)
 * This module exports functions to be used by the Electron main process
 */

import { exec } from 'child_process'
import { getResourcePath } from './getResourcePath'
import { copyDir } from './fs'
import AdmZip from 'adm-zip'
import fs from 'fs'
import path from 'path'
import { runCommand } from './runCommand'
// Main setup function that accepts a progress callback
async function installPython(
  version,
  extractDir,
  progressCallback,
  pipCommands = [],
  pytorchCommands = [],
  workingDir = ''
) {
  try {
    // Get the absolute path to the windows_installbag directory
    const installBagPath = getResourcePath('python_envs')
    let files = fs.readdirSync(installBagPath)
    let matched = null
    for (let i = 0; i < files.length; i++) {
      if (files[i].indexOf(version) !== -1) {
        matched = files[i]
        break
      }
    }
    console.log('matched', matched)
    if (!matched) return
    const pythonZipPath = path.join(installBagPath, matched)
    const getPipPath = path.join(installBagPath, 'get-pip.py')

    const offlinePipPath = path.join(installBagPath, 'offline_pip_bootstrap')

    // let userDataPath;
    // if (process.env.NODE_ENV === "development") {
    //   // 使用本目录
    //   userDataPath = path.join(__dirname, "extracted");
    // } else {
    //   // 使用用户可写入的目录
    //   userDataPath = app
    //     ? app.getPath("userData")
    //     : path.join(__dirname, "extracted");
    // }
    // const extractDir = path.join(userDataPath, "extracted");

    // Create extraction directory if it doesn't exist
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true })
      if (progressCallback)
        progressCallback({
          status: 'info',
          message: `创建环境目录: ${extractDir}`
        })
    }

    // Track overall progress
    let overallProgress = 0
    if (progressCallback)
      progressCallback({
        status: 'progress',
        progress: overallProgress,
        message: '开始安装...'
      })

    // Step 1: Print initialization message
    if (progressCallback)
      progressCallback({
        status: 'info',
        message: '开始系统初始化...',
        step: 1,
        totalSteps: 3 // 现在有3个步骤
      })
    // await wait(500, progressCallback); // Wait for 0.5 seconds

    overallProgress = 10
    if (progressCallback)
      progressCallback({
        status: 'progress',
        progress: overallProgress,
        message: '初始化完成'
      })

    // Step 2: Extract Python package
    if (progressCallback)
      progressCallback({
        status: 'info',
        message: '提取Python包...',
        step: 2,
        totalSteps: 3
      })

    let pythonName = `python_${version}_${new Date().getTime()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`
    const pythonExtractDir = path.join(extractDir, pythonName)
    if (!fs.existsSync(pythonExtractDir)) {
      fs.mkdirSync(pythonExtractDir, { recursive: true })
      if (progressCallback)
        progressCallback({
          status: 'info',
          message: `创建Python安装目录: ${pythonExtractDir}`
        })
    }

    // 使用adm-zip解压文件而不是PowerShell
    try {
      if (progressCallback)
        progressCallback({
          status: 'info',
          message: `正在解压Python包: ${pythonZipPath}`
        })

      const zip = new AdmZip(pythonZipPath)
      zip.extractAllTo(pythonExtractDir, true)

      if (progressCallback)
        progressCallback({
          status: 'info',
          message: `Python包解压完成`
        })
    } catch (error) {
      if (progressCallback)
        progressCallback({
          status: 'error',
          message: `解压Python包失败: ${error.message}`
        })
      throw error
    }

    overallProgress = 40
    if (progressCallback)
      progressCallback({
        status: 'progress',
        progress: overallProgress,
        message: 'Python包提取成功'
      })

    // Step 3: 安装 pip
    if (progressCallback)
      progressCallback({
        status: 'info',
        message: '准备安装 pip...',
        step: 3,
        totalSteps: 3
      })

    // 检查python.exe和get-pip.py
    const pythonExePath = path.join(pythonExtractDir, 'python.exe')
    if (!fs.existsSync(pythonExePath)) {
      throw new Error(`未找到Python可执行文件: ${pythonExePath}`)
    }

    if (!fs.existsSync(getPipPath)) {
      throw new Error(`未找到get-pip.py: ${getPipPath}`)
    }

    // 使用fs模块拷贝get-pip.py到Python目录，而不是PowerShell
    try {
      if (progressCallback)
        progressCallback({
          status: 'info',
          message: `正在复制get-pip.py到Python目录`
        })

      fs.copyFileSync(getPipPath, path.join(pythonExtractDir, 'get-pip.py'))

      if (progressCallback)
        progressCallback({
          status: 'info',
          message: `get-pip.py复制完成`
        })
    } catch (error) {
      if (progressCallback)
        progressCallback({
          status: 'error',
          message: `复制get-pip.py失败: ${error.message}`
        })
      throw error
    }

    // 修改python311._pth文件，取消import site的注释
    // 3.11 -> 311
    let version_ = version.replace('.', '')
    let pthPath = `python${version_}._pth`
    const pthFilePath = path.join(pythonExtractDir, pthPath)
    if (fs.existsSync(pthFilePath)) {
      try {
        let pthContent = fs.readFileSync(pthFilePath, 'utf8')
        if (pthContent.includes('#import site')) {
          pthContent = pthContent.replace('#import site', 'import site')
          fs.writeFileSync(pthFilePath, pthContent, 'utf8')
          if (progressCallback)
            progressCallback({
              status: 'info',
              message: `已修改${pthPath}文件,启用import site`
            })
        } else if (pthContent.includes('import site')) {
          if (progressCallback)
            progressCallback({
              status: 'info',
              message: `${pthPath}文件已经包含import site，无需修改`
            })
        } else {
          pthContent += '\nimport site'
          fs.writeFileSync(pthFilePath, pthContent, 'utf8')
          if (progressCallback)
            progressCallback({
              status: 'info',
              message: `已修改${pthPath}文件，添加import site`
            })
        }
      } catch (error) {
        if (progressCallback)
          progressCallback({
            status: 'warning',
            message: `修改${pthPath}文件失败: ${error.message}`
          })
      }
    } else {
      if (progressCallback)
        progressCallback({
          status: 'warning',
          message: `未找到${pthPath}文件: ${pthFilePath}`
        })
    }

    // 尝试离线安装pip
    let pipInstalled = false

    if (fs.existsSync(offlinePipPath)) {
      if (progressCallback)
        progressCallback({
          status: 'info',
          message: `找到离线pip安装包: ${offlinePipPath}`
        })

      // 创建pip离线安装目录
      const pipOfflineDir = path.join(pythonExtractDir, 'pip_packages')
      if (!fs.existsSync(pipOfflineDir)) {
        fs.mkdirSync(pipOfflineDir, { recursive: true })
      }

      try {
        // 使用fs模块复制离线pip包到Python目录，而不是PowerShell
        if (progressCallback)
          progressCallback({
            status: 'info',
            message: '正在复制离线pip包...'
          })

        copyDir(offlinePipPath, pipOfflineDir, progressCallback)

        if (progressCallback)
          progressCallback({
            status: 'info',
            message: '离线pip包复制完成'
          })

        if (progressCallback)
          progressCallback({
            status: 'info',
            message: '开始离线安装pip...'
          })

        // 检查Python可执行文件是否存在
        if (!fs.existsSync(pythonExePath)) {
          throw new Error(`Python可执行文件不存在: ${pythonExePath}`)
        }

        // 检查pip_packages目录是否存在
        const pipPackagesDir = path.join(pythonExtractDir, 'pip_packages')
        if (!fs.existsSync(pipPackagesDir)) {
          throw new Error(`pip_packages目录不存在: ${pipPackagesDir}`)
        }

        // 检查get-pip.py是否存在于Python目录
        const getPipInPythonDir = path.join(pythonExtractDir, 'get-pip.py')
        if (!fs.existsSync(getPipInPythonDir)) {
          throw new Error(`get-pip.py不存在于Python目录: ${getPipInPythonDir}`)
        }

        // 执行离线安装，使用完整路径以防止路径问题
        try {
          if (progressCallback)
            progressCallback({
              status: 'info',
              message: `开始执行pip离线安装命令，工作目录: ${pythonExtractDir}`
            })

          const command = `"${pythonExePath}" "${getPipInPythonDir}" --no-index --find-links="${pipPackagesDir}" --no-warn-script-location`

          if (progressCallback)
            progressCallback({
              status: 'info',
              message: `执行命令: ${command}`
            })

          await runCommand(command, progressCallback)
          pipInstalled = true

          if (progressCallback)
            progressCallback({
              status: 'info',
              message: 'pip离线安装成功'
            })
        } catch (error) {
          if (progressCallback)
            progressCallback({
              status: 'warning',
              message: `pip离线安装失败: ${error.message}，将尝试在线安装`
            })
        }
      } catch (error) {
        if (progressCallback)
          progressCallback({
            status: 'warning',
            message: `复制离线pip包失败: ${error.message}，将尝试在线安装`
          })
      }
    } else {
      if (progressCallback)
        progressCallback({
          status: 'warning',
          message: `未找到离线pip安装包: ${offlinePipPath}，将尝试在线安装`
        })
    }

    // 如果离线安装失败，尝试在线安装
    if (!pipInstalled) {
      if (progressCallback)
        progressCallback({
          status: 'info',
          message: '尝试在线安装pip...'
        })

      try {
        // 确保Python可执行文件和get-pip.py存在
        if (!fs.existsSync(pythonExePath)) {
          throw new Error(`Python可执行文件不存在: ${pythonExePath}`)
        }

        const getPipInPythonDir = path.join(pythonExtractDir, 'get-pip.py')
        if (!fs.existsSync(getPipInPythonDir)) {
          throw new Error(`get-pip.py不存在于Python目录: ${getPipInPythonDir}`)
        }

        if (progressCallback)
          progressCallback({
            status: 'info',
            message: `开始执行pip在线安装命令，使用Python: ${pythonExePath}`
          })

        const command = `"${pythonExePath}" "${getPipInPythonDir}" --no-warn-script-location`

        if (progressCallback)
          progressCallback({
            status: 'info',
            message: `执行命令: ${command}`
          })

        await runCommand(command, progressCallback)
        pipInstalled = true

        if (progressCallback)
          progressCallback({
            status: 'info',
            message: 'pip在线安装成功'
          })
      } catch (error) {
        if (progressCallback)
          progressCallback({
            status: 'error',
            message: `pip在线安装也失败: ${error.message}`
          })
      }
    }

    // 检查pip是否安装成功
    let pipVersion = ''
    try {
      // 通过执行命令并捕获输出来获取版本信息
      const result = await new Promise((resolve, reject) => {
        // 使用绝对路径
        const command = `"${pythonExePath}" -m pip --version`

        if (progressCallback)
          progressCallback({
            status: 'info',
            message: `执行命令检查pip版本: ${command}`
          })

        exec(command, (error, stdout, stderr) => {
          if (error) {
            if (progressCallback)
              progressCallback({
                status: 'warning',
                message: `检查pip版本时出错: ${error.message}`
              })
            reject(error)
            return
          }

          if (stderr && stderr.trim()) {
            if (progressCallback)
              progressCallback({
                status: 'warning',
                message: `检查pip版本时有警告: ${stderr.trim()}`
              })
          }

          resolve(stdout.toString().trim())
        })
      })

      pipVersion = result

      if (pipVersion && pipVersion.includes('pip')) {
        if (progressCallback)
          progressCallback({
            status: 'info',
            message: `pip安装成功，版本信息: ${pipVersion}`
          })

        // 找到site-packages目录并创建myproject.pth文件
        try {
          // 获取site-packages目录
          const findSitePackagesCmd = `"${pythonExePath}" -c "import site; print(site.getsitepackages()[0])"`

          if (progressCallback)
            progressCallback({
              status: 'info',
              message: `查找site-packages目录: ${findSitePackagesCmd}`
            })

          const sitePackagesPath = await new Promise((resolve, reject) => {
            exec(findSitePackagesCmd, (error, stdout, stderr) => {
              if (error) {
                reject(error)
                return
              }
              resolve(stdout.toString().trim())
            })
          })

          if (progressCallback)
            progressCallback({
              status: 'info',
              message: `找到site-packages目录: ${sitePackagesPath}`
            })

          // 创建myproject.pth文件
          const pthFilePath = path.join(sitePackagesPath, 'myproject.pth')

          // 使用应用目录作为路径
          let appDir = workingDir || process.cwd()

          if (progressCallback)
            progressCallback({
              status: 'info',
              message: `将应用目录写入.pth文件: ${appDir}`
            })

          // 写入.pth文件
          fs.writeFileSync(pthFilePath, appDir, 'utf8')

          if (progressCallback)
            progressCallback({
              status: 'info',
              message: `成功创建myproject.pth文件: ${pthFilePath}`
            })
        } catch (error) {
          if (progressCallback)
            progressCallback({
              status: 'warning',
              message: `创建myproject.pth文件失败: ${error.message}`
            })
        }
      } else {
        if (progressCallback)
          progressCallback({
            status: 'warning',
            message: '未能获取pip版本信息，安装可能不完整'
          })
      }
    } catch (error) {
      if (progressCallback)
        progressCallback({
          status: 'warning',
          message: `检查pip版本失败: ${error.message}`
        })
    }

    if (progressCallback)
      progressCallback({
        status: 'progress',
        progress: overallProgress,
        message: 'Python和pip安装完成!'
      })

    // 执行pytorch命令
    if (pytorchCommands && pytorchCommands.length > 0) {
      if (progressCallback)
        progressCallback({
          status: 'info',
          message: '开始执行PyTorch安装命令...'
        })

      for (let i = 0; i < pytorchCommands.length; i++) {
        const command = pytorchCommands[i]
        if (progressCallback)
          progressCallback({
            status: 'info',
            message: `执行PyTorch命令 (${i + 1}/${pytorchCommands.length}): ${command}`
          })

        try {
          // 使用Python的pip模块执行命令，并指定安装目录
          const pipCommand = `"${pythonExePath}" -m ${command} --no-warn-script-location`
          if (progressCallback) {
            progressCallback({
              status: 'info',
              message: `开始执行PyTorch安装命令: ${pipCommand}`
            })
          }
          await runCommand(pipCommand, progressCallback)

          if (progressCallback) {
            progressCallback({
              status: 'info',
              message: `PyTorch命令执行成功: ${command}`
            })
          }
        } catch (error) {
          if (progressCallback) {
            progressCallback({
              status: 'warning',
              message: `PyTorch命令执行失败: ${command}, 错误: ${error.message}`
            })
          }

          // 尝试使用备用命令
          try {
            if (progressCallback) {
              progressCallback({
                status: 'info',
                message: `尝试使用备用命令安装PyTorch...`
              })
            }

            // 使用更简单的命令，不指定CUDA版本
            const fallbackCommand = `"${pythonExePath}" -m pip install torch torchvision torchaudio`
            if (progressCallback) {
              progressCallback({
                status: 'info',
                message: `开始执行备用PyTorch安装命令: ${fallbackCommand}`
              })
            }
            await runCommand(fallbackCommand, progressCallback)

            if (progressCallback) {
              progressCallback({
                status: 'info',
                message: `PyTorch备用命令执行成功`
              })
            }
          } catch (fallbackError) {
            if (progressCallback) {
              progressCallback({
                status: 'error',
                message: `PyTorch备用命令也失败: ${fallbackError.message}`
              })
            }
          }
        }
      }
    }

    // 执行pip命令
    if (pipCommands && pipCommands.length > 0) {
      if (progressCallback)
        progressCallback({
          status: 'info',
          message: '开始执行pip安装命令...'
        })

      for (let i = 0; i < pipCommands.length; i++) {
        const command = pipCommands[i]
        if (progressCallback)
          progressCallback({
            status: 'info',
            message: `执行pip命令 (${i + 1}/${pipCommands.length}): ${command}`
          })

        try {
          // 使用Python的pip模块执行命令，并指定安装目录
          let pipCommand
          if (command.includes('requirements.txt')) {
            // 检查requirements.txt文件是否存在
            const requirementsPath = path.join(workingDir, 'requirements.txt')
            console.log('requirementsPath:', requirementsPath)
            if (!fs.existsSync(requirementsPath)) {
              if (progressCallback) {
                progressCallback({
                  status: 'error',
                  message: `requirements.txt 文件不存在: ${requirementsPath}`
                })
              }
              throw new Error(`requirements.txt 文件不存在: ${requirementsPath}`)
            }

            // 如果命令包含 requirements.txt，使用工作目录中的文件
            pipCommand = command.replace('requirements.txt', `"${requirementsPath}"`)
            pipCommand = `"${pythonExePath}" -m ${pipCommand} --no-warn-script-location`
            if (progressCallback) {
              progressCallback({
                status: 'info',
                message: `使用 requirements.txt: ${requirementsPath}`
              })
            }
          } else {
            pipCommand = `"${pythonExePath}" -m pip ${command} --no-warn-script-location`
          }
          await runCommand(pipCommand, progressCallback)

          if (progressCallback)
            progressCallback({
              status: 'info',
              message: `pip命令执行成功: ${command}`
            })
        } catch (error) {
          if (progressCallback)
            progressCallback({
              status: 'warning',
              message: `pip命令执行失败: ${command}, 错误: ${error.message}`
            })
        }
      }
    }

    if (progressCallback) {
      overallProgress = 100
      progressCallback({
        status: 'progress',
        progress: 100,
        message: '所有命令已成功完成!'
      })
    }

    return {
      success: true,
      message: '安装程序已完成',
      pythonPath: pythonExePath,
      pipInstalled: pipInstalled,
      pipVersion: pipVersion
    }
  } catch (error) {
    console.error('Setup failed:', error)
    if (progressCallback)
      progressCallback({
        status: 'error',
        message: `安装失败: ${error.message}`
      })
    return { success: false, error: error.message }
  }
}
const consoleProgressCallback = (update) => {
  if (update.status === 'progress') {
    console.log(`进度: ${update.progress}% - ${update.message}`)
  } else if (update.status === 'error') {
    console.error(`错误: ${update.message}`)
  } else if (update.status === 'warning') {
    console.warn(`警告: ${update.message}`)
  } else if (update.status === 'info') {
    console.info(`信息: ${update.message}`)
  } else if (update.status === 'stdout') {
    // Already logged to console in runCommand
  } else if (update.status === 'stderr') {
    // Already logged to console in runCommand
  }
}
// Export the functions to be used by the Electron main process
export { installPython, consoleProgressCallback }
