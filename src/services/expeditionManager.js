const fs = require('fs');
const path = require('path');
const ConfigManager = require('./configManager');

class ExpeditionManager {
  constructor() {
    this.configManager = new ConfigManager();
    this.expeditionsDataPath = path.join(__dirname, '../data/expeditions');
  }

  /**
   * Get the current state of the NMS cache
   * @returns {Object} State object with mode, expedition info, and file status
   */
  async getCurrentState() {
    try {
      const config = this.configManager.loadConfig();
      
      if (!config.cachePath || !fs.existsSync(config.cachePath)) {
        return {
          mode: 'error',
          error: 'Cache path not found or invalid',
          cachePath: config.cachePath
        };
      }

      const seasonFile = path.join(config.cachePath, 'SEASON_DATA_CACHE.JSON');
      const backupFile = path.join(config.cachePath, 'SEASON_DATA_CACHE_original.JSON');

      // Check file existence
      const hasSeasonFile = fs.existsSync(seasonFile);
      const hasBackupFile = fs.existsSync(backupFile);

      if (!hasSeasonFile) {
        return {
          mode: 'no_cache',
          error: 'SEASON_DATA_CACHE.JSON not found',
          cachePath: config.cachePath
        };
      }

      // If no backup exists, we're in online mode
      if (!hasBackupFile) {
        return {
          mode: 'online',
          cachePath: config.cachePath,
          files: {
            seasonFile: seasonFile,
            hasOriginal: true
          }
        };
      }

      // If backup exists, we're in expedition mode - try to identify which one
      const currentExpedition = await this._identifyCurrentExpedition(seasonFile);
      
      return {
        mode: 'expedition',
        currentExpedition: currentExpedition,
        cachePath: config.cachePath,
        files: {
          seasonFile: seasonFile,
          backupFile: backupFile,
          hasOriginal: true,
          hasBackup: true
        }
      };

    } catch (error) {
      return {
        mode: 'error',
        error: error.message
      };
    }
  }

  /**
   * Try to identify which expedition is currently active
   * @param {string} seasonFilePath Path to current SEASON_DATA_CACHE.JSON
   * @returns {Object|null} Expedition info or null if not identified
   */
  async _identifyCurrentExpedition(seasonFilePath) {
    try {
      const currentContent = fs.readFileSync(seasonFilePath, 'utf8');
      const expeditionFiles = fs.readdirSync(this.expeditionsDataPath)
        .filter(file => file.endsWith('.json') && file !== 'expeditions-metadata.json');

      // Compare with each expedition file
      for (const expeditionFile of expeditionFiles) {
        const expeditionPath = path.join(this.expeditionsDataPath, expeditionFile);
        const expeditionContent = fs.readFileSync(expeditionPath, 'utf8');
        
        // Simple content comparison (could be enhanced with better matching logic)
        if (currentContent === expeditionContent) {
          const expeditionId = expeditionFile.replace('.json', '');
          const metadata = await this._getExpeditionMetadata(expeditionId);
          return {
            id: expeditionId,
            file: expeditionFile,
            ...metadata
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error identifying expedition:', error);
      return null;
    }
  }

  /**
   * Get metadata for a specific expedition
   * @param {string} expeditionId The expedition ID (e.g., "01_pioneers")
   * @returns {Object} Expedition metadata
   */
  async _getExpeditionMetadata(expeditionId) {
    try {
      const metadataPath = path.join(this.expeditionsDataPath, 'expeditions-metadata.json');
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      return metadata[expeditionId] || {};
    } catch (error) {
      console.error('Error loading expedition metadata:', error);
      return {};
    }
  }

  /**
   * Create a secure backup of the original SEASON_DATA_CACHE.JSON
   * @returns {Object} Result object with success status
   */
  async createBackup() {
    try {
      const config = this.configManager.loadConfig();
      
      if (!config.cachePath) {
        throw new Error('Cache path not configured');
      }

      const seasonFile = path.join(config.cachePath, 'SEASON_DATA_CACHE.JSON');
      const backupFile = path.join(config.cachePath, 'SEASON_DATA_CACHE_original.JSON');

      // Verify source file exists and is valid JSON
      if (!fs.existsSync(seasonFile)) {
        throw new Error('SEASON_DATA_CACHE.JSON not found');
      }

      // Validate JSON format
      const content = fs.readFileSync(seasonFile, 'utf8');
      JSON.parse(content); // Will throw if invalid JSON

      // Check if backup already exists
      if (fs.existsSync(backupFile)) {
        return {
          success: true,
          message: 'Backup already exists',
          alreadyExists: true
        };
      }

      // Create backup
      fs.copyFileSync(seasonFile, backupFile);

      // Verify backup was created successfully
      if (!fs.existsSync(backupFile)) {
        throw new Error('Failed to create backup file');
      }

      // Verify backup content matches original
      const backupContent = fs.readFileSync(backupFile, 'utf8');
      if (backupContent !== content) {
        fs.unlinkSync(backupFile); // Clean up failed backup
        throw new Error('Backup verification failed - content mismatch');
      }

      return {
        success: true,
        message: 'Backup created successfully',
        backupPath: backupFile
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Activate a specific expedition by replacing SEASON_DATA_CACHE.JSON
   * @param {string} expeditionId The expedition ID (e.g., "01_pioneers")
   * @returns {Object} Result object with success status
   */
  async activateExpedition(expeditionId) {
    try {
      const config = this.configManager.loadConfig();
      
      if (!config.cachePath) {
        throw new Error('Cache path not configured');
      }

      const seasonFile = path.join(config.cachePath, 'SEASON_DATA_CACHE.JSON');
      const expeditionFile = path.join(this.expeditionsDataPath, `${expeditionId}.json`);

      // Verify expedition file exists
      if (!fs.existsSync(expeditionFile)) {
        throw new Error(`Expedition file not found: ${expeditionId}.json`);
      }

      // Validate expedition file JSON format
      const expeditionContent = fs.readFileSync(expeditionFile, 'utf8');
      JSON.parse(expeditionContent); // Will throw if invalid JSON

      // Create backup first if it doesn't exist
      const backupResult = await this.createBackup();
      if (!backupResult.success && !backupResult.alreadyExists) {
        throw new Error(`Failed to create backup: ${backupResult.error}`);
      }

      // Replace season file with expedition data
      fs.copyFileSync(expeditionFile, seasonFile);

      // Verify the replacement was successful
      const newContent = fs.readFileSync(seasonFile, 'utf8');
      if (newContent !== expeditionContent) {
        throw new Error('Expedition activation verification failed');
      }

      // Get expedition metadata for response
      const metadata = await this._getExpeditionMetadata(expeditionId);

      return {
        success: true,
        message: `Expedition "${metadata.displayName || expeditionId}" activated`,
        expeditionId: expeditionId,
        metadata: metadata,
        backupCreated: !backupResult.alreadyExists
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Restore original SEASON_DATA_CACHE.JSON from backup (return to online mode)
   * @returns {Object} Result object with success status
   */
  async restoreOriginal() {
    try {
      const config = this.configManager.loadConfig();
      
      if (!config.cachePath) {
        throw new Error('Cache path not configured');
      }

      const seasonFile = path.join(config.cachePath, 'SEASON_DATA_CACHE.JSON');
      const backupFile = path.join(config.cachePath, 'SEASON_DATA_CACHE_original.JSON');

      // Verify backup file exists
      if (!fs.existsSync(backupFile)) {
        throw new Error('No backup file found - cannot restore');
      }

      // Validate backup file JSON format
      const backupContent = fs.readFileSync(backupFile, 'utf8');
      JSON.parse(backupContent); // Will throw if invalid JSON

      // Restore backup to season file
      fs.copyFileSync(backupFile, seasonFile);

      // Verify restoration
      const restoredContent = fs.readFileSync(seasonFile, 'utf8');
      if (restoredContent !== backupContent) {
        throw new Error('Restoration verification failed');
      }

      // Remove backup file after successful restoration
      fs.unlinkSync(backupFile);

      return {
        success: true,
        message: 'Original SEASON_DATA_CACHE.JSON restored successfully',
        mode: 'online'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get list of available expeditions with metadata
   * @returns {Object} Result with expeditions list
   */
  async getAvailableExpeditions() {
    try {
      const expeditionFiles = fs.readdirSync(this.expeditionsDataPath)
        .filter(file => file.endsWith('.json') && file !== 'expeditions-metadata.json')
        .sort();

      const expeditions = [];
      
      for (const file of expeditionFiles) {
        const expeditionId = file.replace('.json', '');
        const metadata = await this._getExpeditionMetadata(expeditionId);
        
        expeditions.push({
          id: expeditionId,
          file: file,
          ...metadata
        });
      }

      // Sort by order if available
      expeditions.sort((a, b) => (a.order || 0) - (b.order || 0));

      return {
        success: true,
        expeditions: expeditions,
        count: expeditions.length
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate JSON file integrity
   * @param {string} filePath Path to JSON file
   * @returns {boolean} True if valid JSON
   */
  _validateJsonFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      JSON.parse(content);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = ExpeditionManager;