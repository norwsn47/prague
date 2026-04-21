CREATE TABLE IF NOT EXISTS spectator_points (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL DEFAULT '',
  comment     TEXT NOT NULL DEFAULT '',
  lat         REAL NOT NULL,
  lon         REAL NOT NULL,
  distance_m  REAL NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
