package com.runningmap.backend.streets;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/streets")
@RequiredArgsConstructor
public class StreetsController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/covered")
    public ResponseEntity<List<StreetDto>> getCoveredStreets(Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();

        List<StreetDto> streets = jdbcTemplate.query(
                "SELECT s.id, s.zone, s.name, ST_AsText(s.geom) as wkt, c.first_run_at, c.last_run_at " +
                "FROM osm_streets s " +
                "JOIN covered_streets c ON s.id = c.street_id " +
                "WHERE c.user_id = ?",
                streetRowMapper(),
                userId
        );

        return ResponseEntity.ok(streets);
    }

    @GetMapping("/zones")
    public ResponseEntity<List<ZoneDto>> getZones(Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();

        List<ZoneDto> zones = jdbcTemplate.query(
                "SELECT s.zone, " +
                "       COUNT(DISTINCT c.street_id) AS covered, " +
                "       COUNT(DISTINCT s.id)        AS total " +
                "FROM osm_streets s " +
                "LEFT JOIN covered_streets c ON s.id = c.street_id AND c.user_id = ? " +
                "WHERE s.zone IN (" +
                "  SELECT DISTINCT os.zone FROM osm_streets os " +
                "  JOIN covered_streets cs ON os.id = cs.street_id " +
                "  WHERE cs.user_id = ?" +
                ") " +
                "GROUP BY s.zone " +
                "ORDER BY s.zone",
                (rs, rowNum) -> {
                    String zone = rs.getString("zone");
                    long covered = rs.getLong("covered");
                    long total = rs.getLong("total");
                    double pct = total > 0 ? Math.round(covered * 1000.0 / total) / 10.0 : 0.0;
                    return new ZoneDto(zone, covered, total, pct);
                },
                userId, userId
        );

        return ResponseEntity.ok(zones);
    }

    @GetMapping("/coverage")
    public ResponseEntity<CoverageDto> getCoverage(
            Authentication authentication,
            @RequestParam String zone
    ) {
        UUID userId = (UUID) authentication.getPrincipal();

        Map<String, Object> result = jdbcTemplate.queryForMap(
                "SELECT " +
                "  COUNT(DISTINCT c.street_id) as covered, " +
                "  COUNT(DISTINCT s.id) as total " +
                "FROM osm_streets s " +
                "LEFT JOIN covered_streets c ON s.id = c.street_id AND c.user_id = ? " +
                "WHERE s.zone = ?",
                userId, zone
        );

        long covered = ((Number) result.get("covered")).longValue();
        long total = ((Number) result.get("total")).longValue();
        double pct = total > 0 ? Math.round(covered * 1000.0 / total) / 10.0 : 0.0;

        return ResponseEntity.ok(new CoverageDto(zone, covered, total, pct));
    }

    private RowMapper<StreetDto> streetRowMapper() {
        return (rs, rowNum) -> {
            String id = String.valueOf(rs.getLong("id"));
            String zone = rs.getString("zone");
            String name = rs.getString("name");
            String wkt = rs.getString("wkt");
            java.sql.Timestamp firstRunAt = rs.getTimestamp("first_run_at");
            java.sql.Timestamp lastRunAt = rs.getTimestamp("last_run_at");
            return new StreetDto(id, zone, name, parseWkt(wkt),
                    firstRunAt != null ? firstRunAt.toLocalDateTime() : null,
                    lastRunAt  != null ? lastRunAt.toLocalDateTime()  : null);
        };
    }

    private List<List<Double>> parseWkt(String wkt) {
        // "LINESTRING(lon1 lat1, lon2 lat2, ...)" → [[lat1, lon1], ...]
        if (wkt == null || !wkt.startsWith("LINESTRING(")) return List.of();
        String inner = wkt.substring(11, wkt.length() - 1);
        return Arrays.stream(inner.split(","))
                .map(String::trim)
                .map(pair -> {
                    String[] parts = pair.split(" ");
                    double lon = Double.parseDouble(parts[0]);
                    double lat = Double.parseDouble(parts[1]);
                    return List.<Double>of(lat, lon);
                })
                .collect(Collectors.toList());
    }

    public record StreetDto(String id, String zone, String name, List<List<Double>> coordinates,
                            java.time.LocalDateTime firstRunAt, java.time.LocalDateTime lastRunAt) {}
    public record ZoneDto(String name, long covered, long total, double percentage) {}
    public record CoverageDto(String zone, long covered, long total, double percentage) {}
}
