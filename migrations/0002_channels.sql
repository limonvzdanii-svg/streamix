CREATE TABLE channels (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 2 AND 60),
  slug TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK(length(slug) BETWEEN 3 AND 40),
  description TEXT NOT NULL DEFAULT '' CHECK(length(description) <= 300),
  stream_key_hash TEXT NOT NULL UNIQUE,
  stream_key_iv TEXT NOT NULL,
  stream_key_ciphertext TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_channels_owner_created ON channels(owner_id, created_at DESC);
