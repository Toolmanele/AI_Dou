# Tooltip Components

This folder contains reusable tooltip and hint components for a cleaner UI with contextual help that appears only when needed.

## Components

### Tooltip

A basic tooltip that appears on hover.

#### Props

- `showOnHover` (Boolean): Controls whether tooltip shows on hover. Default: `true`
- `position` (String): Position of tooltip relative to target element. Options: `top`, `right`, `bottom`, `left`. Default: `top`
- `tooltipClass` (String): Additional CSS classes to apply to the tooltip. Default: `''`

#### Slots

- Default slot: Content that users hover over to trigger the tooltip
- `content` slot: Content to show inside the tooltip

#### Example

```vue
<tooltip position="top">
  Hover over me
  <template #content>
    This is a tooltip content
  </template>
</tooltip>
```

### FieldHint

A specialized component for form field labels with hint tooltips. The hint tooltip appears when users hover over the label itself.

#### Props

- `hint` (String): The hint text to display in the tooltip. Default: `''`
- `required` (Boolean): Whether the field is required. Default: `false`
- `position` (String): Position of tooltip relative to the label. Options: `top`, `right`, `bottom`, `left`. Default: `right`

#### Slots

- Default slot: The label text

#### Example

```vue
<field-hint hint="选择包含应用代码的本地文件夹" position="right">
  文件夹路径 <span class="required">*</span>
</field-hint>
<input type="text" placeholder="选择文件夹..." />
```

## Styling

The components come with a default style, but you can customize them using CSS:

### Example: Custom Tooltip Appearance

```css
.tooltip-container :deep(.tooltip) {
  background-color: #2c3e50;
  color: white;
  font-size: 12px;
}
```

## Best Practices

1. Keep hints concise and relevant to the field
2. Use tooltips sparingly to avoid cluttering the UI
3. For important information, consider making it always visible
4. For complex help content, consider linking to a more detailed help section
5. Right position is recommended for field hints to show contextual information in a horizontal layout
