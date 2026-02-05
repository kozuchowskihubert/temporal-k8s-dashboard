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

-- Additional tables would go here (shards, transfer_tasks, timer_tasks, etc.)
-- NOTE: In production, rely on Temporal's auto-schema management.
