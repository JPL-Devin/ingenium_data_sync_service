const { camelToSnakeCase, sleep, saveLastTimestampsToES, readLastTimestampsFromES } = require('../utils/utils');

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('camelToSnakeCase', () => {
  it('converts camelCase to snake_case', () => {
    expect(camelToSnakeCase('camelCase')).toBe('camel_case');
  });

  it('converts procedureElement to procedure_element', () => {
    expect(camelToSnakeCase('procedureElement')).toBe('procedure_element');
  });

  it('returns single word unchanged', () => {
    expect(camelToSnakeCase('element')).toBe('element');
  });

  it('converts consecutive uppercase letters', () => {
    expect(camelToSnakeCase('HTMLParser')).toBe('_h_t_m_l_parser');
  });

  it('returns empty string unchanged', () => {
    expect(camelToSnakeCase('')).toBe('');
  });
});

describe('sleep', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns a Promise', () => {
    const result = sleep(1000);
    expect(result).toBeInstanceOf(Promise);
    jest.advanceTimersByTime(1000);
  });

  it('resolves after the specified time', async () => {
    let resolved = false;
    const promise = sleep(5000).then(() => { resolved = true; });

    expect(resolved).toBe(false);

    jest.advanceTimersByTime(4999);
    await Promise.resolve();
    expect(resolved).toBe(false);

    jest.advanceTimersByTime(1);
    await promise;
    expect(resolved).toBe(true);
  });
});

describe('saveLastTimestampsToES', () => {
  it('saves timestamps to Elasticsearch', async () => {
    const mockEsClient = {
      index: jest.fn().mockResolvedValue({ result: 'created' }),
    };
    const timestamps = { element: '2023-01-01T00:00:00Z' };

    await saveLastTimestampsToES(mockEsClient, timestamps);

    expect(mockEsClient.index).toHaveBeenCalledWith({
      index: 'syncdata',
      id: 'last_timestamps',
      body: { data: timestamps },
    });
  });

  it('logs error but does not throw on failure', async () => {
    const logger = require('../utils/logger');
    const mockEsClient = {
      index: jest.fn().mockRejectedValue(new Error('ES connection failed')),
    };

    await expect(saveLastTimestampsToES(mockEsClient, {})).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('readLastTimestampsFromES', () => {
  it('returns data on successful read', async () => {
    const timestamps = { element: '2023-01-01T00:00:00Z' };
    const mockEsClient = {
      get: jest.fn().mockResolvedValue({ _source: { data: timestamps } }),
    };

    const result = await readLastTimestampsFromES(mockEsClient);
    expect(result).toEqual(timestamps);
    expect(mockEsClient.get).toHaveBeenCalledWith({
      index: 'syncdata',
      id: 'last_timestamps',
    });
  });

  it('returns empty object on 404 error', async () => {
    const mockEsClient = {
      get: jest.fn().mockRejectedValue({ meta: { statusCode: 404 } }),
    };

    const result = await readLastTimestampsFromES(mockEsClient);
    expect(result).toEqual({});
  });

  it('re-throws non-404 errors', async () => {
    const error = { meta: { statusCode: 500 }, message: 'Internal Server Error' };
    const mockEsClient = {
      get: jest.fn().mockRejectedValue(error),
    };

    await expect(readLastTimestampsFromES(mockEsClient)).rejects.toEqual(error);
  });
});
