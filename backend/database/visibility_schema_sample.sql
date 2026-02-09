CREATE TABLE executions_visibility (
  namespace_id CHAR(64) NOT NULL,
  run_id CHAR(64) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  execution_time TIMESTAMP NOT NULL,
  workflow_id VARCHAR(255) NOT NULL,
  workflow_type_name VARCHAR(255) NOT NULL,
  status INTEGER NOT NULL,
  close_time TIMESTAMP,
  history_length BIGINT,
  memo BYTEA,
  encoding VARCHAR(16),
  task_queue VARCHAR(255) DEFAULT '' NOT NULL,
  search_attributes JSONB,
  PRIMARY KEY (namespace_id, run_id)
);

CREATE INDEX idx_visibility_creation_time ON executions_visibility (namespace_id, start_time DESC, run_id);
CREATE INDEX idx_visibility_status ON executions_visibility (namespace_id, status, start_time DESC, run_id);

