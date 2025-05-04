import fs from 'fs'
import path from 'path'

/**
 * Check if a file exists
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>} True if file exists
 */
const checkFileExists = async (filePath) => {
  try {
    return fs.existsSync(filePath)
  } catch (error) {
    console.error(`Error checking if file exists: ${filePath}`, error)
    return false
  }
}

/**
 * Read a file as string
 * @param {string} filePath - Path to read
 * @returns {Promise<string>} File contents
 */
const readFile = async (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8')
  } catch (error) {
    console.error(`Error reading file: ${filePath}`, error)
    throw error
  }
}

/**
 * Write string to a file
 * @param {string} filePath - Path to write
 * @param {string} data - Data to write
 * @returns {Promise<boolean>} Success status
 */
const writeFile = async (filePath, data) => {
  try {
    // Ensure directory exists
    const dirPath = path.dirname(filePath)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }

    fs.writeFileSync(filePath, data, 'utf8')
    return true
  } catch (error) {
    console.error(`Error writing file: ${filePath}`, error)
    return false
  }
}

/**
 * Ensure a directory exists
 * @param {string} dirPath - Directory path
 * @returns {Promise<boolean>} Success status
 */
const ensureDir = async (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
    return true
  } catch (error) {
    console.error(`Error ensuring directory: ${dirPath}`, error)
    return false
  }
}
const checkUniqueDir = async (baseDirPath, dirName) => {
  let dirExists = fs.existsSync(path.join(baseDirPath, dirName))
  while (dirExists) {
    const timestamp = Date.now().toString().slice(-6)
    dirName = `${dirName}-${timestamp}`
    dirExists = fs.existsSync(path.join(baseDirPath, dirName))
  }
  return path.join(baseDirPath, dirName)
}
export { checkFileExists, readFile, writeFile, ensureDir, checkUniqueDir }
