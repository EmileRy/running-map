CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE osm_streets (
    id      BIGINT PRIMARY KEY,
    zone    TEXT NOT NULL,
    name    TEXT,
    geom    GEOMETRY(LINESTRING, 4326) NOT NULL
);
CREATE INDEX idx_osm_streets_geom ON osm_streets USING GIST(geom);
CREATE INDEX idx_osm_streets_zone ON osm_streets(zone);

CREATE TABLE covered_streets (
    user_id    UUID   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    street_id  BIGINT NOT NULL REFERENCES osm_streets(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, street_id)
);
CREATE INDEX idx_covered_streets_user_id ON covered_streets(user_id);
