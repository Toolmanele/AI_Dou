<script setup>
import { ref, computed } from 'vue'

// Props for receiving the app data
const props = defineProps({
  app: {
    type: Object,
    required: true
  }
})

// Emits for closing modal and saving changes
const emit = defineEmits(['close', 'save'])

// Create a copy of the app data for editing
const editedApp = ref({ ...props.app })

// For handling the tags input
const tagsInput = ref(editedApp.value.tags ? editedApp.value.tags.join(', ') : '')

// Function to update tags when input changes
const updateTags = () => {
  editedApp.value.tags = tagsInput.value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag)
}

// Function to save changes
const saveChanges = () => {
  // Make sure tags are updated before saving
  updateTags()
  emit('save', editedApp.value)
}

// Function to close without saving
const cancelChanges = () => {
  emit('close')
}

// Configuration steps and their status
const configSteps = computed(() => [
  {
    id: 'setup',
    name: 'Environment Setup',
    description: 'Configure the application environment',
    isComplete: ['pip', 'model', 'completed'].includes(editedApp.value.status),
    isActive: editedApp.value.status === 'setup',
    icon: '🛠️'
  },
  {
    id: 'pip',
    name: 'Package Installation',
    description: 'Install required packages and dependencies',
    isComplete: ['model', 'completed'].includes(editedApp.value.status),
    isActive: editedApp.value.status === 'pip',
    icon: '📦'
  },
  {
    id: 'model',
    name: 'Model Configuration',
    description: 'Set up and configure models',
    isComplete: editedApp.value.status === 'completed',
    isActive: editedApp.value.status === 'model',
    icon: '🧠'
  },
  {
    id: 'completed',
    name: 'Completed',
    description: 'Configuration complete and ready to use',
    isComplete: editedApp.value.status === 'completed',
    isActive: editedApp.value.status === 'completed',
    icon: '✅'
  }
])

// Update the app status
const updateStatus = (stepId) => {
  // Only allow moving to the next step or any previous step
  const currentStepIndex = configSteps.value.findIndex((step) => step.id === editedApp.value.status)
  const newStepIndex = configSteps.value.findIndex((step) => step.id === stepId)

  if (newStepIndex <= currentStepIndex + 1) {
    editedApp.value.status = stepId

    // Update progress percentage based on the step
    switch (stepId) {
      case 'setup':
        editedApp.value.setupProgress = 25
        break
      case 'pip':
        editedApp.value.setupProgress = 50
        break
      case 'model':
        editedApp.value.setupProgress = 75
        break
      case 'completed':
        editedApp.value.setupProgress = 100
        break
    }
  }
}

// Function to handle file path selection
const selectFilePath = () => {
  // In a real application, this would open a file dialog
  // For now, we'll just simulate it with a prompt
  const newPath = prompt('Enter file path:', editedApp.value.filePath)
  if (newPath) {
    editedApp.value.filePath = newPath
  }
}
</script>

<template>
  <div class="config-modal">
    <div class="config-modal-header">
      <h2>Configure App</h2>
      <button class="close-button" @click="cancelChanges" title="Close">×</button>
    </div>

    <div class="config-modal-content">
      <div class="config-form">
        <div class="form-section">
          <h3>App Details</h3>
          <div class="form-group">
            <label for="app-name">Name</label>
            <input
              type="text"
              id="app-name"
              v-model="editedApp.name"
              placeholder="Enter app name"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label for="app-description">Description</label>
            <textarea
              id="app-description"
              v-model="editedApp.description"
              placeholder="Enter app description"
              class="form-control"
              :rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="app-tags">Tags (comma separated)</label>
            <input
              type="text"
              id="app-tags"
              v-model="tagsInput"
              placeholder="Enter tags"
              class="form-control"
              @blur="updateTags"
            />
          </div>

          <div class="form-group">
            <label for="app-file-path">File Path</label>
            <div class="file-path-input">
              <input
                type="text"
                id="app-file-path"
                v-model="editedApp.filePath"
                placeholder="Select file path"
                class="form-control"
                readonly
              />
              <button class="browse-button" @click="selectFilePath">Browse</button>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>Configuration Status</h3>
          <div class="config-progress">
            <div class="progress-bar-container">
              <div
                class="progress-bar-fill"
                :style="{ width: `${editedApp.setupProgress}%` }"
                :class="editedApp.status"
              ></div>
              <div class="progress-steps">
                <div
                  v-for="(step, index) in configSteps"
                  :key="step.id"
                  class="progress-step"
                  :class="{
                    completed: step.isComplete,
                    active: step.isActive,
                    clickable: index <= configSteps.findIndex((s) => s.id === editedApp.status) + 1
                  }"
                  @click="updateStatus(step.id)"
                  :style="{
                    left: `${(index * 100) / (configSteps.length - 1)}%`
                  }"
                  :title="step.name"
                >
                  <div class="step-icon">{{ step.icon }}</div>
                  <div class="step-label">{{ step.name }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="config-steps">
            <div
              v-for="step in configSteps"
              :key="step.id"
              class="config-step-card"
              :class="{
                completed: step.isComplete,
                active: step.isActive
              }"
            >
              <div class="step-header">
                <div class="step-icon">{{ step.icon }}</div>
                <div class="step-info">
                  <h4>{{ step.name }}</h4>
                  <p>{{ step.description }}</p>
                </div>
                <div class="step-status">
                  <span v-if="step.isComplete" class="status-complete">✓ Complete</span>
                  <span v-else-if="step.isActive" class="status-active">In Progress</span>
                  <span v-else class="status-pending">Pending</span>
                </div>
              </div>

              <div v-if="step.isActive" class="step-actions">
                <button
                  class="action-button primary"
                  @click="
                    updateStatus(configSteps[configSteps.findIndex((s) => s.id === step.id) + 1].id)
                  "
                  :disabled="
                    configSteps.findIndex((s) => s.id === step.id) === configSteps.length - 1
                  "
                >
                  {{ step.id === 'completed' ? 'Finalize' : 'Complete Step' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="config-modal-footer">
      <button class="cancel-button" @click="cancelChanges">Cancel</button>
      <button class="save-button" @click="saveChanges">Save Changes</button>
    </div>
  </div>
</template>

<style scoped>
.config-modal {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 90vh;
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
}

.config-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.config-modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #64748b;
  cursor: pointer;
  width: 2rem;
  /* height: 2rem; */
  display: flex;
  align-items: center;
  justify-content: center;
  /* border-radius: 50%; */
  transition: all 0.2s;
}

.close-button:hover {
  background-color: #f1f5f9;
  color: #334155;
}

.config-modal-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  background-color: #f8fafc;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.form-section h3 {
  margin-top: 0;
  margin-bottom: 1.2rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #334155;
}

.form-group {
  margin-bottom: 1.2rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #475569;
  font-size: 0.9rem;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.2s;
  outline: none;
}

.form-control:focus {
  border-color: #4c6ef5;
  box-shadow: 0 0 0 2px rgba(76, 110, 245, 0.1);
}

.file-path-input {
  display: flex;
  gap: 0.5rem;
}

.browse-button {
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0 1rem;
  color: #475569;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.browse-button:hover {
  background-color: #e2e8f0;
}

.config-progress {
  margin-bottom: 2rem;
}

.progress-bar-container {
  position: relative;
  height: 8px;
  background-color: #e2e8f0;
  border-radius: 4px;
  margin: 3rem 0;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-bar-fill.setup {
  background-color: #f59e0b;
}

.progress-bar-fill.pip {
  background-color: #3b82f6;
}

.progress-bar-fill.model {
  background-color: #8b5cf6;
}

.progress-bar-fill.completed {
  background-color: #10b981;
}

.progress-steps {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
}

.progress-step {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 2.5rem;
  height: 2.5rem;
  background-color: white;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  z-index: 10;
  transition: all 0.3s;
}

.progress-step .step-icon {
  font-size: 1rem;
}

.progress-step .step-label {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
}

.progress-step.completed {
  border-color: #10b981;
  background-color: #10b981;
  color: white;
}

.progress-step.active {
  border-color: #4c6ef5;
  box-shadow: 0 0 0 2px rgba(76, 110, 245, 0.2);
  transform: translate(-50%, -50%) scale(1.1);
}

.progress-step.clickable {
  cursor: pointer;
}

.progress-step.clickable:hover {
  box-shadow: 0 0 0 2px rgba(76, 110, 245, 0.3);
}

.config-steps {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.config-step-card {
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 1rem;
  transition: all 0.3s;
}

.config-step-card.completed {
  border-color: #d1fae5;
  background-color: #f0fdfa;
}

.config-step-card.active {
  border-color: #dbeafe;
  background-color: #eff6ff;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

.step-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.step-header .step-icon {
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  background-color: #f8fafc;
  border-radius: 8px;
  flex-shrink: 0;
}

.config-step-card.completed .step-icon {
  background-color: #d1fae5;
}

.config-step-card.active .step-icon {
  background-color: #dbeafe;
}

.step-info {
  flex-grow: 1;
}

.step-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.step-info p {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
}

.step-status {
  font-size: 0.85rem;
  font-weight: 500;
}

.status-complete {
  color: #10b981;
}

.status-active {
  color: #4c6ef5;
}

.status-pending {
  color: #94a3b8;
}

.step-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}

.action-button {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.action-button.primary {
  background-color: #4c6ef5;
  color: white;
}

.action-button.primary:hover {
  background-color: #4361d0;
}

.action-button.primary:disabled {
  background-color: #cbd5e1;
  cursor: not-allowed;
}

.config-modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-button {
  padding: 0.7rem 1.2rem;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background-color: white;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.cancel-button:hover {
  background-color: #f8fafc;
  border-color: #cbd5e1;
}

.save-button {
  padding: 0.7rem 1.2rem;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background-color: #4c6ef5;
  border: 1px solid #4c6ef5;
  color: white;
}

.save-button:hover {
  background-color: #4361d0;
}

@media (max-width: 768px) {
  .config-modal-content {
    padding: 1rem;
  }

  .form-section {
    padding: 1rem;
  }

  .step-header {
    flex-direction: column;
    text-align: center;
  }

  .step-header .step-icon {
    margin: 0 auto 0.5rem auto;
  }

  .step-status {
    margin-top: 0.5rem;
  }
}
</style>
