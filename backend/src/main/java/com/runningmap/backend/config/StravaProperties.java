package com.runningmap.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "strava")
@Getter
@Setter
public class StravaProperties {
    private String clientId;
    private String clientSecret;
    private String redirectUri;
    private String authUrl;
    private String tokenUrl;
    private String apiBaseUrl;
    private RateLimit rateLimit = new RateLimit();
    private int maxActivitiesPerImport = 0; // 0 = illimité

    @Getter
    @Setter
    public static class RateLimit {
        private int requestsPer15min = 95;
        private int requestsPerDay = 950;
    }
}
