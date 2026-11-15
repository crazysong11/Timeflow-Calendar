CREATE TABLE events (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 120),
    start_ms INTEGER NOT NULL,
    end_ms INTEGER NOT NULL CHECK(end_ms > start_ms),
    notes TEXT NOT NULL DEFAULT '' CHECK(length(notes) <= 4000),
    color TEXT NOT NULL DEFAULT 'sage' CHECK(color IN ('sage', 'blue', 'peach', 'lavender')),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
CREATE INDEX events_time_range ON events(start_ms, end_ms);
