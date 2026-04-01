package com.runningmap.backend.auth;

import com.fasterxml.jackson.annotation.JsonProperty;

public record StravaTokenResponse(
        @JsonProperty("access_token") String accessToken,
        @JsonProperty("refresh_token") String refreshToken,
        @JsonProperty("expires_at") long expiresAt,
        Athlete athlete
) {
    public record Athlete(
            long id,
            String firstname,
            String lastname,
            String profile
    ) {}
}
