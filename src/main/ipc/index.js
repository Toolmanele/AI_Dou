// IPC 处理程序集合模块
import setupWindowHandlers from './window-handlers'
import setupFileHandlers from './file-handlers'
import setupSeedHandlers from './seed-handlers'
import { setupPythonHandlers, setupAppHandlers } from './python-handlers'
import setupSystemHandlers from './system-handlers'
import setupFastUrlHandlers from './fast-url'
console.log('setupFastUrlHandlers', setupFastUrlHandlers)
// 设置 IPC 处理程序
function setupIPC() {
  // 初始化所有 IPC 处理程序
  setupWindowHandlers()
  setupFileHandlers()
  setupSeedHandlers()
  setupPythonHandlers()
  setupSystemHandlers()
  setupFastUrlHandlers()
  setupAppHandlers()
  console.log('所有 IPC 处理程序已初始化')
}

export default setupIPC
