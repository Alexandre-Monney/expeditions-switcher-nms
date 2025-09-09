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
        command = `tasklist /FI "IMAGENAME eq ${processName}" /FO CSV /NH`;
      } else {
        command = `pgrep -f "${processName}"`;
      }
      
      const { stdout } = await execAsync(command);
      
      if (platform === 'win32') {
        const output = stdout.trim();
        if (output.length === 0 || output.includes('No tasks are running') || output.includes('INFO: No tasks')) {
          return false;
        }
        
        const lines = output.split('\n').filter(line => line.trim().length > 0);
        for (const line of lines) {
          if (line.includes(`"${processName}"`)) {
            return true;
          }
        }
        return false;
      } else {
        return stdout.trim().length > 0;
      }
    } catch (error) {
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
        command = `tasklist /FI "IMAGENAME eq ${processName}" /FO CSV`;
      } else {
        command = `ps -p $(pgrep -f "${processName}" | head -1) -o pid,pcpu,pmem,etime,command 2>/dev/null`;
      }
      
      const { stdout } = await execAsync(command);
      
      if (!stdout.trim()) {
        return null;
      }
      
      if (platform === 'win32') {
        const lines = stdout.split('\n');
        for (const line of lines) {
          if (line.includes(`"${processName}"`)) {
            return this._parseWindowsTasklist(stdout);
          }
        }
        return null;
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
      const lines = output.trim().split('\n');
      if (lines.length < 2) return null;
      
      const dataLine = lines[1];
      const fields = dataLine.trim().split(/\s+/);
      
      if (fields.length >= 4) {
        return {
          pid: parseInt(fields[0]) || 'Unknown',
          memory: `${fields[1]}%`,
          startTime: fields[3] || 'Unknown'
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