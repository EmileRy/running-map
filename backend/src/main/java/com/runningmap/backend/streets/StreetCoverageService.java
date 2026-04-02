package com.runningmap.backend.streets;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.runningmap.backend.activity.Activity;
import com.runningmap.backend.activity.ActivityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StreetCoverageService {

    private static final TypeReference<List<List<Double>>> LATLNG_TYPE = new TypeReference<>() {};
    private static final int BUFFER_METERS = 15;

    private final ActivityRepository activityRepository;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public void computeCoverageForUser(UUID userId) {
        log.info("Computing street coverage for user {}", userId);
        int page = 0;
        int processed = 0;

        while (true) {
            Page<Activity> activities = activityRepository.findByUserId(
                    userId, PageRequest.of(page, 100, Sort.by("startDate")));

            for (Activity activity : activities.getContent()) {
                if (activity.getLatlngStream() == null) continue;
                try {
                    List<List<Double>> coords = objectMapper.readValue(
                            activity.getLatlngStream(), LATLNG_TYPE);
                    if (coords.size() < 2) continue;
                    String wkt = toWkt(coords);
                    jdbcTemplate.update(
                            "INSERT INTO covered_streets (user_id, street_id) " +
                            "SELECT DISTINCT ?, s.id FROM osm_streets s " +
                            "WHERE ST_DWithin(s.geom::geography, ST_SetSRID(ST_GeomFromText(?), 4326)::geography, ?) " +
                            "ON CONFLICT DO NOTHING",
                            userId, wkt, BUFFER_METERS
                    );
                    processed++;
                } catch (Exception e) {
                    log.warn("Failed to compute coverage for activity {}: {}", activity.getId(), e.getMessage());
                }
            }

            if (activities.isLast()) break;
            page++;
        }

        log.info("Coverage computed for user {} ({} activities processed)", userId, processed);
    }

    private String toWkt(List<List<Double>> coords) {
        // coords are [lat, lon]; WKT expects lon lat
        return "LINESTRING(" + coords.stream()
                .map(c -> c.get(1) + " " + c.get(0))
                .collect(Collectors.joining(", ")) + ")";
    }
}
