// Global Jest setup to suppress console.error in tests
global.console = {
  ...console,
  // Mock console.error but keep other console methods
  error: jest.fn(),
};