# 通用组件

## EditableField 组件

一个可切换编辑状态的输入框组件，允许在查看模式和编辑模式之间切换。适用于表单中需要编辑的字段。

### 使用方法

```vue
<template>
  <div>
    <label>用户名</label>
    <EditableField v-model="username" placeholder="请输入用户名" emptyText="未设置" />

    <label>个人简介</label>
    <EditableField
      v-model="description"
      inputType="textarea"
      placeholder="请输入个人简介"
      rows="3"
      emptyText="未设置简介"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
// 如果已全局注册，则不需要此导入
// import { EditableField } from '@/components/common'

const username = ref('')
const description = ref('')
</script>
```

### 属性

| 属性名      | 类型           | 默认值   | 描述                                      |
| ----------- | -------------- | -------- | ----------------------------------------- |
| modelValue  | String, Number | ''       | 组件的值，使用 v-model 绑定               |
| inputType   | String         | 'input'  | 输入框类型，可选值：'input' 或 'textarea' |
| placeholder | String         | ''       | 输入框占位文本                            |
| emptyText   | String         | '未设置' | 当值为空时显示的文本                      |
| rows        | Number         | 3        | 当 inputType 为 'textarea' 时的行数       |
| error       | String         | ''       | 错误信息，如果有值则会显示错误样式        |
| editTitle   | String         | '编辑'   | 编辑按钮的提示文本                        |
| saveTitle   | String         | '保存'   | 保存按钮的提示文本                        |
| cancelTitle | String         | '取消'   | 取消按钮的提示文本                        |

### 事件

| 事件名            | 说明                                  |
| ----------------- | ------------------------------------- |
| update:modelValue | 当值变更时触发，用于 v-model 双向绑定 |

```

```
