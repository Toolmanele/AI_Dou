<template>
  <div
    class="tree-node"
    :class="{
      selected: isSelected,
      'is-folder': node.type === 'folder',
      'no-drag': disableDrag,
      'no-rename': disableRename,
    }"
  >
    <div
      class="node-content"
      :style="{ paddingLeft: `${depth * 16}px` }"
      @click.stop="handleClick"
    >
      <!-- 移除三角形图标及占位符 -->

      <!-- 文件夹图标带有展开/折叠功能 -->
      <span
        class="icon"
        @click.stop="handleIconClick"
        :class="{ 'folder-icon': node.type === 'folder' }"
      >
        {{ node.type === 'folder' ? (isExpanded ? '📂' : '📁') : '📄' }}
      </span>

      <!-- Name or Input for Renaming -->
      <div class="name-container">
        <span v-if="!isRenaming" class="node-name" @dblclick.stop="startRename">
          {{ node.name }}
        </span>
        <div v-else class="input-wrapper">
          <input
            ref="renameInput"
            type="text"
            v-model="newName"
            @blur="finishRename"
            @keyup.enter="finishRename"
            @keyup.esc="cancelRename"
            @click.stop
            @dblclick.stop
            class="rename-input"
          />
        </div>
      </div>
    </div>

    <!-- Children (Recursive) -->
    <div v-if="node.type === 'folder' && isExpanded" class="node-children">
      <draggable
        v-if="!disableDrag"
        :list="node.children"
        item-key="id"
        group="nodes"
        :animation="150"
        ghost-class="ghost"
        @end="onDragEnd"
        @start="onDragStart"
        @choose="onDragChoose"
        handle=".node-content"
        :component-data="{ style: 'min-height: 10px;' }"
      >
        <template #item="{ element: childNode }">
          <TreeNode
            :node="childNode"
            :depth="depth + 1"
            :selected-node-id="selectedNodeId"
            :renaming-node-id="renamingNodeId"
            :disable-drag="disableDrag"
            :disable-rename="disableRename"
            @select-node="emitSelectNode"
            @request-rename="emitRequestRename"
            @update-node-name="emitUpdateNodeName"
            @node-dragged="(payload) => $emit('node-dragged', payload)"
          />
        </template>
        <template #footer>
          <!-- Drop zone visual cue only shown when empty and during drag -->
          <div
            v-if="(!node.children || node.children.length === 0) && isDragging"
            class="empty-folder-dropzone"
            :style="{ paddingLeft: `${(depth + 1) * 16}px` }"
          >
            Drop here
          </div>
        </template>
      </draggable>

      <!-- 如果禁用拖拽，则直接渲染子节点，不使用 draggable -->
      <template v-else>
        <TreeNode
          v-for="childNode in node.children"
          :key="childNode.id"
          :node="childNode"
          :depth="depth + 1"
          :selected-node-id="selectedNodeId"
          :renaming-node-id="renamingNodeId"
          :disable-drag="disableDrag"
          :disable-rename="disableRename"
          @select-node="emitSelectNode"
          @request-rename="emitRequestRename"
          @update-node-name="emitUpdateNodeName"
          @node-dragged="(payload) => $emit('node-dragged', payload)"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import draggable from 'vuedraggable';

// Make sure to register draggable as a component
defineOptions({
  name: 'TreeNode',
  components: {
    draggable,
  },
});

const props = defineProps({
  node: {
    type: Object,
    required: true,
  },
  depth: {
    type: Number,
    default: 0,
  },
  selectedNodeId: {
    type: [String, Number, null],
    default: null,
  },
  renamingNodeId: {
    type: [String, Number, null],
    default: null,
  },
  // 是否禁用拖拽
  disableDrag: {
    type: Boolean,
    default: false,
  },
  // 是否禁用重命名
  disableRename: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'select-node',
  'request-rename',
  'update-node-name',
  'node-dragged',
]);

// 使用节点自身的 expanded 属性，如果没有则默认展开文件夹
const isExpanded = ref(
  props.node.expanded !== undefined
    ? props.node.expanded
    : props.node.type === 'folder'
);

const newName = ref(props.node.name);
const renameInput = ref(null); // Ref for the input element
const isDragging = ref(false); // Track if drag operation is active

const isSelected = computed(() => props.selectedNodeId === props.node.id);
const isRenaming = computed(() => props.renamingNodeId === props.node.id);

// --- Methods ---

const emitSelectNode = (node) => {
  emit('select-node', node);
};

const emitRequestRename = (node) => {
  if (props.disableRename) return;
  emit('request-rename', node);
};

const emitUpdateNodeName = (nodeId, name) => {
  emit('update-node-name', nodeId, name);
};

const handleClick = () => {
  // Prevent selection interfering with rename finishing
  if (!isRenaming.value) {
    emitSelectNode(props.node);
  }
};

const handleIconClick = () => {
  // 处理图标点击，同时展开/折叠并选中节点
  if (props.node.type === 'folder') {
    toggleExpand();
  }
  // 同时选中节点（除非正在重命名）
  if (!isRenaming.value) {
    emitSelectNode(props.node);
  }
};

const startRename = () => {
  if (props.disableRename) return;
  if (isRenaming.value) return; // Already renaming this node
  newName.value = props.node.name; // Reset input value
  emitRequestRename(props.node);
};

const finishRename = () => {
  if (!isRenaming.value) return;
  const trimmedName = newName.value.trim();
  if (trimmedName && trimmedName !== props.node.name) {
    emitUpdateNodeName(props.node.id, trimmedName);
  } else {
    // If name is empty or unchanged, just cancel
    cancelRename(false); // false indicates don't reset input visually yet
    emitRequestRename(null); // Explicitly clear renaming state
  }
};

const cancelRename = (resetValue = true) => {
  if (resetValue) {
    newName.value = props.node.name; // Reset visually if needed
  }
  emitRequestRename(null); // Tell parent to stop renaming mode
};

const toggleExpand = () => {
  if (props.node.type === 'folder') {
    isExpanded.value = !isExpanded.value;
    // 更新节点自身的 expanded 属性，以便于状态持久化
    if (props.node.expanded !== undefined) {
      props.node.expanded = isExpanded.value;
    }
  }
};

// Simple drag handlers without complex animation handling
const onDragStart = (event) => {
  if (props.disableDrag) return;
  isDragging.value = true;
  // Add a class to the main container to disable transitions
  document.querySelector('.folder-tree')?.classList.add('dragging');
};

const onDragEnd = (event) => {
  if (props.disableDrag) return;
  // Emit the event for parent handling
  emit('node-dragged', { event, node: props.node });

  // Remove the class that disabled transitions
  document.querySelector('.folder-tree')?.classList.remove('dragging');
  isDragging.value = false;
};

const onDragChoose = (event) => {
  if (props.disableDrag) return;
  // 获取被选中的元素并发出选择事件
  // Vuedraggable 在 choose 事件中暴露了被选中的元素
  const draggedNode = props.node.children[event.oldIndex];
  if (draggedNode) {
    emitSelectNode(draggedNode);
  }
};

// Update this function for better width calculation
const calculateInputWidth = () => {
  // Match width to container width to avoid layout shifts
  return '100%';
};

// --- Watchers ---

// Update the watcher for renaming state
watch(isRenaming, async (newValue) => {
  if (newValue) {
    await nextTick(); // Wait for the DOM to update
    if (renameInput.value) {
      renameInput.value.focus();
      renameInput.value.select();
    }
  }
});

// Update internal newName if node name changes externally (e.g., after save)
watch(
  () => props.node.name,
  (newValue) => {
    newName.value = newValue;
  }
);

// Watch for external changes to the node's expanded state
watch(
  () => props.node.expanded,
  (newValue) => {
    if (newValue !== undefined && newValue !== isExpanded.value) {
      isExpanded.value = newValue;
    }
  }
);
</script>

<style scoped>
.tree-node {
  /* cursor: pointer; */ /* Handled by content */
}

.node-content {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  white-space: nowrap; /* Prevent name wrapping */
  position: relative; /* Added for absolute positioning of input */
  min-height: 32px; /* Ensure consistent height */
  margin-bottom: 2px; /* 增加节点之间的间距，使结构更清晰 */
}

.node-content:hover {
  background-color: #f0f0f0;
}

.tree-node.selected > .node-content {
  background-color: #dbeafe; /* Light blue */
  font-weight: bold;
}

/* 移除三角形图标和占位符相关样式 */
.toggle-icon,
.spacer-icon {
  display: none; /* 隐藏这些元素，但保留样式以防需要恢复 */
}

.icon {
  margin-right: 8px; /* 增加右侧边距，与文本保持适当距离 */
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px; /* 固定宽度确保对齐 */
  height: 24px; /* 固定高度确保对齐 */
  text-align: center;
  font-size: 16px; /* 调整图标大小 */
}

.folder-icon {
  cursor: pointer; /* 为文件夹图标添加指针样式 */
  transition: transform 0.1s ease, color 0.1s ease; /* 添加颜色变换动画 */
}

.folder-icon:hover {
  transform: scale(1.1); /* 悬停时略微放大 */
  color: #4caf50; /* 悬停时颜色变化，提供更明显的视觉反馈 */
}

.name-container {
  flex-grow: 1;
  position: relative;
  min-width: 100px; /* Ensure enough space for editing */
  height: 24px; /* Set fixed height */
  overflow: visible; /* Allow input to overflow if needed */
  display: flex; /* Use flex to align content */
  align-items: center; /* Center content vertically */
}

.node-name {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 2px 4px;
  box-sizing: border-box;
  line-height: 20px; /* Exact line height */
  display: block; /* Block display */
}

.input-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0; /* Ensure it doesn't extend beyond container */
  bottom: 0; /* Ensure it doesn't extend beyond container */
  z-index: 10; /* Ensure it appears above other elements */
  display: flex; /* Use flex to align content */
  align-items: center; /* Center content vertically */
}

.rename-input {
  width: 100%;
  padding: 1px 3px; /* Slightly smaller to account for border */
  border: 1px solid #ccc;
  border-radius: 3px;
  font: inherit;
  box-sizing: border-box;
  height: 22px; /* Slightly smaller to avoid overflow */
  line-height: 20px; /* Same line height as node-name */
  outline: none;
  margin: 0 4px; /* Match padding of node-name */
  background-color: white; /* Ensure it covers text */
}

.node-children {
  /* Indentation is handled by paddingLeft on child node-content */
}

/* Style for the visual ghost element during drag */
.ghost {
  opacity: 0.5;
  background: #c8ebfb;
  border: 1px dashed #3b82f6;
}

/* Disable transitions for items while dragging */
.dragging .tree-node {
  transition: none !important;
}

/* Style for the drop zone hint in empty folders */
.empty-folder-dropzone {
  padding: 10px 8px;
  color: #aaa;
  font-style: italic;
  font-size: 0.9em;
  min-height: 10px; /* Ensure it's droppable */
  /* border: 1px dashed #ddd; */ /* Optional border */
  margin-top: 2px;
  margin-bottom: 2px;
  border-radius: 4px;
}

/* 禁用拖拽时的样式 */
.no-drag .node-content {
  cursor: default;
}

.no-drag .folder-icon {
  cursor: pointer; /* 确保文件夹图标仍然可点击用于展开/折叠 */
}

/* 禁用重命名时的样式 */
.no-rename .node-name {
  cursor: default;
}
</style>
