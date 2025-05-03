<template>
  <div class="model-sidebar" ref="sidebarRef">
    <!-- Search bar section -->
    <SearchBar v-model:searchQuery="searchQuery" />

    <!-- Tag selection -->
    <TagSelector
      :availableTags="availableTags"
      :selectedTags="selectedTags"
      :tagCounts="tagCounts"
      :filterMode="filterMode"
      @toggle-tag="toggleTag"
      @toggle-filter-mode="toggleFilterMode"
      @reset-filters="resetFilters"
    />

    <!-- Model Files section with draggable header -->
    <div
      class="section-header"
      :class="{
        'is-dragging': isDragging,
        'is-collapsed': !isFilesSectionExpanded,
        'is-bottom': !isFilesSectionExpanded,
      }"
      @mousedown="startDrag"
      @keydown.enter="handleTitleKeypress"
      @keydown.space="handleTitleKeypress"
      tabindex="0"
      role="button"
      :aria-expanded="isFilesSectionExpanded"
      :title="isFilesSectionExpanded ? '拖动调整位置' : '拖动调整位置'"
      :style="
        !isFilesSectionExpanded
          ? { bottom: '0', top: 'auto' }
          : { top: headerPosition + 'px' }
      "
      ref="headerRef"
    >
      <div class="header-content">
        <h3 class="header-title">模型收藏</h3>
        <div class="toggle-wrapper">
          <span class="section-badge" v-if="hasFiles">{{ fileCount }}</span>
          <span
            class="toggle-icon"
            :class="{ 'is-collapsed': !isFilesSectionExpanded }"
            @click.stop="toggleFilesSection"
            @mousedown.stop
            title="展开/收起文件区域"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </span>
        </div>
      </div>
    </div>

    <!-- Collapsible content with adjustable position -->
    <div
      class="model-files-section"
      v-show="isFilesSectionExpanded"
      :aria-hidden="!isFilesSectionExpanded"
      :style="{
        top: headerPosition + headerHeight + 'px',
        height: `calc(100% - ${headerPosition + headerHeight}px)`,
      }"
    >
      <ModelFolderTree
        ref="folderTree"
        :initialData="folderTreeData"
        @select-node="handleNodeSelect"
        @add-folder="handleAddFolder"
        @add-file="handleAddFile"
        @update-tree="handleTreeUpdate"
      />
    </div>

    <!-- Universal Add Button (fixed at bottom) -->
    <!-- <div class="universal-add-button" :class="{ 'bottom-collapsed': !isFilesSectionExpanded }"> -->
    <!-- <div class="add-button-wrapper"> -->
    <!-- <button @click="toggleAddMenu" class="add-button" title="添加文件或文件夹">
          <span class="add-icon">+</span>
        </button> -->

    <!-- Dropdown Menu -->
    <!-- <div class="add-menu" v-if="showAddMenu">
          <button @click="handleAddFileClick" class="menu-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            <span>添加文件</span>
          </button>
          <button @click="handleAddFolderClick" class="menu-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              <line x1="12" y1="11" x2="12" y2="17"></line>
              <line x1="9" y1="14" x2="15" y2="14"></line>
            </svg>
            <span>添加文件夹</span>
          </button>
        </div> -->
    <!-- </div> -->
    <!-- </div> -->
  </div>
</template>

<script setup>
import {
  ref,
  defineProps,
  defineEmits,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
} from "vue";
import SearchBar from "./SearchBar.vue";
import TagSelector from "./TagSelector.vue";
import ModelFolderTree from "./ModelFolderTree.vue";

// Props for the ModelSidebar component
const props = defineProps({
  // Search and filtering
  searchQuery: {
    type: String,
    required: true,
  },
  availableTags: {
    type: Array,
    required: true,
  },
  selectedTags: {
    type: Array,
    required: true,
  },
  tagCounts: {
    type: Object,
    required: true,
  },
  filterMode: {
    type: String,
    required: true,
  },
  // Model folder data
  folderData: {
    type: Object,
    default: () => ({
      id: "root",
      name: "Models",
      type: "folder",
      expanded: true,
      children: [],
    }),
  },
  // Auto-collapse threshold
  autoCollapseWidth: {
    type: Number,
    default: 240, // Width threshold in pixels
  },
  // Minimum distance from top for header
  minHeaderTop: {
    type: Number,
    default: 180, // Minimum position from top (should be enough for SearchBar + TagSelector)
  },
  // Maximum distance from top for header
  maxHeaderTop: {
    type: Number,
    default: 500, // Maximum position from top
  },
});

// Emitted events
const emit = defineEmits([
  "update:searchQuery",
  "toggle-tag",
  "toggle-filter-mode",
  "reset-filters",
  "select-file",
  "add-folder",
  "add-file",
  "update-folder-tree",
]);

// Folder tree data
const folderTreeData = ref(props.folderData);
const folderTree = ref(null);
const isFilesSectionExpanded = ref(true);
const sidebarRef = ref(null);
const headerRef = ref(null);
const wasExpanded = ref(true); // Remember the user's preferred state

// Drag state
const isDragging = ref(false);
const headerPosition = ref(props.minHeaderTop);
const headerHeight = ref(40); // Default height of header, will be measured after mount
const dragStartY = ref(0);
const dragStartPosition = ref(0);

// Method to handle search query updates
const searchQuery = computed({
  get: () => props.searchQuery,
  set: (value) => emit("update:searchQuery", value),
});

// Watch for folder data changes
watch(
  () => props.folderData,
  (newValue) => {
    folderTreeData.value = newValue;
  },
  { deep: true }
);

// Handle keypress on the header (for accessibility)
const handleTitleKeypress = (event) => {
  // Do nothing, toggle will be handled only by clicking the toggle icon
};

// Drag functionality
const startDrag = (event) => {
  // Don't allow drag if collapsed
  if (!isFilesSectionExpanded.value) {
    if (event.target.closest(".toggle-icon")) {
      toggleFilesSection();
    }
    return;
  }

  // Only start drag if clicking on the header title or the section header itself
  // but not if clicking the toggle icon
  const target = event.target;
  if (target.closest(".toggle-icon")) {
    return;
  }

  // Prevent default behavior
  event.preventDefault();

  // Store initial position
  isDragging.value = true;
  dragStartY.value = event.clientY;
  dragStartPosition.value = headerPosition.value;

  // Add event listeners for dragging
  document.addEventListener("mousemove", handleDrag);
  document.addEventListener("mouseup", stopDrag);

  // Add dragging class to body to prevent text selection
  document.body.classList.add("dragging");
};

const handleDrag = (event) => {
  if (!isDragging.value) return;

  // Calculate new position
  const deltaY = event.clientY - dragStartY.value;
  let newPosition = dragStartPosition.value + deltaY;

  // Constrain to min/max bounds
  newPosition = Math.max(props.minHeaderTop, newPosition);
  newPosition = Math.min(props.maxHeaderTop, newPosition);

  // Update header position
  headerPosition.value = newPosition;

  // Save position preference to localStorage
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("modelFilesHeaderPosition", newPosition);
  }
};

const stopDrag = () => {
  isDragging.value = false;

  // Remove event listeners
  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", stopDrag);

  // Remove dragging class from body
  document.body.classList.remove("dragging");
};

// Toggle files section expansion - only triggered by toggle icon
const toggleFilesSection = () => {
  isFilesSectionExpanded.value = !isFilesSectionExpanded.value;
  wasExpanded.value = isFilesSectionExpanded.value;

  // Save preference to localStorage if available
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(
      "modelFilesSectionExpanded",
      isFilesSectionExpanded.value
    );
  }
};

// Add computed properties for file counting
const fileCount = computed(() => {
  return countFiles(folderTreeData.value);
});

const hasFiles = computed(() => {
  return fileCount.value > 0;
});

// Helper function to count files in the tree
function countFiles(node) {
  let count = 0;

  if (node.type === "file") {
    return 1;
  }

  if (node.children && Array.isArray(node.children)) {
    node.children.forEach((child) => {
      count += countFiles(child);
    });
  }

  return count;
}

// Add ResizeObserver to handle responsive behavior
let resizeObserver = null;

onMounted(() => {
  // Measure the actual header height
  if (headerRef.value) {
    nextTick(() => {
      headerHeight.value = headerRef.value.offsetHeight;
    });
  }

  // Load user preference for section expansion
  if (typeof localStorage !== "undefined") {
    const savedState = localStorage.getItem("modelFilesSectionExpanded");
    if (savedState !== null) {
      isFilesSectionExpanded.value = savedState === "true";
      wasExpanded.value = isFilesSectionExpanded.value;
    }

    // Load saved header position
    const savedPosition = localStorage.getItem("modelFilesHeaderPosition");
    if (savedPosition !== null) {
      const position = parseInt(savedPosition, 10);
      if (!isNaN(position)) {
        headerPosition.value = position;
      }
    }
  }

  // Setup ResizeObserver for responsive behavior
  if (window.ResizeObserver && sidebarRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;

        if (width < props.autoCollapseWidth) {
          // Auto-collapse when width is below threshold
          if (isFilesSectionExpanded.value) {
            wasExpanded.value = true; // Remember that user had it expanded
            isFilesSectionExpanded.value = false;
          }
        } else if (!isFilesSectionExpanded.value && wasExpanded.value) {
          // Restore previous state when width increases
          isFilesSectionExpanded.value = true;
        }
      }
    });

    resizeObserver.observe(sidebarRef.value);
  }
});

onBeforeUnmount(() => {
  // Clean up ResizeObserver
  if (resizeObserver && sidebarRef.value) {
    resizeObserver.unobserve(sidebarRef.value);
    resizeObserver.disconnect();
  }

  // Clean up drag event listeners
  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", stopDrag);

  // Clean up add menu event listener
  document.removeEventListener("click", closeAddMenu);
});

// Methods for tag selection and filtering
const toggleTag = (tag) => {
  emit("toggle-tag", tag);
};

const toggleFilterMode = () => {
  emit("toggle-filter-mode");
};

const resetFilters = () => {
  emit("reset-filters");
};

// Methods for folder tree interactions
const handleNodeSelect = (node) => {
  if (node.type === "file") {
    emit("select-file", node);
  }
};

const handleAddFolder = (folder) => {
  emit("add-folder", folder);
};

const handleAddFile = (file, parentFolder) => {
  emit("add-file", file, parentFolder);
};

const handleTreeUpdate = (treeData) => {
  emit("update-folder-tree", treeData);
};

// Add dropdown menu state
const showAddMenu = ref(false);

// Toggle add menu dropdown
const toggleAddMenu = () => {
  showAddMenu.value = !showAddMenu.value;

  // If the files section is collapsed, expand it when showing the menu
  if (showAddMenu.value && !isFilesSectionExpanded.value) {
    isFilesSectionExpanded.value = true;
  }

  // If opening the menu, add a click listener to close it when clicking outside
  if (showAddMenu.value) {
    setTimeout(() => {
      document.addEventListener("click", closeAddMenu);
    }, 0);
  }
};

// Close the add menu
const closeAddMenu = (event) => {
  // Check if the click was outside the menu
  const addButtonWrapper = document.querySelector(".add-button-wrapper");
  if (addButtonWrapper && !addButtonWrapper.contains(event.target)) {
    showAddMenu.value = false;
    document.removeEventListener("click", closeAddMenu);
  }
};

// Handle add file action
const handleAddFileClick = () => {
  // Close the menu
  showAddMenu.value = false;
  document.removeEventListener("click", closeAddMenu);

  // If collapsed, expand first
  if (!isFilesSectionExpanded.value) {
    isFilesSectionExpanded.value = true;
  }

  // Add the file
  folderTree.value?.addNewFile();
};

// Handle add folder action
const handleAddFolderClick = () => {
  // Close the menu
  showAddMenu.value = false;
  document.removeEventListener("click", closeAddMenu);

  // If collapsed, expand first
  if (!isFilesSectionExpanded.value) {
    isFilesSectionExpanded.value = true;
  }

  // Add the folder
  folderTree.value?.addNewFolder();
};

// Expose methods to parent component
defineExpose({
  addNewFolder: handleAddFolderClick,
  addNewFile: handleAddFileClick,
  toggleFilesSection,
  resetHeaderPosition: () => {
    headerPosition.value = props.minHeaderTop;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("modelFilesHeaderPosition", props.minHeaderTop);
    }
  },
});
</script>

<style scoped>
.model-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.section-header {
  padding: 0.75rem 0.5rem;
  margin-top: 0;
  border-top: 1px solid var(--color-border, #e2e8f0);
  cursor: move; /* Indicate it's draggable */
  user-select: none;
  transition: all 0.3s;
  border-radius: 4px;
  position: absolute;
  left: 0;
  right: 0;
  z-index: 10;
  background-color: var(--color-background, #f9fafc);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
}

.section-header.is-bottom {
  /* border-top: none; */
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);
}

.section-header.is-collapsed {
  cursor: default;
  background-color: var(--color-background, #f9fafc);
}

.section-header.is-dragging {
  cursor: grabbing;
  background-color: rgb(233, 237, 253);
  /* opacity: 0.9; */
  transition: none;
}

.section-header:hover:not(.is-collapsed) {
  background-color: rgb(246, 247, 254);
}
/* .section-header.is-dragging {
  cursor: grabbing;
  background-color: var(--color-active, rgba(76, 110, 245, 0.12));
  opacity: 0.9;
  transition: none;
}

.section-header:hover:not(.is-collapsed) {
  background-color: var(--color-hover, rgba(76, 110, 245, 0.05));
} */

.section-header::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background-color: var(--color-primary, #4c6ef5);
  opacity: 0;
  transition: opacity 0.2s;
  border-radius: 0 2px 2px 0;
}

.section-header:hover:not(.is-collapsed)::before {
  opacity: 0.5;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
}

.header-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-strong, #1e293b);
  cursor: move;
}

.section-header.is-collapsed .header-title {
  cursor: default;
}

.toggle-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background-color: var(--color-primary, #4c6ef5);
  color: white;
  border-radius: 9px;
  font-size: 0.7rem;
  font-weight: 600;
}

.toggle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-light, #64748b);
  transition: transform 0.2s ease;
  cursor: pointer;
  width: 24px;
  height: 24px;
  border-radius: 4px;
}

.toggle-icon:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--color-text-strong, #1e293b);
}

.toggle-icon.is-collapsed {
  transform: rotate(-90deg);
}

.model-files-section {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideDown 0.2s ease;
  background-color: var(--color-background, #f9fafc);
  padding: 0.5rem 1rem;
}

@keyframes slideDown {
  from {
    max-height: 0;
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    max-height: 1000px;
    opacity: 1;
    transform: translateY(0);
  }
}

.file-actions {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 0;
  margin-top: 0.5rem;
  border-top: 1px solid var(--color-border, #e2e8f0);
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 4px;
  background-color: var(--color-background, #f9fafc);
  color: var(--color-text, #334155);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: var(--color-hover, rgba(76, 110, 245, 0.08));
  color: var(--color-primary, #4c6ef5);
  border-color: var(--color-primary-lighter, #a5b4fc);
}

.folder-btn {
  color: var(--color-secondary, #6366f1);
}

.folder-btn:hover {
  color: var(--color-secondary-darker, #4f46e5);
  background-color: rgba(99, 102, 241, 0.08);
  border-color: rgba(99, 102, 241, 0.3);
}

.section-header:focus {
  box-shadow: 0 0 0 2px rgba(76, 110, 245, 0.3);
}

.section-header:focus:not(:focus-visible) {
  box-shadow: none; /* Remove box shadow when using mouse */
}

.section-header:focus-visible {
  box-shadow: 0 0 0 2px rgba(76, 110, 245, 0.3);
}

/* Protect content from being dragged */
.model-sidebar.dragging * {
  user-select: none;
}

/* Dark mode styling */
.app.dark-mode .section-header {
  border-color: var(--color-border, #2d2d2d);
  background-color: var(--color-background, #1e1e1e);
}

.app.dark-mode .model-files-section {
  background-color: var(--color-background, #1e1e1e);
}

.app.dark-mode .header-title {
  color: var(--color-text-strong, #e0e0e0);
}

.app.dark-mode .toggle-icon {
  color: var(--color-text-light, #8b95a3);
}

.app.dark-mode .toggle-icon:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--color-text-strong, #e0e0e0);
}

.app.dark-mode .model-files-section {
  border-color: var(--color-border, #2d2d2d);
}

.app.dark-mode .file-actions {
  border-color: var(--color-border, #2d2d2d);
}

.app.dark-mode .action-btn {
  background-color: var(--color-background, #1e1e1e);
  border-color: var(--color-border, #2d2d2d);
  color: var(--color-text, #cccccc);
}

.app.dark-mode .action-btn:hover {
  background-color: var(--color-hover, rgba(76, 110, 245, 0.1));
  color: var(--color-primary, #4c6ef5);
  border-color: rgba(76, 110, 245, 0.3);
}

.app.dark-mode .folder-btn {
  color: var(--color-secondary, #818cf8);
}

.app.dark-mode .folder-btn:hover {
  color: var(--color-secondary-lighter, #a5b4fc);
  background-color: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.3);
}

/* Universal Add Button styles */
.universal-add-button {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 20;
}

.universal-add-button.bottom-collapsed {
  bottom: 60px; /* Adjusted to account for collapsed header */
}

.add-button-wrapper {
  position: relative;
}

.add-button {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: var(--color-primary, #4c6ef5);
  color: white;
  border: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.add-button:hover {
  background-color: var(--color-primary-darker, #405cd6);
  transform: scale(1.05);
}

.add-icon {
  font-size: 24px;
  line-height: 1;
}

.add-menu {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 8px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  width: 160px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  color: var(--color-text, #334155);
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: var(--color-hover, rgba(76, 110, 245, 0.08));
  color: var(--color-primary, #4c6ef5);
}

.menu-item svg {
  color: var(--color-text-light, #64748b);
}

.menu-item:hover svg {
  color: var(--color-primary, #4c6ef5);
}

/* Dark mode styles for add button */
.app.dark-mode .add-button {
  background-color: var(--color-primary, #4c6ef5);
}

.app.dark-mode .add-button:hover {
  background-color: var(--color-primary-lighter, #6c8ff8);
}

.app.dark-mode .add-menu {
  background-color: var(--color-background, #1e1e1e);
  border: 1px solid var(--color-border, #2d2d2d);
}

.app.dark-mode .menu-item {
  color: var(--color-text, #cccccc);
  border-bottom: 1px solid var(--color-border, #2d2d2d);
}

.app.dark-mode .menu-item:last-child {
  border-bottom: none;
}

.app.dark-mode .menu-item:hover {
  background-color: var(--color-hover, rgba(76, 110, 245, 0.1));
  color: var(--color-primary, #4c6ef5);
}
</style>
