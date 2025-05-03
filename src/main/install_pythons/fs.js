import fs from 'fs'
import path from 'path'
// 复制目录的辅助函数 - 跨平台实现
function copyDir(source, destination, progressCallback) {
  if (progressCallback) {
    progressCallback({
      status: 'info',
      message: `复制目录: ${source} 到 ${destination}`
    })
  }

  try {
    // 确保目标目录存在
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true })
    }

    // 读取源目录内容
    const entries = fs.readdirSync(source, { withFileTypes: true })

    // 复制每个文件和子目录
    entries.forEach((entry) => {
      const sourcePath = path.join(source, entry.name)
      const destPath = path.join(destination, entry.name)

      if (entry.isDirectory()) {
        // 递归复制子目录
        copyDir(sourcePath, destPath, progressCallback)
      } else {
        // 复制文件
        fs.copyFileSync(sourcePath, destPath)
      }
    })

    if (progressCallback) {
      progressCallback({
        status: 'info',
        message: `目录复制完成: ${source} 到 ${destination}`
      })
    }

    return true
  } catch (error) {
    if (progressCallback) {
      progressCallback({
        status: 'error',
        message: `复制目录失败: ${error.message}`
      })
    }
    throw error
  }
}

export { copyDir }
