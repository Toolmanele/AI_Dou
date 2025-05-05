import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@stores': resolve('src/renderer/src/stores'),
        '@services': resolve('src/renderer/src/services'),
        '@components': resolve('src/renderer/src/components'),
        '@common': resolve('src/renderer/src/components/common')
      }
    },
    plugins: [vue()]
  }
})
