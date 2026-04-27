jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock('../config/config', () => ({
  INIT_SYNC_TRIGGER_ELEM_COUNT: 3,
  INIT_SYNC_CHUNK_SIZE: 2,
  SYNC_CHUNK_SIZE: 100,
  LOG_LEVEL: 'info',
}));

const { preprocessDocument, initialSync, incrementalSync } = require('../document/document');

function createMockCursor(items) {
  let index = 0;
  const cursor = {
    count: items.length,
    next: jest.fn(async () => {
      const item = items[index];
      index++;
      cursor.hasNext = index < items.length;
      return item;
    }),
    hasNext: items.length > 0,
  };
  return cursor;
}

describe('preprocessDocument', () => {
  it('handles null input without throwing', () => {
    expect(() => preprocessDocument(null)).not.toThrow();
  });

  it('handles undefined input without throwing', () => {
    expect(() => preprocessDocument(undefined)).not.toThrow();
  });

  it('removes _id and _version fields', () => {
    const doc = { _id: 'test/123', _version: 1, name: 'test' };
    preprocessDocument(doc);
    expect(doc._id).toBeUndefined();
    expect(doc._version).toBeUndefined();
    expect(doc.name).toBe('test');
  });

  it('removes specification field', () => {
    const doc = { specification: { some: 'data' }, name: 'test' };
    preprocessDocument(doc);
    expect(doc.specification).toBeUndefined();
    expect(doc.name).toBe('test');
  });

  it('sanitizes invalid date fields (empty strings become null)', () => {
    const doc = { time_completed: '', time_saved: 'invalid-date' };
    preprocessDocument(doc);
    expect(doc.time_completed).toBeNull();
    expect(doc.time_saved).toBeNull();
  });

  it('preserves valid dates', () => {
    const validDate = '2023-01-01T00:00:00Z';
    const doc = { time_completed: validDate };
    preprocessDocument(doc);
    expect(doc.time_completed).toBe(validDate);
  });

  it('sanitizes nested date fields (execution.meta_data.time_completed)', () => {
    const doc = {
      execution: {
        meta_data: {
          time_completed: '',
          time_started: '2023-06-15T10:00:00Z',
          time_updated: 'bad-date',
        },
      },
    };
    preprocessDocument(doc);
    expect(doc.execution.meta_data.time_completed).toBeNull();
    expect(doc.execution.meta_data.time_started).toBe('2023-06-15T10:00:00Z');
    expect(doc.execution.meta_data.time_updated).toBeNull();
  });

  it('sanitizes array date fields (execution.results.entries.verified_time)', () => {
    const doc = {
      execution: {
        results: {
          entries: [
            { verified_time: '', radiated_time: '2023-01-01T00:00:00Z' },
            { verified_time: '2023-06-15T10:00:00Z' },
          ],
        },
      },
    };
    preprocessDocument(doc);
    expect(doc.execution.results.entries[0].verified_time).toBeNull();
    expect(doc.execution.results.entries[0].radiated_time).toBe('2023-01-01T00:00:00Z');
    expect(doc.execution.results.entries[1].verified_time).toBe('2023-06-15T10:00:00Z');
  });

  it('converts verification_value to string via processEntries', () => {
    const doc = {
      authoring_user_input: {
        entries: [
          { verification_value: 123 },
          { verification_value: true },
        ],
      },
    };
    preprocessDocument(doc);
    expect(doc.authoring_user_input.entries[0].verification_value).toBe('123');
    expect(doc.authoring_user_input.entries[1].verification_value).toBe('true');
  });

  it('sanitizes execution_user_input.entries', () => {
    const doc = {
      execution_user_input: {
        entries: [{ verification_value: 42 }],
      },
    };
    preprocessDocument(doc);
    expect(doc.execution_user_input.entries[0].verification_value).toBe('42');
  });

  it('sanitizes execution.results.entries', () => {
    const doc = {
      execution: {
        results: {
          entries: [{ verification_value: 99.5 }],
        },
      },
    };
    preprocessDocument(doc);
    expect(doc.execution.results.entries[0].verification_value).toBe('99.5');
  });

  it('sanitizes custom script outputs (value to string)', () => {
    const doc = {
      execution: {
        results: {
          outputs: [
            { value: 123 },
            { value: { nested: true } },
            { noValue: 'skip' },
          ],
        },
      },
    };
    preprocessDocument(doc);
    expect(doc.execution.results.outputs[0].value).toBe('123');
    expect(doc.execution.results.outputs[1].value).toBe('[object Object]');
    expect(doc.execution.results.outputs[2].noValue).toBe('skip');
  });

  it('handles missing intermediate keys in date sanitization', () => {
    const doc = { name: 'test' };
    // No execution key - should not throw
    expect(() => preprocessDocument(doc)).not.toThrow();
  });

  it('handles deeply nested array date fields with evr_data', () => {
    const doc = {
      execution: {
        results: {
          entries: [
            {
              ert: ['2023-01-01T00:00:00Z', '', '2023-06-15T10:00:00Z'],
              evr_data: [
                { ert: '2023-01-01T00:00:00Z', scet: '' },
                { ert: '', scet: '2023-01-01T00:00:00Z' },
              ],
              products: [
                { ert: '', scet: '2023-01-01T00:00:00Z' },
              ],
            },
          ],
        },
      },
    };
    preprocessDocument(doc);
    expect(doc.execution.results.entries[0].ert[0]).toBe('2023-01-01T00:00:00Z');
    expect(doc.execution.results.entries[0].ert[1]).toBeNull();
    expect(doc.execution.results.entries[0].ert[2]).toBe('2023-06-15T10:00:00Z');
    expect(doc.execution.results.entries[0].evr_data[0].scet).toBeNull();
    expect(doc.execution.results.entries[0].evr_data[1].ert).toBeNull();
    expect(doc.execution.results.entries[0].products[0].ert).toBeNull();
    expect(doc.execution.results.entries[0].products[0].scet).toBe('2023-01-01T00:00:00Z');
  });
});

describe('getElementData (via initialSync/incrementalSync)', () => {
  it('fetches element data with all related documents', async () => {
    const elementDoc = {
      _key: 'elem1',
      elem_id: 'e1',
      execution_id: 'exec1',
      version_id: 'v1',
      tag_ids: ['t1'],
    };

    const executionDoc = {
      execution_id: 'exec1',
      venue_id: 'venue1',
    };

    const venueDoc = { venue_id: 'venue1', name: 'TestVenue' };
    const runRecordDoc = { _to: 'element/e1', record: 'data' };
    const procVersionDoc = {
      version_id: 'v1',
      tags: [{ tag_id: 't1', name: 'TagOne' }],
    };

    // For incrementalSync: query returns doc+timestamp, then getElementData queries
    const mockArangoDb = {
      query: jest.fn()
        // First call: incrementalSync main query
        .mockResolvedValueOnce(createMockCursor([{ doc: elementDoc, timestamp: '2023-01-01T00:00:00Z' }]))
        // getElementData queries: execution, venue, runRecord, procedureVersion
        .mockResolvedValueOnce(createMockCursor([executionDoc]))
        .mockResolvedValueOnce(createMockCursor([venueDoc]))
        .mockResolvedValueOnce(createMockCursor([runRecordDoc]))
        .mockResolvedValueOnce(createMockCursor([procVersionDoc])),
    };

    const mockEsClient = {
      index: jest.fn().mockResolvedValue({ result: 'created' }),
    };

    await incrementalSync({}, mockArangoDb, mockEsClient, ['element']);
    expect(mockArangoDb.query).toHaveBeenCalled();
    expect(mockEsClient.index).toHaveBeenCalled();
  });

  it('handles when no execution is found', async () => {
    const elementDoc = {
      _key: 'elem2',
      elem_id: 'e2',
      execution_id: 'exec_missing',
      tag_ids: [],
    };

    const mockArangoDb = {
      query: jest.fn()
        .mockResolvedValueOnce(createMockCursor([{ doc: elementDoc, timestamp: '2023-01-01T00:00:00Z' }]))
        // execution not found
        .mockResolvedValueOnce(createMockCursor([]))
        // venue query (venue_id undefined)
        .mockResolvedValueOnce(createMockCursor([]))
        // runRecord
        .mockResolvedValueOnce(createMockCursor([])),
    };

    const mockEsClient = {
      index: jest.fn().mockResolvedValue({ result: 'created' }),
    };

    await incrementalSync({}, mockArangoDb, mockEsClient, ['element']);
    expect(mockEsClient.index).toHaveBeenCalled();
  });
});

describe('getProcedureElementData (via incrementalSync)', () => {
  it('fetches procedure element data', async () => {
    const procElemDoc = {
      _key: 'pe1',
      procedure_id: 'p1',
      version_id: 'v1',
      tag_ids: ['t1'],
    };

    const procedureDoc = { procedure_id: 'p1', name: 'TestProc' };
    const procVersionDoc = {
      version_id: 'v1',
      tags: [{ tag_id: 't1', name: 'TagOne' }],
    };

    const mockArangoDb = {
      query: jest.fn()
        .mockResolvedValueOnce(createMockCursor([{ doc: procElemDoc, timestamp: '2023-01-01T00:00:00Z' }]))
        .mockResolvedValueOnce(createMockCursor([procedureDoc]))
        .mockResolvedValueOnce(createMockCursor([procVersionDoc])),
    };

    const mockEsClient = {
      index: jest.fn().mockResolvedValue({ result: 'created' }),
    };

    await incrementalSync({}, mockArangoDb, mockEsClient, ['procedureElement']);
    expect(mockArangoDb.query).toHaveBeenCalled();
    expect(mockEsClient.index).toHaveBeenCalled();
  });

  it('handles when procedure is not found', async () => {
    const procElemDoc = {
      _key: 'pe2',
      procedure_id: 'p_missing',
      version_id: 'v_missing',
      tag_ids: [],
    };

    const mockArangoDb = {
      query: jest.fn()
        .mockResolvedValueOnce(createMockCursor([{ doc: procElemDoc, timestamp: '2023-01-01T00:00:00Z' }]))
        .mockResolvedValueOnce(createMockCursor([]))
        .mockResolvedValueOnce(createMockCursor([])),
    };

    const mockEsClient = {
      index: jest.fn().mockResolvedValue({ result: 'created' }),
    };

    await incrementalSync({}, mockArangoDb, mockEsClient, ['procedureElement']);
    expect(mockEsClient.index).toHaveBeenCalled();
  });
});

describe('initialSync', () => {
  it('skips bulk sync when timestamps count is below INIT_SYNC_TRIGGER_ELEM_COUNT', async () => {
    // INIT_SYNC_TRIGGER_ELEM_COUNT is mocked to 3
    const mockArangoDb = {
      query: jest.fn()
        // timestamp query returns 2 items (below threshold of 3)
        .mockResolvedValueOnce(createMockCursor(['ts1', 'ts2'])),
    };

    const mockEsClient = {
      index: jest.fn().mockResolvedValue({ result: 'created' }),
    };

    await initialSync({}, mockArangoDb, mockEsClient, ['element']);
    // Should only have the timestamp query, no bulk indexing
    expect(mockArangoDb.query).toHaveBeenCalledTimes(1);
    expect(mockEsClient.index).not.toHaveBeenCalled();
  });

  it('performs chunked sync when timestamps exceed threshold', async () => {
    // INIT_SYNC_TRIGGER_ELEM_COUNT=3, INIT_SYNC_CHUNK_SIZE=2
    // So 4 timestamps > 3 threshold, chunks at index 2
    const elementDoc = {
      _key: 'elem1',
      elem_id: 'e1',
      execution_id: 'exec1',
      tag_ids: [],
    };

    const mockArangoDb = {
      query: jest.fn()
        // timestamp query returns 4 items (above threshold of 3)
        .mockResolvedValueOnce(createMockCursor(['ts1', 'ts2', 'ts3', 'ts4']))
        // chunk query
        .mockResolvedValueOnce(createMockCursor([{ doc: elementDoc, timestamp: 'ts3' }]))
        // getElementData: execution, venue, runRecord
        .mockResolvedValueOnce(createMockCursor([{ execution_id: 'exec1' }]))
        .mockResolvedValueOnce(createMockCursor([]))
        .mockResolvedValueOnce(createMockCursor([])),
    };

    const mockEsClient = {
      index: jest.fn().mockResolvedValue({ result: 'created' }),
    };

    await initialSync({}, mockArangoDb, mockEsClient, ['element']);
    expect(mockEsClient.index).toHaveBeenCalled();
  });

  it('handles error during indexing', async () => {
    const logger = require('../utils/logger');
    const elementDoc = {
      _key: 'elem1',
      elem_id: 'e1',
      execution_id: 'exec1',
      tag_ids: [],
    };

    const mockArangoDb = {
      query: jest.fn()
        .mockResolvedValueOnce(createMockCursor(['ts1', 'ts2', 'ts3', 'ts4']))
        .mockResolvedValueOnce(createMockCursor([{ doc: elementDoc, timestamp: 'ts3' }]))
        .mockResolvedValueOnce(createMockCursor([{ execution_id: 'exec1' }]))
        .mockResolvedValueOnce(createMockCursor([]))
        .mockResolvedValueOnce(createMockCursor([])),
    };

    const mockEsClient = {
      index: jest.fn().mockRejectedValue(new Error('ES indexing failed')),
    };

    // Should not throw despite indexing error
    await expect(initialSync({}, mockArangoDb, mockEsClient, ['element'])).resolves.toBeDefined();
    expect(logger.error).toHaveBeenCalled();
  });

  it('updates lastTimestamps correctly', async () => {
    const elementDoc = {
      _key: 'elem1',
      elem_id: 'e1',
      execution_id: 'exec1',
      tag_ids: [],
    };

    const mockArangoDb = {
      query: jest.fn()
        .mockResolvedValueOnce(createMockCursor(['ts1', 'ts2', 'ts3', 'ts4']))
        .mockResolvedValueOnce(createMockCursor([{ doc: elementDoc, timestamp: '2023-06-15T00:00:00Z' }]))
        .mockResolvedValueOnce(createMockCursor([{ execution_id: 'exec1' }]))
        .mockResolvedValueOnce(createMockCursor([]))
        .mockResolvedValueOnce(createMockCursor([])),
    };

    const mockEsClient = {
      index: jest.fn().mockResolvedValue({ result: 'created' }),
    };

    const result = await initialSync({}, mockArangoDb, mockEsClient, ['element']);
    expect(result.element).toBe('2023-06-15T00:00:00Z');
  });
});

describe('incrementalSync', () => {
  it('syncs element collection successfully', async () => {
    const elementDoc = {
      _key: 'elem1',
      elem_id: 'e1',
      execution_id: 'exec1',
      tag_ids: [],
    };

    const mockArangoDb = {
      query: jest.fn()
        .mockResolvedValueOnce(createMockCursor([{ doc: elementDoc, timestamp: '2023-01-02T00:00:00Z' }]))
        .mockResolvedValueOnce(createMockCursor([{ execution_id: 'exec1' }]))
        .mockResolvedValueOnce(createMockCursor([]))
        .mockResolvedValueOnce(createMockCursor([])),
    };

    const mockEsClient = {
      index: jest.fn().mockResolvedValue({ result: 'created' }),
    };

    const result = await incrementalSync(
      { element: '2023-01-01T00:00:00Z' },
      mockArangoDb,
      mockEsClient,
      ['element'],
    );

    expect(result.element).toBe('2023-01-02T00:00:00Z');
    expect(mockEsClient.index).toHaveBeenCalledWith(
      expect.objectContaining({ index: 'element' }),
    );
  });

  it('syncs procedureElement collection successfully', async () => {
    const procElemDoc = {
      _key: 'pe1',
      procedure_id: 'p1',
      version_id: 'v1',
      tag_ids: [],
    };

    const mockArangoDb = {
      query: jest.fn()
        .mockResolvedValueOnce(createMockCursor([{ doc: procElemDoc, timestamp: '2023-02-01T00:00:00Z' }]))
        .mockResolvedValueOnce(createMockCursor([{ procedure_id: 'p1' }]))
        .mockResolvedValueOnce(createMockCursor([])),
    };

    const mockEsClient = {
      index: jest.fn().mockResolvedValue({ result: 'created' }),
    };

    const result = await incrementalSync({}, mockArangoDb, mockEsClient, ['procedureElement']);
    expect(result.procedureElement).toBe('2023-02-01T00:00:00Z');
    expect(mockEsClient.index).toHaveBeenCalledWith(
      expect.objectContaining({ index: 'procedure_element' }),
    );
  });

  it('handles error during indexing', async () => {
    const logger = require('../utils/logger');
    const elementDoc = {
      _key: 'elem1',
      elem_id: 'e1',
      execution_id: 'exec1',
      tag_ids: [],
    };

    const mockArangoDb = {
      query: jest.fn()
        .mockResolvedValueOnce(createMockCursor([{ doc: elementDoc, timestamp: '2023-01-01T00:00:00Z' }]))
        .mockResolvedValueOnce(createMockCursor([{ execution_id: 'exec1' }]))
        .mockResolvedValueOnce(createMockCursor([]))
        .mockResolvedValueOnce(createMockCursor([])),
    };

    const mockEsClient = {
      index: jest.fn().mockRejectedValue(new Error('ES error')),
    };

    await expect(incrementalSync({}, mockArangoDb, mockEsClient, ['element'])).resolves.toBeDefined();
    expect(logger.error).toHaveBeenCalled();
  });

  it('updates lastTimestamps for each processed document', async () => {
    const doc1 = { _key: 'e1', elem_id: 'e1', execution_id: 'exec1', tag_ids: [] };
    const doc2 = { _key: 'e2', elem_id: 'e2', execution_id: 'exec2', tag_ids: [] };

    const mockArangoDb = {
      query: jest.fn()
        .mockResolvedValueOnce(createMockCursor([
          { doc: doc1, timestamp: '2023-01-01T00:00:00Z' },
          { doc: doc2, timestamp: '2023-01-02T00:00:00Z' },
        ]))
        // getElementData for doc1
        .mockResolvedValueOnce(createMockCursor([{ execution_id: 'exec1' }]))
        .mockResolvedValueOnce(createMockCursor([]))
        .mockResolvedValueOnce(createMockCursor([]))
        // getElementData for doc2
        .mockResolvedValueOnce(createMockCursor([{ execution_id: 'exec2' }]))
        .mockResolvedValueOnce(createMockCursor([]))
        .mockResolvedValueOnce(createMockCursor([])),
    };

    const mockEsClient = {
      index: jest.fn().mockResolvedValue({ result: 'created' }),
    };

    const result = await incrementalSync({}, mockArangoDb, mockEsClient, ['element']);
    expect(result.element).toBe('2023-01-02T00:00:00Z');
  });
});
