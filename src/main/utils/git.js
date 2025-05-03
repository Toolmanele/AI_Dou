import { GitError, GitProcess, Git } from 'dugite'
import { setupEnvironment } from 'dugite/build/lib/git-environment'
import { checkFileExists } from './fs.js'
import path from 'path'
import { spawn } from 'child_process'

const git = {
  /**
   * Clone a git repository
   * @param {string} workdir - The working directory where to clone
   * @param {string} url - The repository URL
   * @param {string} name - The name for the cloned directory (optional)
   * @param {object} options - Additional options like mirror URL, branch, etc.
   * @returns {Promise<object>} Result of the git operation
   */
  async clone(workdir, url, name, options = {}) {
    if (!name) {
      name = url
        .split('/')
        .pop()
        .replace(/\.git$/, '')
    }

    if (await checkFileExists(path.join(workdir, name))) {
      name = `${name}-${Date.now()}`
    }

    // Allow using a mirror URL if the main URL fails
    const actualUrl = options.mirror && options.preferMirror ? options.mirror : url

    // Build the clone command arguments
    const args = ['clone']

    // Add clone options
    if (options.depth) {
      args.push('--depth', options.depth.toString())
    }

    if (options.branch) {
      args.push('--branch', options.branch)
    }

    // Add progress flag for real-time updates
    args.push('--progress')

    args.push(actualUrl, name)

    // Use spawn instead of GitProcess.exec to capture real-time output
    if (options.progressCallback) {
      return new Promise((resolve) => {
        const gitPath = setupEnvironment({}).gitLocation
        const cloneProcess = spawn(gitPath, args, { cwd: workdir })

        let stderr = ''
        let stdout = ''

        cloneProcess.stdout.on('data', (data) => {
          const message = data.toString()
          stdout += message
          options.progressCallback({
            status: 'info',
            message: message.trim()
          })
        })

        cloneProcess.stderr.on('data', (data) => {
          const message = data.toString()
          stderr += message
          // Git sends progress information to stderr
          options.progressCallback({
            status: 'progress',
            message: message.trim()
          })
        })

        cloneProcess.on('close', (code) => {
          const success = code === 0
          const repoPath = path.join(workdir, name)

          if (success) {
            options.progressCallback({
              status: 'success',
              message: `仓库克隆成功: ${name}`
            })
          } else {
            options.progressCallback({
              status: 'error',
              message: `仓库克隆失败: ${stderr}`
            })

            // Try mirror if available and not already using it
            if (options.mirror && !options.preferMirror) {
              options.progressCallback({
                status: 'info',
                message: `尝试使用镜像: ${options.mirror}`
              })

              this.clone(workdir, options.mirror, name, {
                ...options,
                preferMirror: true
              }).then(resolve)
              return
            }
          }

          resolve({
            exitCode: code,
            stdout,
            stderr,
            repoPath,
            success
          })
        })
      })
    } else {
      // Fallback to original method if no progress callback provided
      const result = await GitProcess.exec(args, workdir)

      // If the main URL failed and a mirror URL is provided, try the mirror
      if (result.exitCode !== 0 && options.mirror && !options.preferMirror) {
        console.log(`Clone failed using primary URL, trying mirror: ${options.mirror}`)
        return this.clone(workdir, options.mirror, name, {
          ...options,
          preferMirror: true
        })
      }

      return {
        ...result,
        repoPath: path.join(workdir, name),
        success: result.exitCode === 0
      }
    }
  },

  /**
   * Update a git repository
   * @param {string} repoPath - Path to the repository
   * @param {object} options - Additional update options
   * @returns {Promise<object>} Result of the git operation
   */
  async update(repoPath, options = {}) {
    // Make sure we're in the repository root
    let args = []

    if (options.branch) {
      // Fetch the specific branch
      args = ['fetch', 'origin', options.branch]
      const fetchResult = await GitProcess.exec(args, repoPath)

      if (fetchResult.exitCode !== 0) {
        return {
          ...fetchResult,
          success: false
        }
      }

      // Checkout and reset to the fetched branch
      args = ['checkout', options.branch]
      const checkoutResult = await GitProcess.exec(args, repoPath)

      if (checkoutResult.exitCode !== 0) {
        return {
          ...checkoutResult,
          success: false
        }
      }

      args = ['reset', '--hard', `origin/${options.branch}`]
      const resetResult = await GitProcess.exec(args, repoPath)

      return {
        ...resetResult,
        success: resetResult.exitCode === 0
      }
    } else {
      // Simply pull the current branch
      args = ['pull']
      const result = await GitProcess.exec(args, repoPath)

      return {
        ...result,
        success: result.exitCode === 0
      }
    }
  },

  /**
   * Get the git executable path
   * @returns {string} Path to git executable
   */
  getGitPath: () => {
    return setupEnvironment({}).gitLocation
  },

  /**
   * Get a repository from a seed configuration
   * @param {string} workdir - Working directory for the repository
   * @param {object} seed - Seed configuration object
   * @returns {Promise<object>} Result object with repository info
   */
  async getSeed(workdir, seed) {
    const repoName =
      seed.name ||
      seed.github
        .split('/')
        .pop()
        .replace(/\.git$/, '')
    const repoPath = path.join(workdir, repoName)
    const repoExists = await checkFileExists(repoPath)

    let result
    if (repoExists) {
      // Update existing repository
      console.log(`Updating existing repository: ${repoName}`)
      result = await this.update(repoPath, {
        branch: seed.branch
      })
    } else {
      // Clone new repository
      console.log(`Cloning new repository: ${repoName}`)
      result = await this.clone(workdir, seed.github, repoName, {
        mirror: seed.github_mirror,
        branch: seed.branch,
        depth: seed.depth || 1
      })
    }

    return {
      ...result,
      repoPath,
      repoName,
      seed
    }
  }
}

git.execPath = git.getGitPath()
export default git
