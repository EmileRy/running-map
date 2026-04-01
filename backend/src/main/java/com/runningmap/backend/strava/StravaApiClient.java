package com.runningmap.backend.strava;

import com.runningmap.backend.auth.AuthService;
import com.runningmap.backend.auth.User;
import com.runningmap.backend.config.StravaProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class StravaApiClient {

    private final WebClient.Builder webClientBuilder;
    private final StravaProperties stravaProperties;
    private final AuthService authService;
    private final StravaRateLimiter rateLimiter;

    public List<StravaActivitySummary> getActivities(User user, int page) throws InterruptedException {
        user = authService.ensureFreshToken(user);
        rateLimiter.acquire(user.getId());

        List<StravaActivitySummary> result = webClientBuilder.build()
                .get()
                .uri(stravaProperties.getApiBaseUrl() + "/athlete/activities?per_page=200&page=" + page)
                .header("Authorization", "Bearer " + user.getAccessToken())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<StravaActivitySummary>>() {})
                .block();

        return result != null ? result : List.of();
    }

    public Optional<List<List<Double>>> getLatlngStream(User user, long activityId) throws InterruptedException {
        user = authService.ensureFreshToken(user);
        rateLimiter.acquire(user.getId());

        List<StravaStreamResponse> streams = webClientBuilder.build()
                .get()
                .uri(stravaProperties.getApiBaseUrl() + "/activities/" + activityId + "/streams?keys=latlng")
                .header("Authorization", "Bearer " + user.getAccessToken())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<StravaStreamResponse>>() {})
                .block();

        if (streams == null) return Optional.empty();

        return streams.stream()
                .filter(s -> "latlng".equals(s.type()))
                .map(StravaStreamResponse::data)
                .filter(d -> d != null && !d.isEmpty())
                .findFirst();
    }
}
