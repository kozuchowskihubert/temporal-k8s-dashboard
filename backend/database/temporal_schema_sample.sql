-- Temporal Default Store Schema (Sample)
-- This schema is typically managed automatically by the Temporal Server or schema-tools.
-- Provided here for reference as requested.

CREATE TABLE executions (
  shard_id INTEGER NOT NULL,
  namespace_id CHAR(64) NOT NULL,
  workflow_id VARCHAR(255) NOT NULL,
  run_id CHAR(64) NOT NULL,
  next_event_id BIGINT,
  last_write_version BIGINT,
  data BYTEA,
  data_encoding VARCHAR(16),
  state BYTEA,
  state_encoding VARCHAR(16),
  PRIMARY KEY (shard_id, namespace_id, workflow_id, run_id)
);

CREATE TABLE current_executions (
  shard_id INTEGER NOT NULL,
  namespace_id CHAR(64) NOT NULL,
  workflow_id VARCHAR(255) NOT NULL,
  run_id CHAR(64) NOT NULL,
  create_request_id VARCHAR(64) NOT NULL,
  state INTEGER NOT NULL,
  status INTEGER NOT NULL,
  start_version BIGINT,
  last_write_version BIGINT,
  PRIMARY KEY (shard_id, namespace_id, workflow_id)
);

CREATE TABLE shards (
  shard_id INTEGER NOT NULL,
  range_id BIGINT NOT NULL,
  data BYTEA,
  data_encoding VARCHAR(16),
  PRIMARY KEY (shard_id)
);

CREATE TABLE transfer_tasks (
  shard_id INTEGER NOT NULL,
  task_id BIGINT NOT NULL,
  data BYTEA,
  data_encoding VARCHAR(16),
  PRIMARY KEY (shard_id, task_id)
);

CREATE TABLE timer_tasks (
  shard_id INTEGER NOT NULL,
  visibility_timestamp TIMESTAMP NOT NULL,
  task_id BIGINT NOT NULL,
  data BYTEA,
  data_encoding VARCHAR(16),
  PRIMARY KEY (shard_id, visibility_timestamp, task_id)
);

CREATE TABLE replication_tasks (
  shard_id INTEGER NOT NULL,
  task_id BIGINT NOT NULL,
  data BYTEA,
  data_encoding VARCHAR(16),
  PRIMARY KEY (shard_id, task_id)
);

CREATE TABLE namespaces (
  id CHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_global BOOLEAN NOT NULL,
  data BYTEA,
  data_encoding VARCHAR(16),
  PRIMARY KEY (id)
);

-- NOTE: In production, rely on Temporal's auto-schema management.
