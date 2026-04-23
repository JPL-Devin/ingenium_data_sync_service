jest.mock('../config/config', () => ({
  LOG_LEVEL: 'info',
}));

describe('logger', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('creates a logger with expected configuration', () => {
    const logger = require('../utils/logger');

    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('has default log level of info', () => {
    const logger = require('../utils/logger');
    expect(logger.level).toBe('info');
  });
});
