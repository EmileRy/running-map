package com.runningmap.backend.strava;

import java.util.List;

public record StravaStreamResponse(
        String type,
        List<List<Double>> data
) {}
