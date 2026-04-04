package com.runningmap.backend.streets;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StreetCoverageService {

    // ~15m en degrés à 45°N — plus rapide que le cast ::geography
    private static final double BUFFER_DEGREES = 0.000135;
    // Longueur minimale (en mètres) de la rue devant tomber dans le buffer pour être comptabilisée
    private static final double MIN_COVERED_METERS = 30;

    private final JdbcTemplate jdbcTemplate;

    public void computeCoverageForUser(UUID userId) {
        log.info("Computing street coverage for user {}", userId);

        // Backfill des activités importées avant l'ajout de track_geom / track_geom_simplified
        int backfilled = jdbcTemplate.update(
            "UPDATE activities SET " +
            "  track_geom = ST_MakeLine(" +
            "    array(SELECT ST_SetSRID(ST_MakePoint((c->>1)::float, (c->>0)::float), 4326)" +
            "          FROM jsonb_array_elements(latlng_stream) c)" +
            ")," +
            "  track_geom_simplified = ST_Simplify(ST_MakeLine(" +
            "    array(SELECT ST_SetSRID(ST_MakePoint((c->>1)::float, (c->>0)::float), 4326)" +
            "          FROM jsonb_array_elements(latlng_stream) c)" +
            "), 0.0001) " +
            "WHERE user_id = ?" +
            "  AND latlng_stream IS NOT NULL" +
            "  AND jsonb_array_length(latlng_stream) >= 2" +
            "  AND track_geom IS NULL",
            userId
        );
        if (backfilled > 0) {
            log.debug("Backfilled track_geom for {} existing activities", backfilled);
        }

        // Backfill track_geom_simplified pour les activités qui ont track_geom mais pas la version simplifiée
        int simplifiedBackfilled = jdbcTemplate.update(
            "UPDATE activities SET track_geom_simplified = ST_Simplify(track_geom, 0.0001) " +
            "WHERE user_id = ? AND track_geom IS NOT NULL AND track_geom_simplified IS NULL",
            userId
        );
        if (simplifiedBackfilled > 0) {
            log.debug("Backfilled track_geom_simplified for {} existing activities", simplifiedBackfilled);
        }

        // Nombre d'activités nouvelles à traiter
        Integer pending = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM activities WHERE user_id = ? AND track_geom IS NOT NULL AND streets_computed_at IS NULL",
            Integer.class, userId
        );
        log.debug("Activities pending street coverage: {}", pending);

        if (pending == null || pending == 0) {
            log.info("No new activities to process for user {}", userId);
            return;
        }

        // Log les noms des activités qui vont être traitées
        jdbcTemplate.query(
            "SELECT name, strava_activity_id FROM activities " +
            "WHERE user_id = ? AND track_geom IS NOT NULL AND streets_computed_at IS NULL " +
            "ORDER BY start_date",
            (rs) -> {
                log.debug("  → Computing streets for: \"{}\" (Strava ID: {})",
                        rs.getString("name"), rs.getLong("strava_activity_id"));
            },
            userId
        );

        // Calcul de couverture : seulement les activités pas encore traitées.
        // - ST_DWithin sur track_geom (original) active le GIST index (pré-filtre rapide)
        // - ST_Buffer + ST_Intersection sur track_geom_simplified (100-300 pts vs 3000-6000)
        // - ST_Length en géométrie plane (* 111320) évite le cast ::geography coûteux
        int inserted = jdbcTemplate.update(
            "INSERT INTO covered_streets (user_id, street_id) " +
            "SELECT DISTINCT ?, s.id " +
            "FROM (" +
            "  SELECT id, track_geom, track_geom_simplified, streets_computed_at," +
            "         ST_Buffer(track_geom_simplified, ?) AS track_buffer" +
            "  FROM activities" +
            "  WHERE user_id = ? AND track_geom IS NOT NULL AND streets_computed_at IS NULL" +
            ") a " +
            "JOIN osm_streets s ON ST_DWithin(s.geom, a.track_geom, ?) " +
            "WHERE ST_Length(ST_Intersection(a.track_buffer, s.geom)) * 111320 >= ? " +
            "ON CONFLICT DO NOTHING",
            userId, BUFFER_DEGREES, userId, BUFFER_DEGREES, MIN_COVERED_METERS
        );

        jdbcTemplate.update(
            "UPDATE activities SET streets_computed_at = NOW() " +
            "WHERE user_id = ? AND track_geom IS NOT NULL AND streets_computed_at IS NULL",
            userId
        );

        log.info("Coverage computed for user {}: {} activities processed, {} new street mappings", userId, pending, inserted);
    }
}
