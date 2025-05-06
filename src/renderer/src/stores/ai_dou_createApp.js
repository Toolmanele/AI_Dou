import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { appDataTemplate, pythonEnvTemplate, pytorchSource, pipSource } from './templateData'
export default defineStore('aiDouCreateApp', {
  state: () => ({
    creatingApp: {}
  }),
  getters: {},
  actions: {
    resetApp() {
      this.creatingApp = {}
    },
    createApp(source) {
      this.creatingApp = {
        ...appDataTemplate,
        from: source
      }
      console.log('createApp', this.creatingApp)
    },
    setSource(type) {
      this.creatingApp.from = type
    },
    cancelCreateApp() {
      this.creatingApp = null
    }
  }
})
