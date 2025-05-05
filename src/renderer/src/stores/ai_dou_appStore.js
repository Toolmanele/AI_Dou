import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'

export const useAiDouAppStore = defineStore('aiDouApp', {
  state: () => ({
    apps: [],
    currentAppId: null
  }),
  getters: {
    currentApp: (state) => {
      return state.apps.find((app) => app.id === state.currentAppId)
    }
  },
  actions: {
    addApp(app) {
      this.apps.push(app)
    },
    setCurrentApp(appId) {
      this.currentAppId = appId
    },
    updateApp(appId, updates) {
      const index = this.apps.findIndex((app) => app.id === appId)
      if (index !== -1) {
        this.apps[index] = { ...this.apps[index], ...updates }
      }
    },
    deleteApp(appId) {
      this.apps = this.apps.filter((app) => app.id !== appId)
    }
  }
})
