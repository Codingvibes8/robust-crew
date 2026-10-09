-- Plainread Database Schema (PostgreSQL)

CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR(64) PRIMARY KEY,
  owner_id VARCHAR(64) NOT NULL,
  title TEXT NOT NULL,
  paragraphs JSONB NOT NULL,
  word_count INT NOT NULL,
  source_type VARCHAR(16) NOT NULL, -- 'paste' | 'url' | 'file'
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);

CREATE TABLE IF NOT EXISTS simplifications (
  id VARCHAR(64) PRIMARY KEY,
  doc_id VARCHAR(64) NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  level VARCHAR(16) NOT NULL, -- 'lighter' | 'simpler' | 'summary'
  items JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_doc_level UNIQUE(doc_id, level)
);

CREATE INDEX IF NOT EXISTS idx_simplifications_doc ON simplifications(doc_id);

CREATE TABLE IF NOT EXISTS usage_records (
  anon_id VARCHAR(64) NOT NULL,
  doc_id VARCHAR(64) NOT NULL,
  day_date VARCHAR(10) NOT NULL, -- 'YYYY-MM-DD'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (anon_id, doc_id, day_date)
);

CREATE INDEX IF NOT EXISTS idx_usage_anon_day ON usage_records(anon_id, day_date);
