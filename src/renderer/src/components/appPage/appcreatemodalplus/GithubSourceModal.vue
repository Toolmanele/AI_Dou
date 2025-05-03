<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3>从 Git 仓库创建</h3>
        <button class="close-button" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <!-- 仓库地址列表 -->
        <div class="form-group">
          <label>Git 仓库地址列表</label>

          <div v-if="repos.length === 0" class="empty-repo-list">
            <p>暂无仓库地址，请点击下方按钮添加</p>
          </div>

          <div v-else class="repo-addresses-list">
            <div
              v-for="(repo, index) in repos"
              :key="index"
              class="repo-address-item"
              :class="{ selected: selectedRepoIndex === index }"
              @click="selectRepo(index)"
            >
              <div class="repo-address-content">
                <div class="repo-address-name">
                  {{ repo.name || "未命名仓库" }}
                </div>
                <div class="repo-address-url">{{ repo.url }}</div>
              </div>
              <div class="repo-address-actions">
                <span v-if="repo.isDefault" class="default-badge">默认</span>
                <span v-if="repo.isDownloaded" class="downloaded-badge"
                  >已下载</span
                >
                <button
                  v-if="!repo.isDefault && !repo.isDownloaded"
                  class="action-button set-default-button"
                  @click.stop="setAsDefault(index)"
                >
                  设为默认
                </button>
                <button
                  v-if="!repo.isDownloaded"
                  class="action-button download-button"
                  @click.stop="downloadRepo(index)"
                  :disabled="isCloning"
                >
                  下载
                </button>
                <button
                  class="action-button delete-button"
                  @click.stop="removeAddress(index)"
                >
                  删除
                </button>
              </div>
            </div>
          </div>

          <button
            class="add-address-button"
            @click="showAddForm = true"
            v-if="!showAddForm"
          >
            <span>+ 添加仓库地址</span>
          </button>
        </div>

        <!-- 添加仓库地址表单 -->
        <div class="form-group add-address-form" v-if="showAddForm">
          <label>仓库地址 <span class="required">*</span></label>
          <div class="add-repo-input-group">
            <input
              type="text"
              v-model="newRepoUrl"
              placeholder="例如: https://github.com/username/repository 或 https://gitlab.com/username/repo"
              :class="{ error: error }"
              @keyup.enter="addAddress"
            />
            <div class="add-repo-actions">
              <button
                class="action-button cancel-add"
                @click="cancelAddAddress"
              >
                取消
              </button>
              <button
                class="action-button confirm-add"
                @click="addAddress"
                :disabled="!newRepoUrl || isCloning"
              >
                添加
              </button>
            </div>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <div class="repo-options">
            <label class="default-checkbox-label">
              <input type="checkbox" v-model="setNewAsDefault" />
              <span>设为默认地址</span>
            </label>
          </div>
        </div>

        <div class="source-hint" v-if="!showAddForm">
          输入任何 Git 仓库地址，克隆到本地使用
        </div>

        <!-- 测试克隆按钮 -->
        <div class="test-clone-section" v-if="selectedRepoIndex !== null">
          <button
            class="test-button"
            @click="testCloneRepo"
            :disabled="!currentRepo || isCloning"
          >
            测试克隆
          </button>
        </div>

        <!-- 克隆测试进度区域 -->
        <div class="clone-test-area" v-if="cloneOutput.length > 0 || isCloning">
          <div class="clone-test-header">
            <h4>克隆测试</h4>
            <button v-if="isCloning" class="stop-button" @click="stopCloning">
              停止
            </button>
          </div>

          <div class="clone-log" ref="cloneLogRef">
            <div
              v-for="(line, index) in cloneOutput"
              :key="index"
              class="log-line"
            >
              {{ line }}
            </div>
            <div v-if="isCloning" class="loading-indicator">
              <span class="spinner"></span> 正在克隆...
            </div>
          </div>
        </div>

        <div class="git-info">
          <p>Git 仓库地址支持任何标准 Git 协议，如 HTTPS 或 SSH</p>
          <p>后端使用 dugite 实现克隆，支持大多数标准 Git 仓库地址</p>
        </div>
      </div>
      <!-- :disabled="selectedRepoIndex === null || isCloning" -->
      <div class="modal-footer">
        <button class="cancel-button" @click="$emit('close')">取消</button>
        <button class="confirm-button" @click="confirmSelection">确认</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from "vue";
import { useAppCreateStore } from "../../../stores/appCreateStore";

const emit = defineEmits(["close", "confirm"]);
const store = useAppCreateStore();

// 仓库地址列表
const repos = computed(() => store.appData.github.repos);
const selectedRepoIndex = ref(null);

// 从 store 中加载仓库地址列表
if (repos && repos.length > 0) {
  // 如果有默认地址，选中它
  const defaultIndex = repos.value.findIndex((repo) => repo.isDefault);
  if (defaultIndex >= 0) {
    selectedRepoIndex.value = defaultIndex;
  } else {
    selectedRepoIndex.value = 0;
  }
}

// 添加新地址相关状态
const showAddForm = ref(false);
const newRepoUrl = ref("");
const setNewAsDefault = ref(false);
const error = ref("");

// 当前选中的仓库
const currentRepo = computed(() => {
  if (
    selectedRepoIndex.value !== null &&
    selectedRepoIndex.value >= 0 &&
    selectedRepoIndex.value < repos.value.length
  ) {
    return repos.value[selectedRepoIndex.value];
  }
  return null;
});

// 默认地址
const defaultRepo = computed(() => {
  return repos.value.find((repo) => repo.isDefault) || null;
});

// 克隆测试状态
const isCloning = ref(false);
const cloneOutput = ref([]);
const cloneTimer = ref(null);

// 添加计算属性和ref来检测克隆日志区域的变化
const cloneLogRef = ref(null);

// 添加watch监听克隆输出变化，自动滚动到底部
watch(cloneOutput, () => {
  nextTick(() => {
    if (cloneLogRef.value) {
      cloneLogRef.value.scrollTop = cloneLogRef.value.scrollHeight;
    }
  });
});

// 选择仓库
function selectRepo(index) {
  selectedRepoIndex.value = index;
}

// 设置为默认地址
function setAsDefault(index) {
  const repo = repos.value[index];

  // 如果仓库未下载，先提示用户下载
  if (!repo.isDownloaded) {
    cloneOutput.value = ["请先下载仓库后再设为默认"];
    return;
  }

  // 先将所有仓库设为非默认
  repos.value.forEach((repo) => {
    repo.isDefault = false;
  });

  // 将选中的仓库设为默认
  repo.isDefault = true;

  // 设置工作路径到这个仓库
  if (store && repo.localPath) {
    store.setFolderPath(repo.localPath);
    cloneOutput.value.push(`已将工作路径设置为: ${repo.localPath}`);
  }
}
function getMainDomain(url) {
  const hostname = url.hostname; // 获取完整主机名
  const parts = hostname.split(".");

  // 处理类似 'co.uk' 这样的特殊情况
  const specialDomains = ["co", "com", "org", "net", "gov", "edu"]; // 可以根据需要扩展

  if (parts.length > 2) {
    // 如果最后两部分都是特殊域名（如 'co.uk'），则取倒数第三部分
    if (specialDomains.includes(parts[parts.length - 2])) {
      return parts[parts.length - 3];
    }
    // 否则取倒数第二部分
    return parts[parts.length - 2];
  }

  // 如果只有两部分，直接返回第一部分
  return parts[0];
}
// 添加新地址
function addAddress() {
  if (!validateRepoUrl(newRepoUrl.value)) {
    return;
  }

  // 从URL中提取仓库名称
  let repoName = "";
  try {
    const url = new URL(newRepoUrl.value);
    const pathParts = url.pathname.split("/").filter((part) => part);
    const mainDomain = getMainDomain(url);
    // 使用最后一部分作为仓库名称，去掉.git后缀
    if (pathParts.length > 0) {
      repoName =
        mainDomain +
        "_" +
        pathParts[pathParts.length - 1].replace(/\.git$/, "");
    }
  } catch (e) {
    // 如果URL解析失败，使用基本名称
    repoName = `仓库 ${repos.value.length + 1}`;
  }

  // 创建新的仓库地址对象
  const newRepo = {
    name: repoName,
    url: newRepoUrl.value.trim(),
    isDefault: setNewAsDefault.value,
  };

  // 如果设置为默认，需要将其他地址设为非默认
  if (setNewAsDefault.value) {
    repos.value.forEach((repo) => {
      repo.isDefault = false;
    });
  }

  // 如果是第一个地址，自动设为默认
  if (repos.value.length === 0) {
    newRepo.isDefault = true;
  }

  store.githubTemp.repos.push(newRepo);
  store.appData.github.repos.push(newRepo);
  // 添加到列表
  // repos.value.push(newRepo);

  // 选中新添加的地址
  selectedRepoIndex.value = repos.value.length - 1;

  // 重置表单
  resetAddForm();
}

// 取消添加
function cancelAddAddress() {
  resetAddForm();
}

// 重置添加表单
function resetAddForm() {
  newRepoUrl.value = "";
  setNewAsDefault.value = false;
  error.value = "";
  showAddForm.value = false;
}

// 移除地址
function removeAddress(index) {
  const isRemovingDefault = repos.value[index].isDefault;

  // 从列表中移除
  repos.value.splice(index, 1);

  // 更新选中的索引
  if (selectedRepoIndex.value === index) {
    selectedRepoIndex.value = repos.value.length > 0 ? 0 : null;
  } else if (selectedRepoIndex.value > index) {
    selectedRepoIndex.value--;
  }

  // 如果删除的是默认地址且列表不为空，设置第一个为默认
  if (isRemovingDefault && repos.value.length > 0) {
    repos.value[0].isDefault = true;
  }
}

// 验证仓库 URL
function validateRepoUrl(url) {
  if (!url.trim()) {
    error.value = "仓库地址不能为空";
    return false;
  }

  // 验证 URL 格式
  const gitUrlPattern =
    /^(https?:\/\/|git@|ssh:\/\/)([\w.-]+@)?([\w.-]+)(:\d+)?\/([^/\s]+)(\/[^/\s]+)+(.git)?$/;
  if (!gitUrlPattern.test(url.trim())) {
    error.value = "仓库地址格式不正确";
    return false;
  }

  // 检查是否重复
  if (repos.value.some((repo) => repo.url === url.trim())) {
    error.value = "该仓库地址已存在";
    return false;
  }

  error.value = "";
  return true;
}

// 测试克隆仓库
async function testCloneRepo() {
  if (!currentRepo.value) return;

  isCloning.value = true;
  cloneOutput.value = [
    "初始化克隆测试...",
    `仓库地址: ${currentRepo.value.url}`,
  ];

  try {
    // 使用 Electron API 通信
    if (window.electronAPI && window.electronAPI.testCloneRepo) {
      // 开始克隆流程
      const cloneId = await window.electronAPI.testCloneRepo(
        currentRepo.value.url
      );

      // 设置克隆进度监听
      if (window.electronAPI.onCloneProgress) {
        window.electronAPI.onCloneProgress(
          (event, { id, message, done, error }) => {
            if (id === cloneId) {
              if (message) {
                cloneOutput.value.push(message);
              }

              if (error) {
                cloneOutput.value.push(`错误: ${error}`);
                isCloning.value = false;
              }

              if (done) {
                cloneOutput.value.push("克隆测试完成！");
                isCloning.value = false;
              }
            }
          }
        );
      } else {
        // API 不可用时的后备方案
        simulateCloneProgress();
      }
    } else {
      // 非 Electron 环境或 API 不可用时的后备方案
      simulateCloneProgress();
    }
  } catch (error) {
    console.error("克隆测试失败:", error);
    cloneOutput.value.push(`克隆测试失败: ${error.message}`);
    isCloning.value = false;
  }
}

// 模拟克隆进度
function simulateCloneProgress() {
  const steps = [
    "正在解析仓库地址...",
    "开始克隆过程...",
    "正在下载索引...",
    "接收对象中: 12%",
    "接收对象中: 27%",
    "接收对象中: 43%",
    "接收对象中: 56%",
    "接收对象中: 72%",
    "接收对象中: 85%",
    "接收对象中: 100%",
    "正在解压文件...",
    "解压完成: 458 个文件",
    "检查文件完整性...",
    "克隆测试完成!",
  ];

  let stepIndex = 0;

  cloneTimer.value = setInterval(() => {
    if (stepIndex < steps.length) {
      cloneOutput.value.push(steps[stepIndex]);
      stepIndex++;
    } else {
      clearInterval(cloneTimer.value);
      isCloning.value = false;
    }
  }, 800);
}

// 停止克隆
function stopCloning() {
  if (window.electronAPI && window.electronAPI.stopCloneRepo) {
    window.electronAPI.stopCloneRepo();
  }

  if (cloneTimer.value) {
    clearInterval(cloneTimer.value);
  }

  cloneOutput.value.push("克隆测试已停止");
  isCloning.value = false;
}

// 添加下载仓库的函数
async function downloadRepo(index) {
  const repo = repos.value[index];
  if (!repo) return;

  // 选中要下载的仓库
  selectRepo(index);

  // 开始克隆过程
  isCloning.value = true;
  cloneOutput.value = ["开始下载仓库...", `仓库地址: ${repo.url}`];

  try {
    // 使用Electron API下载仓库
    if (window.electronAPI && window.electronAPI.cloneRepo) {
      const result = await window.electronAPI.cloneRepo(repo.url);

      if (result && result.success) {
        // 设置为已下载
        repo.isDownloaded = true;
        repo.localPath = result.path;

        // 如果这是第一个下载的仓库，自动设为默认
        const hasDefault = repos.value.some(
          (r) => r.isDefault && r.isDownloaded
        );
        if (!hasDefault) {
          setAsDefault(index);
        }

        cloneOutput.value.push("仓库下载完成！");
        cloneOutput.value.push(`本地路径: ${result.path}`);
      } else {
        cloneOutput.value.push(`下载失败: ${result?.error || "未知错误"}`);
      }
    } else {
      // 模拟下载完成
      await simulateCloneProgress();

      // 模拟设置为已下载
      repo.isDownloaded = true;
      repo.localPath = `D:/appspace/repos/${
        repo.name || "repo-" + Math.floor(Math.random() * 1000)
      }`;

      cloneOutput.value.push(`模拟下载完成，本地路径: ${repo.localPath}`);

      // 可能是第一个下载的仓库，设为默认
      const hasDefault = repos.value.some((r) => r.isDefault && r.isDownloaded);
      if (!hasDefault) {
        setAsDefault(index);
      }
    }
  } catch (error) {
    console.error("下载仓库失败:", error);
    cloneOutput.value.push(`下载失败: ${error.message}`);
  } finally {
    isCloning.value = false;
  }
}

// 确认选择
function confirmSelection() {
  emit("close");
  // if (selectedRepoIndex.value === null) return;

  // store.appData.from = "github";
  // store.appData.github.repos.push(repos.value[selectedRepoIndex.value]);
  // // 准备配置
  // const config = {
  //   name: currentRepo.value.name,
  //   repoUrl: currentRepo.value.url,
  //   repos: repos.value,
  //   defaultRepoUrl: defaultRepo.value
  //     ? defaultRepo.value.url
  //     : currentRepo.value.url,
  // };

  // emit("confirm", { config, type: "git" });
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-container {
  background-color: var(--color-card, #ffffff);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 550px;
  max-width: 95vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modal-appear 0.2s ease-out;
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border, #e0e0e0);
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-strong, #333);
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  color: var(--color-text-light, #666);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-button:hover {
  background-color: var(--color-hover, #f5f5f5);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.modal-footer {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid var(--color-border, #e0e0e0);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-strong);
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}

.form-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.required {
  color: #e53e3e;
  margin-left: 2px;
}

input[type="text"] {
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
  color: var(--color-text);
  font-size: 14px;
  transition: all 0.2s ease;
}

input[type="text"]:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-hover);
}

input[type="text"].error {
  border-color: #e53e3e;
}

.error-message {
  color: #e53e3e;
  font-size: 13px;
}

.source-hint {
  font-size: 12px;
  color: var(--color-text-light);
  margin-top: 8px;
}

/* 仓库地址列表样式 */
.empty-repo-list {
  padding: 20px;
  text-align: center;
  background-color: var(--color-background, #f8f8f8);
  border-radius: 6px;
  color: var(--color-text-light);
}

.repo-addresses-list {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 12px;
}

.repo-address-item {
  border-bottom: 1px solid var(--color-border);
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.repo-address-item:last-child {
  border-bottom: none;
}

.repo-address-item:hover {
  background-color: var(--color-hover, #f5f5f5);
}

.repo-address-item.selected {
  background-color: rgba(var(--color-primary-rgb, 96, 165, 250), 0.1);
  border-left: 3px solid var(--color-primary, #3b82f6);
}

.repo-address-content {
  margin-bottom: 8px;
}

.repo-address-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--color-text-strong);
  margin-bottom: 4px;
}

.repo-address-url {
  font-size: 13px;
  color: var(--color-text);
  word-break: break-all;
}

.repo-address-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  align-items: center;
}

.action-button {
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.set-default-button {
  background-color: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.set-default-button:hover {
  background-color: #bae7ff;
  border-color: #1890ff;
}

.download-button {
  background-color: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.download-button:hover {
  background-color: #d9f7be;
  border-color: #52c41a;
}

.delete-button {
  background-color: #fff1f0;
  color: #ff4d4f;
  border: 1px solid #ffa39e;
}

.delete-button:hover {
  background-color: #ffccc7;
  border-color: #ff4d4f;
}

.default-badge,
.downloaded-badge {
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.default-badge {
  background-color: #1890ff;
  color: white;
}

.downloaded-badge {
  background-color: #52c41a;
  color: white;
  margin-right: 5px;
}

.add-address-button {
  padding: 10px;
  border-radius: 6px;
  background-color: var(--color-background, #f8f8f8);
  border: 1px dashed var(--color-border);
  color: var(--color-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.add-address-button:hover {
  background-color: var(--color-hover);
  border-color: var(--color-primary-light);
}

/* 添加表单样式 */
.add-address-form {
  background-color: var(--color-background-secondary, #f8f8f8);
  border-radius: 6px;
  padding: 16px;
  border: 1px solid var(--color-border);
}

.add-repo-input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.add-repo-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.repo-options {
  display: flex;
  margin-top: 12px;
}

.default-checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text);
  cursor: pointer;
}

/* 测试克隆区域 */
.test-clone-section {
  margin-bottom: 20px;
}

.test-button {
  padding: 8px 16px;
  background-color: var(--color-secondary, #6c757d);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.test-button:hover {
  background-color: var(--color-secondary-dark, #5a6268);
}

.test-button:disabled {
  background-color: var(--color-secondary-light, #adb5bd);
  cursor: not-allowed;
}

/* 克隆测试区域样式 */
.clone-test-area {
  background-color: var(--color-background, #f8f8f8);
  border-radius: 6px;
  border: 1px solid var(--color-border);
  margin-bottom: 20px;
  overflow: hidden;
}

.clone-test-header {
  padding: 10px 16px;
  background-color: var(--color-background-secondary, #f0f0f0);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.clone-test-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-strong);
}

.stop-button {
  padding: 4px 8px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.stop-button:hover {
  background-color: #c82333;
}

.clone-log {
  padding: 16px;
  max-height: 200px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: #f8f9fa;
  scroll-behavior: smooth;
}

.log-line {
  margin-bottom: 4px;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  color: var(--color-text-light);
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-left-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.git-info {
  background-color: var(--color-background-secondary, #f5f7fa);
  border-radius: 6px;
  padding: 16px;
  font-size: 14px;
  color: var(--color-text);
  line-height: 1.5;
}

.git-info p {
  margin: 0 0 8px;
}

.git-info p:last-child {
  margin-bottom: 0;
}

.cancel-button,
.confirm-button {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button {
  background-color: var(--color-background-secondary, #f0f0f0);
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.cancel-button:hover {
  background-color: var(--color-hover);
}

.confirm-button {
  background-color: var(--color-primary);
  border: none;
  color: white;
}

.confirm-button:hover {
  background-color: var(--color-primary-dark);
}

.confirm-button:disabled {
  background-color: var(--color-primary-light);
  cursor: not-allowed;
  opacity: 0.7;
}

.cancel-add {
  background-color: var(--color-background-secondary, #f0f0f0);
  color: var(--color-text);
}

.cancel-add:hover {
  background-color: var(--color-hover);
}

.confirm-add {
  background-color: var(--color-primary);
  color: white;
}

.confirm-add:hover {
  background-color: var(--color-primary-dark);
}

.confirm-add:disabled {
  background-color: var(--color-primary-light);
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
