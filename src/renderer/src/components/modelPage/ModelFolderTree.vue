<template>
  <div class="model-folder-tree">
    <div class="folder-tree-header">
      <div class="folder-actions">
        <!-- <button 
          @click="addNewFolder" 
          class="folder-action-btn" 
          title="添加新文件夹">
          <span>+</span>
        </button>
        <button 
          @click="toggleExpandAll" 
          class="folder-action-btn" 
          :title="allExpanded ? '全部折叠' : '全部展开'">
          <span>{{ allExpanded ? '↑' : '↓' }}</span>
        </button> -->
      </div>
    </div>
    
    <div class="folder-tree-container">
      <TreeNode
        v-if="treeData.children && treeData.children.length > 0"
        :node="treeData"
        :depth="0"
        :selected-node-id="selectedNodeId"
        :renaming-node-id="renamingNodeId"
        :disable-drag="false"
        :disable-rename="false"
        @select-node="handleSelectNode"
        @request-rename="handleRequestRename"
        @update-node-name="handleUpdateNodeName"
        @node-dragged="handleNodeDragged"
      />
      
      <!-- Empty state message -->
      <div v-if="!treeData.children || treeData.children.length === 0" class="empty-tree">
        <p>没有模型文件</p>
        <button @click="addNewFolder" class="add-folder-btn">添加文件夹</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import TreeNode from '../TreeNode.vue';
import draggable from 'vuedraggable';

// Define component options
defineOptions({
  name: 'ModelFolderTree',
  components: {
    TreeNode,
    draggable
  }
});

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      id: 'root',
      name: 'Models',
      type: 'folder',
      expanded: true,
      children: []
    })
  }
});

const emit = defineEmits([
  'select-node',
  'add-folder',
  'add-file',
  'update-tree'
]);

// Internal tree state
const treeData = ref(props.initialData);
const selectedNodeId = ref(null);
const renamingNodeId = ref(null);
const allExpanded = ref(true);

// Watch for external data changes
watch(() => props.initialData, (newValue) => {
  treeData.value = newValue;
}, { deep: true });

// Generate a unique ID
const generateId = () => `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

// Handle node selection
const handleSelectNode = (node) => {
  selectedNodeId.value = node.id;
  emit('select-node', node);
};

// Handle rename request
const handleRequestRename = (node) => {
  if (node) {
    renamingNodeId.value = node.id;
  } else {
    renamingNodeId.value = null;
  }
};

// Handle node rename
const handleUpdateNodeName = (nodeId, newName) => {
  // Find and update the node name recursively
  const updateNodeName = (tree, id, name) => {
    if (tree.id === id) {
      tree.name = name;
      return true;
    }
    if (tree.type === 'folder' && tree.children) {
      for (const child of tree.children) {
        if (updateNodeName(child, id, name)) {
          return true;
        }
      }
    }
    return false;
  };

  updateNodeName(treeData.value, nodeId, newName);
  renamingNodeId.value = null;
  
  // Emit updated tree
  emit('update-tree', treeData.value);
};

// Handle node drag
const handleNodeDragged = (payload) => {
  // Emit updated tree after drag
  emit('update-tree', treeData.value);
};

// Add a new folder to the root level
const addNewFolder = () => {
  const newFolderId = generateId();
  const newFolder = {
    id: newFolderId,
    name: "新文件夹",
    type: "folder",
    expanded: true,
    children: []
  };
  
  if (!treeData.value.children) {
    treeData.value.children = [];
  }
  
  treeData.value.children.push(newFolder);
  
  // Select and start renaming the new folder
  selectedNodeId.value = newFolderId;
  renamingNodeId.value = newFolderId;
  
  // Emit event
  emit('add-folder', newFolder);
  emit('update-tree', treeData.value);
};

// Toggle expand/collapse all folders
const toggleExpandAll = () => {
  const setExpandedState = (node, state) => {
    if (node.type === 'folder') {
      node.expanded = state;
      if (node.children) {
        node.children.forEach(child => setExpandedState(child, state));
      }
    }
  };
  
  allExpanded.value = !allExpanded.value;
  setExpandedState(treeData.value, allExpanded.value);
  emit('update-tree', treeData.value);
};

// Add a new file to the selected folder or root
const addNewFile = () => {
  // Find the target folder (selected folder or root)
  let targetFolder = treeData.value;
  
  if (selectedNodeId.value) {
    // Find selected node
    const findNode = (tree, id) => {
      if (tree.id === id) {
        return tree;
      }
      if (tree.children) {
        for (const child of tree.children) {
          const found = findNode(child, id);
          if (found) return found;
        }
      }
      return null;
    };
    
    const selectedNode = findNode(treeData.value, selectedNodeId.value);
    
    // If selected node is a folder, use it as target
    if (selectedNode && selectedNode.type === 'folder') {
      targetFolder = selectedNode;
      // Make sure the folder is expanded
      targetFolder.expanded = true;
    }
  }
  
  // Create new file
  const newFileId = generateId();
  const newFile = {
    id: newFileId,
    name: "新文件",
    type: "file"
  };
  
  // Add to target folder
  if (!targetFolder.children) {
    targetFolder.children = [];
  }
  
  targetFolder.children.push(newFile);
  
  // Select and start renaming the new file
  selectedNodeId.value = newFileId;
  renamingNodeId.value = newFileId;
  
  // Emit events
  emit('add-file', newFile, targetFolder);
  emit('update-tree', treeData.value);
};

// Expose methods to parent component
defineExpose({
  addNewFolder,
  addNewFile,
  selectNode: (nodeId) => {
    selectedNodeId.value = nodeId;
  }
});
</script>

<style scoped>
.model-folder-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.folder-tree-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0.5rem 0;
}

.folder-actions {
  display: flex;
  gap: 0.5rem;
}

.folder-action-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background, #f9fafc);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 4px;
  color: var(--color-text-light, #64748b);
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.folder-action-btn:hover {
  background: var(--color-hover, rgba(76, 110, 245, 0.08));
  color: var(--color-primary, #4c6ef5);
}

.folder-tree-container {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 0.5rem;
}

.empty-tree {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100px;
  padding: 1rem;
  color: var(--color-text-light, #64748b);
  text-align: center;
}

.empty-tree p {
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.add-folder-btn {
  padding: 0.5rem 1rem;
  background: var(--color-primary, #4c6ef5);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.add-folder-btn:hover {
  background: var(--color-primary-darker, #405cd6);
}

/* Support for drag and drop styling */
:deep(.ghost) {
  opacity: 0.5;
  background: #c8ebfb;
}

:deep(.tree-node.selected > .node-content) {
  background-color: var(--color-active, rgba(76, 110, 245, 0.12));
  color: var(--color-primary, #4c6ef5);
}

:deep(.tree-node .node-content:hover) {
  background-color: var(--color-hover, rgba(76, 110, 245, 0.08));
}

:deep(.tree-node .icon) {
  margin-right: 6px;
  cursor: pointer;
}

:deep(.tree-node .node-name) {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Scroll styling */
.folder-tree-container::-webkit-scrollbar {
  width: 4px;
}

.folder-tree-container::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.folder-tree-container::-webkit-scrollbar-track {
  background: transparent;
}

/* Dark mode styling */
.app.dark-mode .folder-action-btn {
  background: var(--color-background, #1e1e1e);
  border-color: var(--color-border, #2d2d2d);
  color: var(--color-text-light, #8b95a3);
}

.app.dark-mode .folder-action-btn:hover {
  background: var(--color-hover, rgba(76, 110, 245, 0.1));
  color: var(--color-primary, #4c6ef5);
}
</style> 