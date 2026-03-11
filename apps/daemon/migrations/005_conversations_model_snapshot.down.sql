DROP INDEX IF EXISTS idx_conversations_workspace_updated_at;
DROP INDEX IF EXISTS idx_conversations_agent_updated_at;

CREATE TABLE conversations_rollback (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  session_key TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT
);

INSERT INTO conversations_rollback (
  id,
  agent_id,
  workspace_id,
  session_key,
  title,
  status,
  created_at,
  updated_at,
  archived_at
)
SELECT
  id,
  agent_id,
  workspace_id,
  session_key,
  title,
  status,
  created_at,
  updated_at,
  archived_at
FROM conversations;

DROP TABLE conversations;
ALTER TABLE conversations_rollback RENAME TO conversations;

CREATE INDEX idx_conversations_agent_updated_at
  ON conversations(agent_id, updated_at DESC);

CREATE INDEX idx_conversations_workspace_updated_at
  ON conversations(workspace_id, updated_at DESC);
