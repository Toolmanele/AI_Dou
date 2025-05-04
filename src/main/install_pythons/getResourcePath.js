import path from 'path'
import { app } from 'electron'
import { is } from '@electron-toolkit/utils'
// 获取资源路径，兼容开发环境和打包环境
function getResourcePath(relativePath) {
  // 如果是开发环境
  if (is.dev) {
    // 从 /electron/utils/ 返回项目根目录，然后添加 relativePath
    console.log('路径', path.resolve(__dirname, '../../', relativePath))
    return path.resolve(__dirname, '../../', relativePath)
  }

  // 如果是打包环境
  // process.resourcesPath 在打包后的应用中指向resources目录
  if (process.resourcesPath) {
    return path.join(process.resourcesPath, relativePath)
  }

  // 兼容不使用asar打包的情况
  const appPath = app ? app.getAppPath() : __dirname
  return path.join(appPath, relativePath)
}
export { getResourcePath }
