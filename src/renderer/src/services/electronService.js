// 使用 preload.js 暴露的 API
const electronAPI = window.electronAPI;

/**
 * 测试一组 URL 中响应最快的
 * @param {Array<string>} urls - 要测试的 URL 数组
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<{url: string, latency: number, error: string}>} - 最快响应的 URL 和延迟
 */
async function findFastestUrl(urls, timeout = 5000) {
  try {
    return await electronAPI.findFastestUrl(urls, timeout);
  } catch (error) {
    console.error("Error finding fastest URL:", error);
    return { error: error.message, url: null, latency: -1 };
  }
}

export default {
  findFastestUrl,
};
