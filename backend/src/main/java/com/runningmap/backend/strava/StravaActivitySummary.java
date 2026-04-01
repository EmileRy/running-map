package com.runningmap.backend.strava;

import com.fasterxml.jackson.annotation.JsonProperty;

public record StravaActivitySummary(
        long id,
        String name,
        @JsonProperty("start_date") String startDate,
        @JsonProperty("sport_type") String sportType
) {
    public boolean isRun() {
        return "Run".equalsIgnoreCase(sportType);
    }
}
