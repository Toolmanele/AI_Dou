import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLogStore = defineStore('log', () => {
  const logs = ref([])
  const addLog = (log) => {
    logs.value.push(log)
  }
})
