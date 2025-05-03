<template>
  <div class="folder-tree">
    <TreeNode
      :node="treeData"
      :depth="0"
      :selected-node-id="selectedNodeId"
      :renaming-node-id="renamingNodeId"
      @select-node="handleSelectNode"
      @request-rename="handleRequestRename"
      @update-node-name="handleUpdateNodeName"
      @node-dragged="handleNodeDragged"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import TreeNode from './TreeNode.vue';

const props = defineProps({
  // 树数据，包含层级结构的节点信息
  data: {
    type: Object,
    required: true,
  },
  // 是否允许拖拽排序
  allowDrag: {
    type: Boolean,
    default: true,
  },
  // 是否允许重命名
  allowRename: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits([
  'update:data',
  'node-select',
  'node-rename',
  'node-expand',
  'node-collapse',
  'node-drag',
]);

// 内部状态
const selectedNodeId = ref(null);
const renamingNodeId = ref(null);
const treeData = ref(props.data);

// 监听外部传入的数据变化
watch(
  () => props.data,
  (newValue) => {
    treeData.value = newValue;
  },
  { deep: true }
);

// 处理节点选择
const handleSelectNode = (node) => {
  selectedNodeId.value = node.id;
  emit('node-select', node);
};

// 处理重命名请求
const handleRequestRename = (node) => {
  if (!props.allowRename) return;

  if (node) {
    renamingNodeId.value = node.id;
  } else {
    renamingNodeId.value = null;
  }
};

// 处理节点重命名
const handleUpdateNodeName = (nodeId, newName) => {
  // 查找并更新节点名称
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

  // 向父组件发出更新信号
  emit('update:data', treeData.value);
  emit('node-rename', { id: nodeId, name: newName });
};

// 处理拖拽事件
const handleNodeDragged = (payload) => {
  if (!props.allowDrag) return;

  // 向父组件发出拖拽完成信号
  emit('update:data', treeData.value);
  emit('node-drag', payload);
};

// 向外部暴露的方法
const selectNode = (nodeId) => {
  selectedNodeId.value = nodeId;
};

const startRename = (nodeId) => {
  if (props.allowRename) {
    renamingNodeId.value = nodeId;
  }
};

const expandAll = () => {
  const setExpandedState = (node, state) => {
    if (node.type === 'folder') {
      node.expanded = state;
      if (node.children) {
        node.children.forEach((child) => setExpandedState(child, state));
      }
    }
  };

  setExpandedState(treeData.value, true);
  emit('update:data', treeData.value);
};

const collapseAll = () => {
  const setExpandedState = (node, state) => {
    if (node.type === 'folder') {
      node.expanded = state;
      if (node.children) {
        node.children.forEach((child) => setExpandedState(child, state));
      }
    }
  };

  setExpandedState(treeData.value, false);
  emit('update:data', treeData.value);
};

// 暴露方法给父组件
defineExpose({
  selectNode,
  startRename,
  expandAll,
  collapseAll,
});
</script>

<style scoped>
.folder-tree {
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: white;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 8px;
  box-sizing: border-box;
}

/* 禁用拖拽时的样式 */
.folder-tree.no-drag {
  cursor: default;
}

/* 当树为空时的样式 */
.folder-tree-empty {
  padding: 20px;
  text-align: center;
  color: #999;
  font-style: italic;
}
</style>
