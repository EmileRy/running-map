ALTER TABLE activities ADD COLUMN track_geom GEOMETRY(LINESTRING, 4326);
CREATE INDEX idx_activities_track_geom ON activities USING GIST(track_geom);

ALTER TABLE activities ADD COLUMN streets_computed_at TIMESTAMP;
