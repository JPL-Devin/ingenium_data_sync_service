# ArangoDB to Elasticsearch Sync Service

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0) 
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)


A robust, production-ready data synchronization service that maintains real-time synchronization between ArangoDB and Elasticsearch. This service is part of the open-source **Ingenium** project ecosystem, designed to handle high-volume data transfers with incremental sync capabilities.

## 🚀 Features

- **Incremental Synchronization**: Efficiently syncs only changed documents using ArangoDB revision timestamps
- **Real-time Updates**: Continuous monitoring and syncing of data changes
- **Robust Error Handling**: Automatic retries and comprehensive error logging
- **Data Preprocessing**: Advanced document processing with date sanitization and field validation
- **Scalable Architecture**: Chunked processing for large datasets (500K+ documents)
- **Connection Resilience**: Automatic reconnection logic with configurable timeouts
- **Configurable Sync**: Environment-based configuration for different deployment scenarios
- **Production Ready**: Comprehensive logging with Winston and Docker support

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Environment Variables](#environment-variables)
- [Docker Deployment](#docker-deployment)
- [Data Flow](#data-flow)
- [Monitoring](#monitoring)
- [Contributing](#contributing)
- [License](#license)

## 🔧 Prerequisites

- **Node.js** 14.0 or higher
- **ArangoDB** 3.7+ instance
- **Elasticsearch** 7.x or 8.x cluster
- Network connectivity between all services

## 📦 Installation

### Installation
```bash
# Clone the repository
git clone https://github.com/OpenIngenium/data_sync_service.git 
cd data_sync_service

# Install dependencies
npm install
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# ArangoDB Configuration
ARANGO_URL=http://localhost:8529 <!-- TODO: Update default port if needed -->
ARANGO_USER=root
ARANGO_ROOT_PASSWORD=your_password <!-- TODO: Use secure password in production -->
ARANGO_DB_NAME=ingenium

# Elasticsearch Configuration  
ES_HOST=localhost
ES_PORT=9200 <!-- TODO: Update default port if needed -->

# Sync Configuration
SYNC_INTERVAL_SECS=30
INIT_SYNC_DELAY_SECS=60
INIT_SYNC_TRIGGER_ELEM_COUNT=500000
INIT_SYNC_CHUNK_SIZE=100000

# Logging
LOG_LEVEL=info
```

### Collection Configuration

By default, the service syncs these Ingenium collections:
- `element` - Core procedural elements
- `procedureElement` - Procedure-specific elements

To customize collections, modify `config/config.js`:

```javascript
ARANGO_COLLECTION_NAMES: ['your_collection1', 'your_collection2']
```

## 🚀 Usage

### Basic Usage

```bash
# Start the sync service
npm start

# Development mode with auto-restart
npm run dev
```



### Sync Process

1. **Connection Phase**: Establishes connections to ArangoDB and Elasticsearch
2. **Initial Sync**: Processes historical data (chunked for large datasets)
3. **Incremental Sync**: Continuous monitoring for changes every 30 seconds
4. **Data Processing**: Documents are preprocessed before indexing:
   - Date field sanitization
   - Field validation and transformation
   - Related data enrichment (for Ingenium collections)

## 🌍 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ARANGO_URL` | `http://127.0.0.1:18529` | ArangoDB connection URL |
| `ARANGO_USER` | `root` | ArangoDB username |
| `ARANGO_ROOT_PASSWORD` | `password` | ArangoDB password |
| `ARANGO_DB_NAME` | `ingenium` | Target database name |
| `ES_HOST` | `127.0.0.1` | Elasticsearch host |
| `ES_PORT` | `19200` | Elasticsearch port |
| `SYNC_INTERVAL_SECS` | `30` | Sync check interval |
| `INIT_SYNC_DELAY_SECS` | `60` | Delay before initial sync |
| `INIT_SYNC_TRIGGER_ELEM_COUNT` | `500000` | Threshold for chunked sync |
| `INIT_SYNC_CHUNK_SIZE` | `100000` | Documents per chunk |
| `LOG_LEVEL` | `info` | Logging level |

## 🐳 Docker Deployment

### Using Docker Compose

```yaml
version: '3.8'
services:
  arangodb-es-sync:
    image: data-sync-service:latest <!-- TODO: Build Docker image -->
    environment:
      - ARANGO_URL=http://arangodb:8529
      - ES_HOST=elasticsearch
      - ARANGO_ROOT_PASSWORD=${ARANGO_PASSWORD}
    depends_on:
      - arangodb
      - elasticsearch
    restart: unless-stopped
```

### Building the Image

```bash
docker build -t data-sync-service .
```


## 📈 Monitoring

### Logs

The service provides structured JSON logging:

```json
{
  "timestamp": "2023-01-01T00:00:00.000Z",
  "level": "INFO",
  "message": "Processing collection: element, lastTimestamp: 2023-01-01"
}
```

### Health Checks

Monitor these key metrics:
- Database connection status
- Sync lag time
- Document processing rate
- Error frequency

### Elasticsearch Indices

- `element` - Processed element documents
- `procedure_element` - Processed procedure element documents  
- `syncdata` - Metadata and sync timestamps


### Development Setup

```bash
# Clone and setup
git clone https://github.com/OpenIngenium/data_sync_service.git
cd data_sync_service
npm install

# Run tests
npm test <!-- TODO: Set up proper test suite -->

# Lint code
npm run lint <!-- TODO: Add linting configuration -->
```

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

