import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { appDataTemplate, pythonEnvTemplate, pytorchSource, pipSource } from './templateData'
export const useAiDouCreateAppStore = defineStore('aiDouCreateApp', {
  state: () => ({
    creatingApp: null
  }),
  getters: {},
  actions: {
    createApp(type) {
      let id = uuidv4()
      let appName = ''
      let appFolderPath = ''
      if (type === 'folder') {
        // check folder path,并返回 basename
        appName = await window.electronAPI.getFolderBasename(appFolderPath)
      }
      this.creatingApp = {
        ...appDataTemplate,
        id,
        pythonEnvironments: [...pythonEnvTemplate]
      }
    },
    cancelCreateApp() {
      this.creatingApp = null
    }
  }
})
