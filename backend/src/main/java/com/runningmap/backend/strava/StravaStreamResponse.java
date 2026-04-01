package com.runningmap.backend.strava;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;

public record StravaStreamResponse(
        String type,
        List<JsonNode> data
) {
    public List<List<Double>> asLatlng() {
        if (data == null) return List.of();
        return data.stream()
                .filter(JsonNode::isArray)
                .map(node -> List.of(node.get(0).asDouble(), node.get(1).asDouble()))
                .toList();
    }
}
