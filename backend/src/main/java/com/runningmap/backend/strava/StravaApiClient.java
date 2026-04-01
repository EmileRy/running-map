package com.runningmap.backend.strava;

import com.runningmap.backend.auth.AuthService;
import com.runningmap.backend.auth.User;
import com.runningmap.backend.config.StravaProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
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

    /**
     * @param after only return activities after this date (null = all activities)
     */
    public List<StravaActivitySummary> getActivities(User user, int page, LocalDateTime after)
            throws InterruptedException {
        user = authService.ensureFreshToken(user);
        rateLimiter.acquire(user.getId());

        String uri = stravaProperties.getApiBaseUrl() + "/athlete/activities?per_page=200&page=" + page;
        if (after != null) {
            uri += "&after=" + after.toEpochSecond(ZoneOffset.UTC);
        }

        List<StravaActivitySummary> result = webClientBuilder.build()
                .get()
                .uri(uri)
                .header("Authorization", "Bearer " + user.getAccessToken())
                .retrieve()
                .onStatus(HttpStatusCode::is5xxServerError,
                        res -> Mono.error(new StravaTransientException("Strava 5xx: " + res.statusCode())))
                .onStatus(status -> status.value() == 429,
                        res -> Mono.error(new StravaTransientException("Strava 429 rate limit")))
                .bodyToMono(new ParameterizedTypeReference<List<StravaActivitySummary>>() {})
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(2))
                        .filter(e -> e instanceof StravaTransientException)
                        .doBeforeRetry(ctx -> log.warn("Retrying getActivities (attempt {})", ctx.totalRetries() + 1)))
                .block();

        return result != null ? result : List.of();
    }

    public Optional<List<List<Double>>> getLatlngStream(User user, long activityId)
            throws InterruptedException {
        user = authService.ensureFreshToken(user);
        rateLimiter.acquire(user.getId());

        List<StravaStreamResponse> streams = webClientBuilder.build()
                .get()
                .uri(stravaProperties.getApiBaseUrl() + "/activities/" + activityId + "/streams?keys=latlng")
                .header("Authorization", "Bearer " + user.getAccessToken())
                .retrieve()
                .onStatus(status -> status.value() == 404,
                        res -> Mono.error(new StravaNotFoundException("Activity " + activityId + " not found")))
                .onStatus(HttpStatusCode::is5xxServerError,
                        res -> Mono.error(new StravaTransientException("Strava 5xx: " + res.statusCode())))
                .onStatus(status -> status.value() == 429,
                        res -> Mono.error(new StravaTransientException("Strava 429 rate limit")))
                .bodyToMono(new ParameterizedTypeReference<List<StravaStreamResponse>>() {})
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(2))
                        .filter(e -> e instanceof StravaTransientException)
                        .doBeforeRetry(ctx -> log.warn("Retrying getLatlngStream {} (attempt {})", activityId, ctx.totalRetries() + 1)))
                .onErrorResume(StravaNotFoundException.class, e -> {
                    log.debug("No stream for activity {}", activityId);
                    return Mono.empty();
                })
                .block();

        if (streams == null) return Optional.empty();

        return streams.stream()
                .filter(s -> "latlng".equals(s.type()))
                .map(StravaStreamResponse::asLatlng)
                .filter(d -> !d.isEmpty())
                .findFirst();
    }

    static class StravaTransientException extends RuntimeException {
        StravaTransientException(String msg) { super(msg); }
    }

    static class StravaNotFoundException extends RuntimeException {
        StravaNotFoundException(String msg) { super(msg); }
    }
}
