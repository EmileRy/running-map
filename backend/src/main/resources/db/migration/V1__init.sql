CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE import_status AS ENUM ('PENDING', 'RUNNING', 'DONE', 'ERROR');

CREATE TABLE users (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strava_id        BIGINT NOT NULL UNIQUE,
    firstname        VARCHAR(100),
    lastname         VARCHAR(100),
    profile_picture  TEXT,
    access_token     TEXT NOT NULL,
    refresh_token    TEXT NOT NULL,
    token_expires_at TIMESTAMP NOT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE activities (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    strava_activity_id  BIGINT NOT NULL,
    name                VARCHAR(255),
    start_date          TIMESTAMP,
    latlng_stream       JSONB,
    synced_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, strava_activity_id)
);

CREATE INDEX idx_activities_user_id ON activities(user_id);

CREATE TABLE import_jobs (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status                import_status NOT NULL DEFAULT 'PENDING',
    total_activities      INT DEFAULT 0,
    processed_activities  INT DEFAULT 0,
    error_message         TEXT,
    started_at            TIMESTAMP,
    completed_at          TIMESTAMP,
    created_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_import_jobs_user_id ON import_jobs(user_id);
