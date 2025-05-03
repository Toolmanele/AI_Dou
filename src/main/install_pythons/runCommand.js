import { exec } from 'child_process'

// Utility function to run a command and return a promise
// The progressCallback will be called with status updates
function runCommand(command, progressCallback) {
  return new Promise((resolve, reject) => {
    if (progressCallback) progressCallback({ status: 'info', message: `执行命令: ${command}` })

    // 增加缓冲区大小，避免大输出被截断
    const childProcess = exec(command, { maxBuffer: 1024 * 1024 * 10 })

    // 设置超时
    const timeout = setTimeout(
      () => {
        childProcess.kill()
        if (progressCallback) progressCallback({ status: 'error', message: '命令执行超时，已终止' })
        reject(new Error('命令执行超时'))
      },
      30 * 60 * 1000
    ) // 30分钟超时

    childProcess.stdout.on('data', (data) => {
      //   console.log(data.toString());
      if (progressCallback) progressCallback({ status: 'stdout', message: data.toString() })
    })

    childProcess.stderr.on('data', (data) => {
      //   console.error(data.toString());
      if (progressCallback) progressCallback({ status: 'stderr', message: data.toString() })
    })

    childProcess.on('close', (code) => {
      clearTimeout(timeout)
      if (code !== 0) {
        const errorMsg = `命令执行失败，退出代码 ${code}`
        // console.error(errorMsg);
        if (progressCallback) progressCallback({ status: 'error', message: errorMsg })
        reject(new Error(errorMsg))
        return
      }
      if (progressCallback) progressCallback({ status: 'completed', message: '命令执行成功' })
      resolve()
    })
  })
}
// Utility function to wait for a specific amount of time
function wait(ms, progressCallback) {
  if (progressCallback) progressCallback({ status: 'info', message: `等待 ${ms}ms...` })
  return new Promise((resolve) =>
    setTimeout(() => {
      if (progressCallback) progressCallback({ status: 'info', message: '等待完成' })
      resolve()
    }, ms)
  )
}

export { runCommand, wait }
