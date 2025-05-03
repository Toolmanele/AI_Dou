// seedService.js - Service for handling AI Seeds
// This service provides functions to interact with the seed management system

/**
 * Get all available seeds
 * @returns {Promise<Array>} List of available seeds
 */
export async function getAvailableSeeds() {
  try {
    if (window.electronAPI && window.electronAPI.getAvailableSeeds) {
      return await window.electronAPI.getAvailableSeeds();
    } else {
      console.warn("electronAPI.getAvailableSeeds not available");
      return [];
    }
  } catch (error) {
    console.error("Error getting available seeds:", error);
    return [];
  }
}

/**
 * Install or update a seed
 * @param {string} seedName - The name of the seed to install/update
 * @param {string} targetDir - Optional target directory
 * @returns {Promise<object>} Result of the installation
 */
export async function installSeed(seedName, targetDir = null) {
  try {
    if (window.electronAPI && window.electronAPI.installSeed) {
      return await window.electronAPI.installSeed(seedName, targetDir);
    } else {
      console.warn("electronAPI.installSeed not available");
      throw new Error("Seed installation is not available in this environment");
    }
  } catch (error) {
    console.error(`Error installing seed ${seedName}:`, error);
    throw error;
  }
}

/**
 * Check if we're in an environment that supports seed operations
 * @returns {boolean} True if the environment supports seed operations
 */
export function isSeedOperationsSupported() {
  return !!(
    window.electronAPI &&
    window.electronAPI.getAvailableSeeds &&
    window.electronAPI.installSeed
  );
}

export default {
  getAvailableSeeds,
  installSeed,
  isSeedOperationsSupported,
};
