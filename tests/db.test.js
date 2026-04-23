jest.mock('arangojs', () => ({
  Database: jest.fn().mockImplementation((opts) => ({
    url: opts.url,
    databaseName: opts.databaseName,
    auth: opts.auth,
  })),
}));

jest.mock('@elastic/elasticsearch', () => ({
  Client: jest.fn().mockImplementation((opts) => ({
    node: opts.node,
  })),
}));

jest.mock('../config/config', () => ({
  ARANGO_URL: 'http://test-arango:8529',
  ARANGO_USER: 'testuser',
  ARANGO_PASSWORD: 'testpass',
  ARANGO_DB_NAME: 'testdb',
  ES_HOST: 'test-es',
  ES_PORT: 9200,
  LOG_LEVEL: 'info',
}));

describe('db', () => {
  let getArangoDb, getEsClient;

  beforeEach(() => {
    jest.resetModules();

    jest.mock('arangojs', () => ({
      Database: jest.fn().mockImplementation((opts) => ({
        url: opts.url,
        databaseName: opts.databaseName,
        auth: opts.auth,
      })),
    }));

    jest.mock('@elastic/elasticsearch', () => ({
      Client: jest.fn().mockImplementation((opts) => ({
        node: opts.node,
      })),
    }));

    const db = require('../db/db');
    getArangoDb = db.getArangoDb;
    getEsClient = db.getEsClient;
  });

  it('initializes ArangoDB with config values', async () => {
    const { Database } = require('arangojs');
    const arangoDb = await getArangoDb();

    expect(Database).toHaveBeenCalledWith({
      url: 'http://test-arango:8529',
      databaseName: 'testdb',
      auth: { username: 'testuser', password: 'testpass' },
    });
    expect(arangoDb).toBeDefined();
  });

  it('initializes Elasticsearch client with config values', async () => {
    const { Client } = require('@elastic/elasticsearch');
    const esClient = await getEsClient();

    expect(Client).toHaveBeenCalledWith({ node: 'http://test-es:9200' });
    expect(esClient).toBeDefined();
  });
});
