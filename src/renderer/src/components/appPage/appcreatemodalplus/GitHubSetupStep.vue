<template>
  <div
    id="step-1"
    ref="stepRef"
    class="step-form"
    :class="{ active: isActive }"
  >
    <h3 class="step-title">GitHub 设置</h3>

    <!-- 确保 github 对象存在 -->
    <div v-if="ensureGithubExists" class="form-group">
      <label>Git 仓库地址列表</label>

      <!-- 仓库列表 -->
      <div
        v-if="store.appData.github.repos.length === 0"
        class="empty-repo-list"
      >
        <p>暂无仓库地址，请点击下方按钮添加</p>
      </div>

      <div v-else class="repo-addresses-list">
        <div
          v-for="(repo, index) in store.appData.github.repos"
          :key="index"
          class="repo-address-item"
          :class="{ selected: selectedRepoIndex === index }"
          @click="selectRepo(index)"
        >
          <div class="repo-address-content">
            <div class="repo-address-name">{{ repo.name || "未命名仓库" }}</div>
            <div class="repo-address-url">{{ repo.repoUrl }}</div>
          </div>
          <div class="repo-address-actions">
            <span v-if="repo.isDefault" class="default-badge">默认</span>
            <span v-if="repo.isDownloaded" class="downloaded-badge"
              >已下载</span
            >
            <button
              v-if="!repo.isDefault"
              class="action-button set-default-button"
              @click.stop="setAsDefault(index)"
            >
              设为默认
            </button>
            <button
              class="action-button edit-button"
              @click.stop="editRepo(index)"
            >
              编辑
            </button>
            <button
              class="action-button delete-button"
              @click.stop="deleteRepo(index)"
            >
              删除
            </button>
          </div>
        </div>
      </div>

      <!-- 添加新仓库按钮 -->
      <button
        class="add-address-button"
        @click="showAddForm = true"
        v-if="!showAddForm"
      >
        <span>+ 添加仓库地址</span>
      </button>

      <!-- 新仓库表单 -->
      <div class="form-group add-address-form" v-if="showAddForm">
        <label>仓库地址 <span class="required">*</span></label>
        <div class="add-repo-input-group">
          <input
            type="text"
            v-model="newRepo.repoUrl"
            placeholder="例如: https://github.com/username/repository"
            :class="{ error: repoUrlError }"
            @keyup.enter="saveRepo"
          />

          <input
            type="text"
            v-model="newRepo.name"
            placeholder="仓库名称（可选）"
          />

          <div class="add-repo-actions">
            <button class="action-button cancel-add" @click="cancelRepoForm">
              取消
            </button>
            <button
              class="action-button confirm-add"
              @click="saveRepo"
              :disabled="!newRepo.repoUrl"
            >
              {{ editingRepoIndex !== null ? "保存" : "添加" }}
            </button>
          </div>
        </div>

        <div v-if="repoUrlError" class="error-message">
          {{ repoUrlError }}
        </div>

        <div class="repo-options">
          <label class="default-checkbox-label">
            <input type="checkbox" v-model="newRepo.isDefault" />
            <span>设为默认地址</span>
          </label>
        </div>
      </div>
    </div>
    <!-- 
    <div class="form-group" v-if="!showAddForm">
      <label class="checkbox-label">
        <input type="checkbox" v-model="useMirror" />
        <span>使用镜像加速</span>
      </label>
      <div class="mirror-options" v-if="useMirror">
        <div class="mirror-option">
          <input
            type="radio"
            id="global-mirror"
            value="global"
            v-model="mirrorType"
            name="mirror-type"
          />
          <label for="global-mirror">使用全局设置中的镜像</label>
        </div>

        <div class="mirror-option">
          <input
            type="radio"
            id="default-mirror"
            value="default"
            v-model="mirrorType"
            name="mirror-type"
          />
          <label for="default-mirror">使用默认镜像 (ghproxy.com)</label>
        </div>

        <div class="mirror-option">
          <input
            type="radio"
            id="custom-mirror"
            value="custom"
            v-model="mirrorType"
            name="mirror-type"
          />
          <label for="custom-mirror">使用自定义镜像</label>
        </div>

        <div class="custom-mirror-input" v-if="mirrorType === 'custom'">
          <input
            type="text"
            v-model="customMirrorUrl"
            placeholder="例如: https://ghproxy.net/"
            :class="{ error: customMirrorUrlError }"
            @input="updateCustomMirror"
          />
          <div v-if="customMirrorUrlError" class="error-message">
            {{ customMirrorUrlError }}
          </div>
        </div>
      </div>
    </div> -->

    <!-- Add GitHub Installation Progress Section -->
    <div
      v-if="
        store.appData.githubInstallLogs &&
        store.appData.githubInstallLogs.length > 0
      "
      class="github-install-progress"
    >
      <h4>仓库下载进度</h4>
      <div class="github-install-status">
        <span
          :class="['status-indicator', store.appData.githubInstallStatus]"
        ></span>
        <span v-if="store.appData.githubInstallStatus === 'progress'"
          >正在下载...</span
        >
        <span v-else-if="store.appData.githubInstallStatus === 'success'"
          >下载成功</span
        >
        <span v-else-if="store.appData.githubInstallStatus === 'error'"
          >下载失败</span
        >
      </div>
      <div class="github-install-logs">
        <div
          v-for="(log, index) in store.appData.githubInstallLogs"
          :key="index"
          class="log-line"
        >
          {{ log }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from "vue";
import { useAppCreateStore } from "../../../stores/appCreateStore";

const props = defineProps({
  isActive: {
    type: Boolean,
    default: false,
  },
});

const store = useAppCreateStore();
const stepRef = ref(null);

// 表单状态
const showAddForm = ref(false);
const editingRepoIndex = ref(null);
const newRepo = ref({
  name: "",
  repoUrl: "",
  isDefault: false,
});
const repoUrlError = ref("");
const customMirrorUrlError = ref("");
const selectedRepoIndex = ref(null);

// 镜像配置
const useMirror = ref(true);
const mirrorType = ref("global");
const customMirrorUrl = ref("");

// 确保 github 对象存在的计算属性
const ensureGithubExists = computed(() => {
  if (!store.appData.github) {
    store.appData.github = { repos: [] };
  }
  return true;
});

// 初始化镜像设置
onMounted(() => {
  // 从第一个仓库获取镜像设置（如果存在）
  if (store.appData.github && store.appData.github.repos.length > 0) {
    const firstRepo = store.appData.github.repos[0];
    if (firstRepo.useMirror !== undefined) {
      useMirror.value = firstRepo.useMirror;
    }
    if (firstRepo.mirrorType !== undefined) {
      mirrorType.value = firstRepo.mirrorType;
    }
    if (firstRepo.customMirrorUrl !== undefined) {
      customMirrorUrl.value = Array.isArray(firstRepo.customMirrorUrl)
        ? firstRepo.customMirrorUrl.join(",")
        : firstRepo.customMirrorUrl || "";
    }

    // 默认选中第一个仓库
    if (store.appData.github.repos.length > 0) {
      selectedRepoIndex.value = 0;
    }
  }
});

// 选择仓库
function selectRepo(index) {
  selectedRepoIndex.value = index;
}

// 设置为默认地址
function setAsDefault(index) {
  // 先将所有仓库设为非默认
  store.appData.github.repos.forEach((repo) => {
    repo.isDefault = false;
  });

  // 将选中的仓库设为默认
  store.appData.github.repos[index].isDefault = true;
}

// 编辑仓库
function editRepo(index) {
  const repo = store.appData.github.repos[index];
  newRepo.value = {
    name: repo.name || "",
    repoUrl: repo.repoUrl || "",
    isDefault: repo.isDefault || false,
  };
  editingRepoIndex.value = index;
  showAddForm.value = true;
}

// 删除仓库
function deleteRepo(index) {
  const isRemovingDefault = store.appData.github.repos[index].isDefault;

  // 从列表中移除
  store.appData.github.repos.splice(index, 1);

  // 更新选中的索引
  if (selectedRepoIndex.value === index) {
    selectedRepoIndex.value = store.appData.github.repos.length > 0 ? 0 : null;
  } else if (selectedRepoIndex.value > index) {
    selectedRepoIndex.value--;
  }

  // 如果删除的是默认地址且列表不为空，设置第一个为默认
  if (isRemovingDefault && store.appData.github.repos.length > 0) {
    store.appData.github.repos[0].isDefault = true;
  }
}

// 取消编辑/添加仓库
function cancelRepoForm() {
  newRepo.value = {
    name: "",
    repoUrl: "",
    isDefault: false,
  };
  repoUrlError.value = "";
  showAddForm.value = false;
  editingRepoIndex.value = null;
}

// 验证仓库 URL
function validateRepoUrl(url) {
  if (!url.trim()) {
    repoUrlError.value = "仓库地址不能为空";
    return false;
  }

  // 验证 URL 格式
  const gitUrlPattern =
    /^(https?:\/\/|git@|ssh:\/\/)([\w.-]+@)?([\w.-]+)(:\d+)?\/([^/\s]+)(\/[^/\s]+)+(.git)?$/;
  if (!gitUrlPattern.test(url.trim())) {
    repoUrlError.value = "仓库地址格式不正确";
    return false;
  }

  // 检查是否重复（除了当前编辑的仓库）
  const repos = store.appData.github.repos;
  const isDuplicate = repos.some(
    (repo, index) =>
      repo.repoUrl === url.trim() && index !== editingRepoIndex.value
  );

  if (isDuplicate) {
    repoUrlError.value = "该仓库地址已存在";
    return false;
  }

  repoUrlError.value = "";
  return true;
}

// 保存仓库
function saveRepo() {
  // 验证仓库地址
  if (!validateRepoUrl(newRepo.value.repoUrl)) {
    return;
  }

  // 从URL中提取仓库名称（如果未提供）
  let repoName = newRepo.value.name;
  if (!repoName) {
    try {
      const url = new URL(newRepo.value.repoUrl);
      const pathParts = url.pathname.split("/").filter((part) => part);
      const mainDomain = url.hostname.split(".")[0];
      // 使用最后一部分作为仓库名称，去掉.git后缀
      if (pathParts.length > 0) {
        repoName =
          mainDomain +
          "_" +
          pathParts[pathParts.length - 1].replace(/\.git$/, "");
      }
    } catch (e) {
      // 如果URL解析失败，使用基本名称
      repoName = `仓库 ${store.appData.github.repos.length + 1}`;
    }
  }

  // 应用镜像设置到仓库
  const repoWithConfig = {
    name: repoName,
    repoUrl: newRepo.value.repoUrl.trim(),
    isDefault: newRepo.value.isDefault,
    useMirror: useMirror.value,
    mirrorType: mirrorType.value,
    customMirrorUrl: mirrorType.value === "custom" ? customMirrorUrl.value : "",
  };

  // 如果设置为默认，需要将其他地址设为非默认
  if (newRepo.value.isDefault) {
    store.appData.github.repos.forEach((repo) => {
      repo.isDefault = false;
    });
  }

  // 如果是第一个地址，自动设为默认
  if (store.appData.github.repos.length === 0) {
    repoWithConfig.isDefault = true;
  }

  // 添加或更新仓库
  if (editingRepoIndex.value !== null) {
    store.appData.github.repos[editingRepoIndex.value] = repoWithConfig;
    // 选中编辑的仓库
    selectedRepoIndex.value = editingRepoIndex.value;
  } else {
    store.appData.github.repos.push(repoWithConfig);
    // 选中新添加的仓库
    selectedRepoIndex.value = store.appData.github.repos.length - 1;
  }

  // 重置表单
  cancelRepoForm();
}

// 更新自定义镜像URL
function updateCustomMirror() {
  // 验证自定义镜像URL
  if (mirrorType.value === "custom" && !customMirrorUrl.value.trim()) {
    customMirrorUrlError.value = "自定义镜像URL不能为空";
    return;
  }
  customMirrorUrlError.value = "";

  // 应用镜像设置到所有仓库
  if (store.appData.github && store.appData.github.repos.length > 0) {
    store.appData.github.repos.forEach((repo) => {
      repo.useMirror = useMirror.value;
      repo.mirrorType = mirrorType.value;

      // 处理自定义镜像URL
      if (mirrorType.value === "custom") {
        const urlArray = customMirrorUrl.value
          .split(",")
          .map((url) => url.trim())
          .filter((url) => url);

        if (urlArray.length === 1) {
          repo.customMirrorUrl = urlArray[0];
        } else if (urlArray.length > 1) {
          repo.customMirrorUrl = urlArray;
        } else {
          repo.customMirrorUrl = "";
        }
      }
    });
  }
}

// 监视镜像配置变化并更新所有仓库
watch([useMirror, mirrorType], () => {
  if (store.appData.github && store.appData.github.repos.length > 0) {
    store.appData.github.repos.forEach((repo) => {
      repo.useMirror = useMirror.value;
      repo.mirrorType = mirrorType.value;
    });
  }
});

// Expose the stepRef to parent
defineExpose({
  stepRef,
});
</script>

<style scoped>
.step-form {
  padding: 20px 0;
  margin-bottom: 20px;
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.step-form.active {
  padding: 20px;
  margin-left: -20px;
  margin-right: -20px;
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

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
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

.mirror-options {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-left: 24px;
}

.mirror-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-mirror-input {
  margin-top: 8px;
}

.step-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-strong);
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
}

.github-tips {
  background-color: var(--color-background-secondary);
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
}

.github-tips h4 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--color-text-strong);
}

.github-tips ul {
  margin: 0;
  padding-left: 20px;
}

.github-tips li {
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--color-text);
}

/* 仓库列表样式 */
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

.edit-button {
  background-color: #f4f4f4;
  color: #7b7b7b;
  border: 1px solid #d9d9d9;
}

.edit-button:hover {
  background-color: #e0e0e0;
  border-color: #7b7b7b;
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

/* GitHub Installation Progress Styles */
.github-install-progress {
  margin-top: 20px;
  padding: 16px;
  background-color: var(--color-background-secondary);
  border-radius: 8px;
}

.github-install-progress h4 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--color-text-strong);
}

.github-install-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.status-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: var(--color-text-light);
}

.status-indicator.progress {
  background-color: var(--color-primary);
}

.status-indicator.success {
  background-color: var(--color-success);
}

.status-indicator.error {
  background-color: var(--color-error);
}

.github-install-logs {
  margin-top: 8px;
}

.log-line {
  margin-bottom: 4px;
  font-size: 13px;
  color: var(--color-text);
}
</style>
