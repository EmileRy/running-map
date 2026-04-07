ALTER TABLE activities ADD COLUMN track_geom_simplified GEOMETRY(LINESTRING, 4326);
CREATE INDEX idx_activities_track_geom_simplified ON activities USING GIST(track_geom_simplified);
