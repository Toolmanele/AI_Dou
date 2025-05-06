import EditableField from './EditableField.vue'
import EditableFieldExample from './EditableFieldExample.vue'
import Tooltip from './Tooltip.vue'
import FieldHint from './FieldHint.vue'
import FieldHintExample from './FieldHintExample.vue'
import Tips from './Tips.vue'
export { EditableField, EditableFieldExample, Tooltip, FieldHint, FieldHintExample, Tips }

// For global registration
export default {
  install(app) {
    app.component('EditableField', EditableField)
    app.component('EditableFieldExample', EditableFieldExample)
    app.component('Tooltip', Tooltip)
    app.component('FieldHint', FieldHint)
    app.component('FieldHintExample', FieldHintExample)
    app.component('Tips', Tips)
  }
}
