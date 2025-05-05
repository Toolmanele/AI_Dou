import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'

export const useBotStore = defineStore('bot', {
  state: () => ({
    bots: [],
    currentBotId: null,
    conversations: {} // Map: botId -> messages[]
  }),

  getters: {
    // 当前选中的机器人
    currentBot: (state) => {
      if (!state.currentBotId) return null
      return state.bots.find((bot) => bot.id === state.currentBotId) || null
    }
  },

  actions: {
    // 设置当前机器人
    setCurrentBot(bot) {
      this.currentBotId = bot.id
    },

    // 添加新机器人
    addBot(bot) {
      const newBot = {
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...bot
      }
      this.bots.push(newBot)
      this.conversations[newBot.id] = []
      this.saveToLocalStorage()
      return newBot
    },

    // 更新机器人
    updateBot(id, updates) {
      const index = this.bots.findIndex((bot) => bot.id === id)
      if (index !== -1) {
        this.bots[index] = {
          ...this.bots[index],
          ...updates,
          updatedAt: new Date().toISOString()
        }
        this.saveToLocalStorage()
      }
    },

    // 删除机器人
    deleteBot(id) {
      this.bots = this.bots.filter((bot) => bot.id !== id)
      delete this.conversations[id]

      // 如果删除的是当前选中的机器人，设为null
      if (this.currentBotId === id) {
        this.currentBotId = this.bots.length ? this.bots[0].id : null
      }

      this.saveToLocalStorage()
    },

    // 获取某个机器人的对话历史
    getConversation(botId) {
      if (!this.conversations[botId]) {
        this.conversations[botId] = []
      }
      return this.conversations[botId]
    },

    // 添加消息到对话
    addMessage(botId, message) {
      if (!this.conversations[botId]) {
        this.conversations[botId] = []
      }
      this.conversations[botId].push(message)
      this.saveToLocalStorage()
    },

    // 清空对话
    clearConversation(botId) {
      if (this.conversations[botId]) {
        this.conversations[botId] = []
        this.saveToLocalStorage()
      }
    },

    // 获取格式化后的对话历史（用于API请求）
    getConversationHistory(botId) {
      if (!this.conversations[botId]) {
        return []
      }

      return this.conversations[botId].map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    },

    // 获取格式化后的Ollama对话历史（用于Ollama chat API）
    getOllamaConversationHistory(botId) {
      if (!this.conversations[botId]) {
        return []
      }

      return this.conversations[botId].map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    },

    // 获取Ollama上下文
    getOllamaContext(botId) {
      // 这里根据需要实现Ollama上下文管理
      return []
    },

    // 保存到本地存储
    saveToLocalStorage() {
      localStorage.setItem('bots', JSON.stringify(this.bots))
      localStorage.setItem('conversations', JSON.stringify(this.conversations))
      localStorage.setItem('currentBotId', this.currentBotId)
    },

    // 从本地存储加载
    loadFromLocalStorage() {
      try {
        const bots = localStorage.getItem('bots')
        const conversations = localStorage.getItem('conversations')
        const currentBotId = localStorage.getItem('currentBotId')

        if (bots) this.bots = JSON.parse(bots)
        if (conversations) this.conversations = JSON.parse(conversations)
        if (currentBotId) this.currentBotId = currentBotId
      } catch (error) {
        console.error('加载本地存储失败:', error)
      }
    },

    // 初始化默认机器人
    initializeDefaultBots() {
      // 只有在没有机器人的情况下添加默认机器人
      if (this.bots.length === 0) {
        // 添加一个默认API机器人
        this.addBot({
          name: '默认API机器人',
          description: '使用OpenAI API的聊天机器人',
          type: 'api',
          avatar: null,
          config: {
            apiEndpoint: 'https://api.openai.com/v1/chat/completions',
            apiKey: '',
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            systemPrompt: '你是一个有用的助手。'
          }
        })

        // 添加一个默认Ollama机器人
        this.addBot({
          name: '本地Ollama',
          description: '使用本地Ollama部署的聊天机器人',
          type: 'ollama',
          avatar: null,
          config: {
            ollamaEndpoint: 'http://localhost:11434',
            model: 'llama2',
            systemPrompt: '你是一个有用的助手。'
          }
        })

        // 添加一个翻译机器人
        this.addBot({
          name: '翻译助手',
          description: '专注于语言翻译的机器人',
          type: 'api',
          avatar: null,
          config: {
            apiEndpoint: 'https://api.openai.com/v1/chat/completions',
            apiKey: '',
            model: 'gpt-3.5-turbo',
            temperature: 0.3,
            systemPrompt:
              '你是一个专业的翻译助手。用户会输入文本，你需要将其翻译成目标语言。如果用户没有指定目标语言，请将文本翻译成英文。保持原文的格式和风格，确保翻译准确、自然。不要添加任何额外的解释，只返回翻译结果。'
          }
        })
      }
    }
  }
})
