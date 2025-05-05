<template>
  <div class="example-container">
    <h2>可编辑字段组件示例</h2>

    <div class="form-group">
      <label>姓名</label>
      <EditableField v-model="userData.name" placeholder="请输入姓名" emptyText="未设置姓名" />
    </div>

    <div class="form-group">
      <label>职位</label>
      <EditableField v-model="userData.position" placeholder="请输入职位" emptyText="未设置职位" />
    </div>

    <div class="form-group">
      <label>个人简介</label>
      <EditableField
        v-model="userData.bio"
        inputType="textarea"
        placeholder="请输入个人简介"
        rows="4"
        emptyText="未设置个人简介"
      />
    </div>

    <div class="form-group">
      <label>年龄 <span class="required">*</span></label>
      <EditableField
        v-model="userData.age"
        placeholder="请输入年龄"
        emptyText="未设置年龄"
        :error="ageError"
      />
      <div v-if="ageError" class="error-message">{{ ageError }}</div>
    </div>

    <div class="result-section">
      <h3>表单数据</h3>
      <pre>{{ userData }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { EditableField } from './index'

const userData = ref({
  name: '张三',
  position: '前端开发工程师',
  bio: '专注于Vue和Electron应用开发，热爱编程和设计。',
  age: ''
})

const ageError = computed(() => {
  if (!userData.value.age) {
    return '年龄不能为空'
  }
  if (isNaN(userData.value.age) || userData.value.age <= 0) {
    return '请输入有效的年龄'
  }
  return ''
})
</script>

<style scoped>
.example-container {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

h2 {
  font-size: 18px;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.required {
  color: #e53e3e;
  margin-left: 2px;
}

.error-message {
  color: #e53e3e;
  font-size: 13px;
  margin-top: 4px;
}

.result-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

h3 {
  font-size: 16px;
  margin-bottom: 10px;
}

pre {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow: auto;
}
</style>
