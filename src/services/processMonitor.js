const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class ProcessMonitor {
  constructor() {
    this.nmsProcessNames = {
      win32: ['NMS.exe', 'NoMansSky.exe'],
      darwin: ['No Man\'s Sky', 'NMS'],
      linux: ['NMS.x64', 'NoMansSky']
    };
  }

  /**
   * Détecte si No Man's Sky est en cours d'exécution
   * @returns {Promise<boolean>} True si NMS est actif
   */
  async isNMSRunning() {
    try {
      const platform = process.platform;
      const processNames = this.nmsProcessNames[platform] || this.nmsProcessNames.win32;
      
      for (const processName of processNames) {
        const isRunning = await this._checkProcessByName(processName);
        if (isRunning) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking NMS process:', error);
      return false;
    }
  }

  /**
   * Obtient les informations détaillées du processus NMS s'il est actif
   * @returns {Promise<Object|null>} Infos processus ou null si inactif
   */
  async getNMSProcessInfo() {
    try {
      const platform = process.platform;
      const processNames = this.nmsProcessNames[platform] || this.nmsProcessNames.win32;
      
      for (const processName of processNames) {
        const processInfo = await this._getProcessInfo(processName);
        if (processInfo) {
          return {
            name: processName,
            pid: processInfo.pid,
            platform: platform,
            memoryUsage: processInfo.memory || 'Unknown',
            startTime: processInfo.startTime || 'Unknown'
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting NMS process info:', error);
      return null;
    }
  }

  /**
   * Vérifie si un processus avec le nom donné est actif
   * @param {string} processName Nom du processus à chercher
   * @returns {Promise<boolean>}
   */
  async _checkProcessByName(processName) {
    try {
      const platform = process.platform;
      
      let command;
      if (platform === 'win32') {
        // Windows: utiliser tasklist
        command = `tasklist /FI "IMAGENAME eq ${processName}" /FO CSV /NH`;
      } else {
        // Unix-like (macOS, Linux): utiliser ps et grep
        command = `ps aux | grep -i "${processName}" | grep -v grep`;
      }
      
      const { stdout } = await execAsync(command);
      
      if (platform === 'win32') {
        // Sur Windows, tasklist retourne le processus s'il existe
        return stdout.trim().length > 0 && !stdout.includes('No tasks are running');
      } else {
        // Sur Unix, grep retourne du contenu s'il trouve le processus
        return stdout.trim().length > 0;
      }
    } catch (error) {
      // Si la commande échoue, le processus n'est probablement pas actif
      return false;
    }
  }

  /**
   * Récupère les informations détaillées d'un processus
   * @param {string} processName Nom du processus
   * @returns {Promise<Object|null>}
   */
  async _getProcessInfo(processName) {
    try {
      const platform = process.platform;
      
      let command;
      if (platform === 'win32') {
        // Windows: tasklist avec plus de détails
        command = `tasklist /FI "IMAGENAME eq ${processName}" /FO CSV`;
      } else {
        // Unix-like: ps avec format personnalisé
        command = `ps aux | grep -i "${processName}" | grep -v grep | head -1`;
      }
      
      const { stdout } = await execAsync(command);
      
      if (!stdout.trim()) {
        return null;
      }
      
      if (platform === 'win32') {
        return this._parseWindowsTasklist(stdout);
      } else {
        return this._parseUnixPS(stdout);
      }
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse la sortie de tasklist Windows
   * @param {string} output Sortie de tasklist
   * @returns {Object|null}
   */
  _parseWindowsTasklist(output) {
    try {
      const lines = output.trim().split('\n');
      if (lines.length < 2) return null;
      
      // Ignorer la ligne d'en-tête CSV
      const dataLine = lines[1];
      const fields = dataLine.split('","').map(field => field.replace(/"/g, ''));
      
      if (fields.length >= 2) {
        return {
          pid: parseInt(fields[1]) || 'Unknown',
          memory: fields[4] || 'Unknown'
        };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse la sortie de ps Unix
   * @param {string} output Sortie de ps
   * @returns {Object|null}
   */
  _parseUnixPS(output) {
    try {
      const fields = output.trim().split(/\s+/);
      
      if (fields.length >= 11) {
        return {
          pid: parseInt(fields[1]) || 'Unknown',
          memory: `${fields[3]}%`, // % CPU
          startTime: fields[8] || 'Unknown'
        };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Surveille périodiquement le processus NMS
   * @param {Function} callback Fonction appelée avec l'état (true/false)
   * @param {number} interval Intervalle en millisecondes (défaut: 5000)
   * @returns {number} ID de l'interval pour pouvoir l'arrêter
   */
  startMonitoring(callback, interval = 5000) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    
    return setInterval(async () => {
      const isRunning = await this.isNMSRunning();
      callback(isRunning);
    }, interval);
  }

  /**
   * Arrête la surveillance
   * @param {number} intervalId ID retourné par startMonitoring
   */
  stopMonitoring(intervalId) {
    if (intervalId) {
      clearInterval(intervalId);
    }
  }
}

module.exports = ProcessMonitor;