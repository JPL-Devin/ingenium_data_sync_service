describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses default values when env vars are not set', () => {
    delete process.env.ARANGO_URL;
    delete process.env.ARANGO_USER;
    delete process.env.ARANGO_ROOT_PASSWORD;
    delete process.env.ARANGO_DB_NAME;
    delete process.env.ES_HOST;
    delete process.env.ES_PORT;
    delete process.env.INIT_SYNC_DELAY_SECS;
    delete process.env.INIT_SYNC_TRIGGER_ELEM_COUNT;
    delete process.env.INIT_SYNC_CHUNK_SIZE;
    delete process.env.SYNC_INTERVAL_SECS;

    const config = require('../config/config');

    expect(config.ARANGO_URL).toBe('http://127.0.0.1:18529');
    expect(config.ARANGO_USER).toBe('root');
    expect(config.ARANGO_PASSWORD).toBe('password');
    expect(config.ARANGO_DB_NAME).toBe('ingenium');
    expect(config.ES_HOST).toBe('127.0.0.1');
    expect(config.ES_PORT).toBe(19200);
    expect(config.ARANGO_COLLECTION_NAMES).toEqual(['element', 'procedureElement']);
    expect(config.LOG_LEVEL).toBe('info');
  });

  it('uses env var values when set', () => {
    process.env.ARANGO_URL = 'http://arango:8529';
    process.env.ARANGO_USER = 'admin';
    process.env.ARANGO_ROOT_PASSWORD = 'secret';
    process.env.ARANGO_DB_NAME = 'testdb';
    process.env.ES_HOST = 'elasticsearch';
    process.env.ES_PORT = '9200';

    const config = require('../config/config');

    expect(config.ARANGO_URL).toBe('http://arango:8529');
    expect(config.ARANGO_USER).toBe('admin');
    expect(config.ARANGO_PASSWORD).toBe('secret');
    expect(config.ARANGO_DB_NAME).toBe('testdb');
    expect(config.ES_HOST).toBe('elasticsearch');
    expect(config.ES_PORT).toBe(9200);
  });

  it('uses default INIT_SYNC_TRIGGER_ELEM_COUNT of 500000', () => {
    delete process.env.INIT_SYNC_TRIGGER_ELEM_COUNT;
    const config = require('../config/config');
    expect(config.INIT_SYNC_TRIGGER_ELEM_COUNT).toBe(500000);
  });

  it('uses default INIT_SYNC_CHUNK_SIZE of 100000', () => {
    delete process.env.INIT_SYNC_CHUNK_SIZE;
    const config = require('../config/config');
    expect(config.INIT_SYNC_CHUNK_SIZE).toBe(100000);
  });

  it('uses default SYNC_CHUNK_SIZE of 100000', () => {
    delete process.env.INIT_SYNC_CHUNK_SIZE;
    const config = require('../config/config');
    expect(config.SYNC_CHUNK_SIZE).toBe(100000);
  });

  it('uses default INIT_SYNC_DELAY_SECS of 60', () => {
    delete process.env.INIT_SYNC_DELAY_SECS;
    const config = require('../config/config');
    expect(config.INIT_SYNC_DELAY_SECS).toBe(60);
  });

  it('uses default SYNC_INTERVAL_SECS of 30', () => {
    delete process.env.SYNC_INTERVAL_SECS;
    const config = require('../config/config');
    expect(config.SYNC_INTERVAL_SECS).toBe(30);
  });

  it('handles non-numeric ES_PORT with default', () => {
    process.env.ES_PORT = 'abc';
    const config = require('../config/config');
    expect(config.ES_PORT).toBe(19200);
  });
});
