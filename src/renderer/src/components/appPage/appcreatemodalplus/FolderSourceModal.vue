<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3>从文件夹创建</h3>
        <button class="close-button" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label>文件夹路径 <span class="required">*</span></label>
          <div class="folder-path-input">
            <input
              type="text"
              v-model="folderPath"
              placeholder="应用文件夹路径"
              readonly
            />
            <button class="browse-button" @click="browseFolder">浏览...</button>
          </div>
          <div class="source-hint">选择包含应用代码的本地文件夹</div>
        </div>

        <div class="folder-selection-info">
          <p>选择一个包含应用代码的本地文件夹</p>
        </div>
      </div>

      <div class="modal-footer">
        <button class="cancel-button" @click="cancelSelection">取消</button>
        <button
          class="confirm-button"
          @click="confirmSelection"
          :disabled="!folderPath"
        >
          确认
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useAppCreateStore } from "../../../stores/appCreateStore";

const emit = defineEmits(["close", "browse-directory", "confirm"]);

// Use the Pinia store
const store = useAppCreateStore();
// const folderPath = ref(store.folderPath || "");
const folderPath = computed(() => store.appData.folderPath || "");
async function browseFolder() {
  // 设置对话框标题
  let title = "选择工作目录";
  let directory = "folderPath";
  try {
    // 使用 Electron API 打开目录选择对话框
    if (window.electronAPI && window.electronAPI.showOpenDialog) {
      // 调用 electron 的文件夹选择对话框
      const result = await window.electronAPI.showOpenDialog({
        title: title,
        defaultPath: store.appData[directory] || "",
        properties: ["openDirectory"],
      });

      // 如果用户选择了目录
      if (
        result &&
        !result.canceled &&
        result.filePaths &&
        result.filePaths.length > 0
      ) {
        const selectedPath = result.filePaths[0];
        console.log(selectedPath, directory);
        store.appData[directory] = selectedPath;
        console.log(store.appData);
        console.log("folderPath.value", folderPath.value);
        await store.setFolderPath(selectedPath);
        store.appData.name = await window.electronAPI.getFolderBasename(
          selectedPath
        );
        console.log("store.appData.name", store.appData.name);
        console.log(`已选择${directory}:`, selectedPath);

        // return selectedPath;
      }
    }
  } catch (err) {
    console.error(`选择${directory}失败:`, err);
  }
  return null;
}

function cancelSelection() {
  // folderPath.value = "";
  store.setFolderPath("");
  emit("close");
}
// Confirm selection
function confirmSelection() {
  emit("close");
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

.required {
  color: #e53e3e;
  margin-left: 2px;
}

input {
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
  color: var(--color-text);
  font-size: 14px;
  transition: all 0.2s ease;
}

input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-hover);
}

.folder-path-input {
  display: flex;
  gap: 8px;
}

.folder-path-input input {
  flex: 1;
}

.browse-button {
  padding: 8px 12px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.browse-button:hover {
  background-color: var(--color-primary-dark);
}

.source-hint {
  font-size: 12px;
  color: var(--color-text-light);
  margin-top: 8px;
}

.folder-selection-info {
  background-color: var(--color-background-secondary, #f5f7fa);
  border-radius: 6px;
  padding: 16px;
  font-size: 14px;
  color: var(--color-text);
  line-height: 1.5;
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
</style>
