// electronStore.js - Service for handling Electron data storage
// This service provides functions to interact with JSON files for persistent storage

// Check if we're in development mode
// In a real app, this would come from Electron's process.env or app configuration
const isDevelopmentMode =
  (window.electronAPI && window.electronAPI.isDevelopmentMode) ||
  process.env.NODE_ENV === 'development'

// Base paths for data storage
// In development: project_root/appdata
// In production: user's app data folder
const getBasePath = async () => {
  if (window.electronAPI && window.electronAPI.getDataPath) {
    try {
      let result = await window.electronAPI.getDataPath()
      console.log('getDataPath', result)
      // If we have electronAPI available, ask Electron for proper paths
      return result
    } catch (error) {
      console.error('Error getting data path:', error)
      return null
    }
  } else {
    // Fallback for browser development (no persistence)
    console.warn('electronAPI.getDataPath not available, using memory storage')
    return null
  }
}

// In-memory cache for data when electronAPI is not available
const memoryStorage = {
  apps: []
}

// Read data from a JSON file
async function readJsonFile(filename) {
  try {
    const basePath = await getBasePath()

    // If we have a proper file path through Electron
    if (basePath && window.electronAPI && window.electronAPI.readJsonFile) {
      const filePath = `${basePath}/${filename}.json`
      return await window.electronAPI.readJsonFile(filePath)
    } else {
      // Fallback to memory storage when no file access
      console.log(`Using memory storage for ${filename}`)
      return memoryStorage[filename] || []
    }
  } catch (error) {
    console.error(`Error reading ${filename}.json:`, error)
    return []
  }
}

// Write data to a JSON file
async function writeJsonFile(filename, data) {
  try {
    const basePath = await getBasePath()

    // Make sure the data is serializable by converting to and from JSON
    // This removes any non-serializable properties, functions, etc.
    const serializedData = JSON.parse(JSON.stringify(data))

    // If we have a proper file path through Electron
    if (basePath && window.electronAPI && window.electronAPI.writeJsonFile) {
      const filePath = `${basePath}/${filename}.json`
      await window.electronAPI.writeJsonFile(filePath, serializedData)
      return true
    } else {
      // Fallback to memory storage when no file access
      console.log(`Using memory storage for ${filename}`)
      memoryStorage[filename] = serializedData
      return true
    }
  } catch (error) {
    console.error(`Error writing ${filename}.json:`, error)
    return false
  }
}

// Helper function to ensure folder exists
async function ensureDataFolder() {
  try {
    if (window.electronAPI && window.electronAPI.ensureDirectory) {
      const basePath = await getBasePath()
      if (basePath) {
        await window.electronAPI.ensureDirectory(basePath)
        return true
      }
    } else {
      console.log('electronAPI.ensureDirectory not available, skipping')
    }
  } catch (error) {
    console.error('Error ensuring data folder:', error)
  }
  return false
}

// Initialize the data storage
async function initializeStorage() {
  try {
    // Ensure data folder exists
    await ensureDataFolder()

    // Check if apps.json exists, if not create it with empty array
    const apps = await readJsonFile('apps')
    if (Array.isArray(apps) && apps.length === 0) {
      // First-time initialization with empty apps array
      await writeJsonFile('apps', [])
    }

    // Check if settings.json exists, if not create it with default settings
    const settings = await readJsonFile('settings')
    if (!settings || Object.keys(settings).length === 0) {
      // First-time initialization with default settings
      const defaultSettings = {
        appSpace: '',
        huggingfaceDir: '',
        pipSource: 'https://pypi.org/simple',
        version: '1.0.0',
        maxConcurrentDownloads: 3,
        autoUpdateModels: false,
        debugMode: false,
        language: 'zh_CN',
        theme: 'light'
      }
      await writeJsonFile('settings', defaultSettings)
    }

    return true
  } catch (error) {
    console.error('Error initializing storage:', error)
    // Initialize in-memory storage as fallback
    memoryStorage.apps = []
    memoryStorage.settings = {
      appSpace: '',
      huggingfaceDir: '',
      pipSource: 'https://pypi.org/simple',
      version: '1.0.0',
      maxConcurrentDownloads: 3,
      autoUpdateModels: false,
      debugMode: false,
      language: 'zh_CN',
      theme: 'light'
    }
    return false
  }
}

// App-specific data functions
// Get all apps
async function getApps() {
  return await readJsonFile('apps')
}

// Save all apps
async function saveApps(apps) {
  return await writeJsonFile('apps', apps)
}

// Add a new app
async function addApp(app) {
  const apps = await getApps()
  apps.push(app)
  return await saveApps(apps)
}

// Update an existing app
async function updateApp(updatedApp) {
  const apps = await getApps()
  const index = apps.findIndex((app) => app.id === updatedApp.id)
  if (index !== -1) {
    apps[index] = updatedApp
    return await saveApps(apps)
  }
  return false
}

// Delete an app
async function deleteApp(appId) {
  const apps = await getApps()
  const newApps = apps.filter((app) => app.id !== appId)
  return await saveApps(newApps)
}

// Export the API
export default {
  isDevelopmentMode,
  initializeStorage,
  readJsonFile,
  writeJsonFile,
  getApps,
  saveApps,
  addApp,
  updateApp,
  deleteApp
}
