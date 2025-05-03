import fs from 'fs'
import path from 'path'
import git from './git'

/**
 * Load a seed configuration from a file
 * @param {string} seedPath - Path to the seed JSON file
 * @returns {Promise<object>} The seed configuration object
 */
async function loadSeedConfig(seedPath) {
  try {
    const seedData = fs.readFileSync(seedPath, 'utf8')
    return JSON.parse(seedData)
  } catch (error) {
    console.error(`Error loading seed config from ${seedPath}:`, error)
    throw new Error(`Failed to load seed: ${error.message}`)
  }
}

/**
 * Get all available seeds from the seeds directory
 * @param {string} seedsDir - Path to the seeds directory
 * @returns {Promise<Array>} List of available seeds
 */
async function getAvailableSeeds(seedsDir) {
  try {
    if (!fs.existsSync(seedsDir)) {
      console.log(`Seeds directory not found: ${seedsDir}, creating it`)
      fs.mkdirSync(seedsDir, { recursive: true })
      return []
    }

    const files = fs.readdirSync(seedsDir)
    const seedFiles = files.filter((file) => file.endsWith('.aiseed.json'))

    const seeds = await Promise.all(
      seedFiles.map(async (file) => {
        try {
          const seedPath = path.join(seedsDir, file)
          const seed = await loadSeedConfig(seedPath)
          return {
            ...seed,
            filename: file,
            path: seedPath
          }
        } catch (error) {
          console.error(`Error loading seed from ${file}:`, error)
          return null
        }
      })
    )

    return seeds.filter((seed) => seed !== null)
  } catch (error) {
    console.error('Error getting available seeds:', error)
    return []
  }
}

/**
 * Get the appropriate seeds directory based on environment
 * @param {boolean} isDevelopment - Whether the app is running in development mode
 * @param {string} appSpace - App space path from settings
 * @param {string} appPath - App path from electron app
 * @returns {string} Path to the seeds directory
 */
function getSeedsDirectory(isDevelopment, appSpace, appPath) {
  if (isDevelopment) {
    // In development mode, use './seeds' directory in the project root
    return path.join(appPath, 'seeds')
  } else {
    // In production mode, use 'appSpace/seeds' directory
    return path.join(appSpace, 'seeds')
  }
}

/**
 * Install or update a seed
 * @param {string} seedsDir - Path to the seeds directory
 * @param {string} reposDir - Path to store repositories
 * @param {string} seedName - Name of the seed to install
 * @returns {Promise<object>} Result of the installation
 */
async function installSeed(seedsDir, reposDir, seedName) {
  try {
    // Find the seed configuration
    const seedFile = path.join(seedsDir, `${seedName}.aiseed.json`)

    if (!fs.existsSync(seedFile)) {
      throw new Error(`Seed not found: ${seedName}`)
    }

    // Load the seed configuration
    const seed = await loadSeedConfig(seedFile)

    // Make sure the repos directory exists
    if (!fs.existsSync(reposDir)) {
      fs.mkdirSync(reposDir, { recursive: true })
    }

    // Install or update the seed repository
    const result = await git.getSeed(reposDir, seed)

    return {
      success: result.success,
      seed,
      result
    }
  } catch (error) {
    console.error(`Error installing seed ${seedName}:`, error)
    return {
      success: false,
      error: error.message
    }
  }
}

export { loadSeedConfig, getAvailableSeeds, getSeedsDirectory, installSeed }
