const { exec } = require('child_process');
const ProcessMonitor = require('../processMonitor');

// Mock child_process
jest.mock('child_process');

describe('ProcessMonitor', () => {
  let processMonitor;
  let mockExec;

  beforeEach(() => {
    jest.clearAllMocks();
    processMonitor = new ProcessMonitor();
    mockExec = exec;
  });

  afterEach(() => {
    // Clear any intervals that might be running
    jest.clearAllTimers();
  });

  describe('isNMSRunning', () => {
    test('should return true when NMS process is found on Windows', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      mockExec.mockImplementation((command, callback) => {
        callback(null, { stdout: '"NMS.exe","1234","Console","1","12,345 K"' });
      });
      
      const result = await processMonitor.isNMSRunning();
      
      expect(result).toBe(true);
    });

    test('should return true when NMS process is found on macOS', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      
      mockExec.mockImplementation((command, callback) => {
        callback(null, { stdout: '1234\n5678' }); // pgrep returns PIDs
      });
      
      const result = await processMonitor.isNMSRunning();
      
      expect(result).toBe(true);
    });

    test('should return false when no NMS process is found', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      mockExec.mockImplementation((command, callback) => {
        callback(null, { stdout: 'No tasks are running' });
      });
      
      const result = await processMonitor.isNMSRunning();
      
      expect(result).toBe(false);
    });

    test('should return false when command execution fails', async () => {
      mockExec.mockImplementation((command, callback) => {
        callback(new Error('Command failed'));
      });
      
      const result = await processMonitor.isNMSRunning();
      
      expect(result).toBe(false);
    });

    test('should check multiple process names until one is found', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      mockExec
        .mockImplementationOnce((command, callback) => {
          // First call for NMS.exe - not found
          callback(null, { stdout: 'No tasks are running' });
        })
        .mockImplementationOnce((command, callback) => {
          // Second call for NoMansSky.exe - found
          callback(null, { stdout: '"NoMansSky.exe","5678","Console","1","15,000 K"' });
        });
      
      const result = await processMonitor.isNMSRunning();
      
      expect(result).toBe(true);
      expect(mockExec).toHaveBeenCalledTimes(2);
    });
  });

  describe('getNMSProcessInfo', () => {
    test('should return process info when NMS is running on Windows', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      mockExec.mockImplementation((command, callback) => {
        callback(null, { 
          stdout: '"Image Name","PID","Session Name","Session#","Mem Usage"\n"NMS.exe","1234","Console","1","12,345 K"' 
        });
      });
      
      const result = await processMonitor.getNMSProcessInfo();
      
      expect(result).toEqual({
        name: 'NMS.exe',
        pid: 1234,
        platform: 'win32',
        memoryUsage: '12,345 K',
        startTime: 'Unknown'
      });
    });

    test('should return process info when NMS is running on macOS', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      
      mockExec.mockImplementation((command, callback) => {
        callback(null, { 
          stdout: '  PID  %CPU %MEM     ELAPSED COMMAND\n 1234   2.5  5.2    00:10:30 /Applications/No Man\'s Sky' 
        });
      });
      
      const result = await processMonitor.getNMSProcessInfo();
      
      expect(result).toEqual({
        name: 'No Man\'s Sky',
        pid: 1234,
        platform: 'darwin',
        memoryUsage: '2.5%',
        startTime: '00:10:30'
      });
    });

    test('should return null when no NMS process is found', async () => {
      mockExec.mockImplementation((command, callback) => {
        callback(null, { stdout: '' });
      });
      
      const result = await processMonitor.getNMSProcessInfo();
      
      expect(result).toBeNull();
    });

    test('should handle parsing errors gracefully', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      mockExec.mockImplementation((command, callback) => {
        callback(null, { stdout: 'malformed output' });
      });
      
      const result = await processMonitor.getNMSProcessInfo();
      
      expect(result).toBeNull();
    });
  });

  describe('_parseWindowsTasklist', () => {
    test('should parse Windows tasklist output correctly', () => {
      const output = '"Image Name","PID","Session Name","Session#","Mem Usage"\n"NMS.exe","1234","Console","1","12,345 K"';
      
      const result = processMonitor._parseWindowsTasklist(output);
      
      expect(result).toEqual({
        pid: 1234,
        memory: '12,345 K'
      });
    });

    test('should handle malformed Windows output', () => {
      const output = 'malformed';
      
      const result = processMonitor._parseWindowsTasklist(output);
      
      expect(result).toBeNull();
    });
  });

  describe('_parseUnixPS', () => {
    test('should parse Unix ps output correctly', () => {
      const output = '  PID  %CPU %MEM     ELAPSED COMMAND\n 1234   2.5  5.2    00:10:30 /Applications/NoMansSky';
      
      const result = processMonitor._parseUnixPS(output);
      
      expect(result).toEqual({
        pid: 1234,
        memory: '2.5%',
        startTime: '00:10:30'
      });
    });

    test('should handle malformed Unix output', () => {
      const output = 'short output';
      
      const result = processMonitor._parseUnixPS(output);
      
      expect(result).toBeNull();
    });
  });

  describe('Windows false positive detection', () => {
    test('should avoid false positives - reject partial matches in tasklist output', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      mockExec.mockImplementation((command, callback) => {
        // Simulate tasklist returning output that contains similar but not exact process name
        if (command.includes('NMS.exe')) {
          // Return output that looks like it found something but is actually a different process
          callback(null, { stdout: '"NotNMS.exe","1234","Console","1","10,000 K"' });
        } else {
          callback(null, { stdout: 'No tasks are running' });
        }
      });
      
      const result = await processMonitor.isNMSRunning();
      
      expect(result).toBe(false);
    });

    test('should handle Windows INFO messages correctly', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      mockExec.mockImplementation((command, callback) => {
        // Simulate tasklist returning INFO message instead of "No tasks are running"
        callback(null, { stdout: 'INFO: No tasks are running which match the specified criteria.' });
      });
      
      const result = await processMonitor.isNMSRunning();
      
      expect(result).toBe(false);
    });

    test('should only return true for exact process name matches in CSV format', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      mockExec.mockImplementation((command, callback) => {
        if (command.includes('NMS.exe')) {
          // This should match exactly
          callback(null, { stdout: '"NMS.exe","1234","Console","1","50,000 K"' });
        } else {
          callback(null, { stdout: 'No tasks are running' });
        }
      });
      
      const result = await processMonitor.isNMSRunning();
      
      expect(result).toBe(true);
    });
  });

  describe('monitoring', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should start monitoring and return interval ID', () => {
      const mockCallback = jest.fn();
      
      const intervalId = processMonitor.startMonitoring(mockCallback, 100);
      
      expect(intervalId).toBeDefined();
      expect(intervalId).not.toBeNull();
      
      processMonitor.stopMonitoring(intervalId);
    });

    test('should stop monitoring when stopMonitoring is called', () => {
      const mockCallback = jest.fn();
      const intervalId = processMonitor.startMonitoring(mockCallback, 1000);
      
      processMonitor.stopMonitoring(intervalId);
      
      // Fast-forward time
      jest.advanceTimersByTime(2000);
      
      expect(mockCallback).not.toHaveBeenCalled();
    });

    test('should throw error for invalid callback', () => {
      expect(() => {
        processMonitor.startMonitoring('not a function');
      }).toThrow('Callback must be a function');
    });
  });
});