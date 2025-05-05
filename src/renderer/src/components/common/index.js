import EditableField from './EditableField.vue'
import EditableFieldExample from './EditableFieldExample.vue'

export { EditableField, EditableFieldExample }

// For global registration
export default {
  install(app) {
    app.component('EditableField', EditableField)
    app.component('EditableFieldExample', EditableFieldExample)
  }
}
