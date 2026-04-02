package com.runningmap.backend.osm;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OsmImportService {

    private final OverpassService overpassService;
    private final JdbcTemplate jdbcTemplate;

    public int importZone(String zone) {
        log.info("Fetching OSM streets for zone: {}", zone);
        List<OverpassService.OverpassWay> ways = overpassService.fetchWaysForZone(zone);
        log.info("Fetched {} ways for zone {}", ways.size(), zone);

        int inserted = 0;
        for (OverpassService.OverpassWay way : ways) {
            String wkt = toWkt(way.nodes());
            if (wkt == null) continue;
            try {
                int rows = jdbcTemplate.update(
                        "INSERT INTO osm_streets (id, zone, name, geom) " +
                        "VALUES (?, ?, ?, ST_SetSRID(ST_GeomFromText(?), 4326)) " +
                        "ON CONFLICT (id) DO NOTHING",
                        way.id(), zone, way.name(), wkt
                );
                inserted += rows;
            } catch (Exception e) {
                log.warn("Failed to insert street {}: {}", way.id(), e.getMessage());
            }
        }

        log.info("Inserted {} streets for zone {}", inserted, zone);
        return inserted;
    }

    private String toWkt(List<OverpassService.OverpassNode> nodes) {
        if (nodes == null || nodes.size() < 2) return null;
        // WKT uses lon lat order
        String coords = nodes.stream()
                .map(n -> n.lon() + " " + n.lat())
                .collect(Collectors.joining(", "));
        return "LINESTRING(" + coords + ")";
    }
}
