import https from 'https'
import http from 'http'
/**
 * 简化版竞速模式下载测试 - 同时测试多个URL，返回最快响应的URL
 * @param {Array<string>} urls - 要测试的URL数组，格式为完整URL（包含http/https前缀）
 * @param {number} timeout - 总体超时时间(毫秒)，默认5000ms
 * @returns {Promise<{url: string, latency: number, error: string}>} - 最快响应的URL和延迟
 */
function findFastestUrl(urls, timeout = 5000) {
  return new Promise((resolve) => {
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      resolve({ error: '没有提供有效的URL数组', url: null, latency: -1 })
      return
    }

    let fastestResolved = false
    let pendingRequests = urls.length
    let fastestResult = null

    // 处理超时情况
    const overallTimeout = setTimeout(() => {
      if (!fastestResolved) {
        resolve({ error: '所有URL请求超时', url: null, latency: -1 })
      }
    }, timeout)

    // 处理单个URL的响应
    const testUrl = (url) => {
      // 确保URL有协议前缀
      let testUrl = url
      let protocol = ''

      if (url.startsWith('https://')) {
        protocol = 'https'
      } else if (url.startsWith('http://')) {
        protocol = 'http'
      } else {
        // 默认使用HTTP
        testUrl = `http://${url}`
        protocol = 'http'
      }

      const startTime = Date.now()
      const requestModule = protocol === 'https' ? https : http

      const req = requestModule.get(testUrl, { timeout: timeout / 2 }, (res) => {
        const latency = Date.now() - startTime

        // 如果状态码表示成功
        if (res.statusCode >= 200 && res.statusCode < 400) {
          // 消费响应数据，避免内存泄漏
          res.resume()

          // 如果这是第一个成功的响应，或者比之前的更快
          if (!fastestResult || latency < fastestResult.latency) {
            fastestResult = {
              url: testUrl,
              latency,
              statusCode: res.statusCode,
              protocol
            }

            // 如果这是第一个成功的响应
            if (!fastestResolved) {
              fastestResolved = true
              clearTimeout(overallTimeout)
              resolve(fastestResult)
            }
          }
        }

        // 检查是否所有请求都完成了
        pendingRequests--
        if (pendingRequests <= 0 && !fastestResolved) {
          resolve({ error: '没有成功的响应', url: null, latency: -1 })
        }
      })

      req.on('error', () => {
        pendingRequests--
        if (pendingRequests <= 0 && !fastestResolved) {
          resolve({ error: '所有URL请求失败', url: null, latency: -1 })
        }
      })

      req.on('timeout', () => {
        req.destroy()
        pendingRequests--
        if (pendingRequests <= 0 && !fastestResolved) {
          resolve({ error: '所有URL请求超时', url: null, latency: -1 })
        }
      })
    }

    // 并行测试所有URL
    for (const url of urls) {
      testUrl(url)
    }
  })
}

export { findFastestUrl }

// 使用示例
/*
// 使用 await 方式调用简化版函数
async function testFastestUrl() {
  try {
    const urls = [
      "https://www.example.com",
      "https://www.google.com",
      "https://www.github.com"
    ];
    
    const result = await findFastestUrl(urls);
    console.log("最快的URL:", result.url);
    console.log("延迟时间:", result.latency, "ms");
    
    return result;
  } catch (error) {
    console.error("测试出错:", error);
    return null;
  }
}

// 调用示例
// testFastestUrl().then(result => console.log("完成测试:", result));
*/
