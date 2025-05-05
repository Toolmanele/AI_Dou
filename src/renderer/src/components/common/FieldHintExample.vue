<template>
  <div class="field-hint-example">
    <h2>Field Hint Examples</h2>

    <div class="example-section">
      <h3>Field with Hover on Label (Right)</h3>
      <field-hint hint="选择包含应用代码的本地文件夹" position="right">
        文件夹路径 <span class="required">*</span>
      </field-hint>
      <input type="text" placeholder="选择文件夹..." />
    </div>

    <div class="example-section">
      <h3>Field with Hover on Label (Top)</h3>
      <field-hint hint="输入有效的GitHub仓库地址" position="top">
        GitHub 仓库 <span class="required">*</span>
      </field-hint>
      <input type="text" placeholder="https://github.com/username/repo" />
    </div>

    <div class="example-section">
      <h3>Hint with Optional Field (Bottom)</h3>
      <field-hint hint="如果需要，可以提供自定义名称" position="bottom"> 应用名称 </field-hint>
      <input type="text" placeholder="应用名称..." />
    </div>

    <div class="example-section">
      <h3>Field with Hover on Label (Right - Horizontal)</h3>
      <field-hint hint="选择本地应用代码文件夹" position="right">
        文件夹路径 <span class="required">*</span>
      </field-hint>
      <input type="text" placeholder="选择文件夹..." />
    </div>

    <div class="example-section">
      <h3>Usage Example Code</h3>
      <pre>
&lt;field-hint hint="选择包含应用代码的本地文件夹" position="right"&gt;
  文件夹路径 &lt;span class="required"&gt;*&lt;/span&gt;
&lt;/field-hint&gt;
&lt;input type="text" placeholder="选择文件夹..." /&gt;
      </pre>
    </div>
  </div>
</template>

<script>
import FieldHint from './FieldHint.vue'

export default {
  name: 'FieldHintExample',
  components: {
    FieldHint
  }
}
</script>

<style scoped>
.field-hint-example {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.example-section {
  margin-bottom: 30px;
  padding: 15px;
  border: 1px solid #eaeaea;
  border-radius: 8px;
}

h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #555;
  font-size: 18px;
}

input {
  display: block;
  width: 100%;
  margin-top: 8px;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.required {
  color: #ff5252;
}

pre {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.5;
}
</style>
