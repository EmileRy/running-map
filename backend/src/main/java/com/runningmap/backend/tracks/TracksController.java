package com.runningmap.backend.tracks;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.runningmap.backend.activity.Activity;
import com.runningmap.backend.activity.ActivityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tracks")
@RequiredArgsConstructor
@Slf4j
public class TracksController {

    private static final int MAX_PAGE_SIZE = 200;
    private static final TypeReference<List<List<Double>>> LATLNG_TYPE = new TypeReference<>() {};

    private final ActivityRepository activityRepository;
    private final ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<Page<TrackDto>> getTracks(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size
    ) {
        UUID userId = (UUID) authentication.getPrincipal();
        PageRequest pageable = PageRequest.of(page, Math.min(size, MAX_PAGE_SIZE),
                Sort.by(Sort.Direction.DESC, "startDate"));

        Page<TrackDto> tracks = activityRepository.findByUserId(userId, pageable)
                .map(this::toDto);

        return ResponseEntity.ok(tracks);
    }

    private TrackDto toDto(Activity activity) {
        List<List<Double>> coordinates = Collections.emptyList();
        if (activity.getLatlngStream() != null) {
            try {
                coordinates = objectMapper.readValue(activity.getLatlngStream(), LATLNG_TYPE);
            } catch (Exception e) {
                log.warn("Failed to parse latlng for activity {}", activity.getId(), e);
            }
        }
        return new TrackDto(
                activity.getId(),
                activity.getStravaActivityId(),
                activity.getName(),
                activity.getStartDate(),
                coordinates
        );
    }

    public record TrackDto(
            UUID id,
            Long stravaActivityId,
            String name,
            LocalDateTime startDate,
            List<List<Double>> coordinates
    ) {}
}
