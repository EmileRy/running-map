package com.runningmap.backend.strava;

import com.runningmap.backend.config.StravaProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class StravaRateLimiter {

    private final StravaProperties properties;

    private final ConcurrentHashMap<UUID, Deque<Instant>> windows15min = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<UUID, Deque<Instant>> windowsDay = new ConcurrentHashMap<>();

    public synchronized void acquire(UUID userId) throws InterruptedException {
        Deque<Instant> w15 = windows15min.computeIfAbsent(userId, k -> new ArrayDeque<>());
        Deque<Instant> wDay = windowsDay.computeIfAbsent(userId, k -> new ArrayDeque<>());

        int limit15 = properties.getRateLimit().getRequestsPer15min();
        int limitDay = properties.getRateLimit().getRequestsPerDay();

        purge(w15, 15, ChronoUnit.MINUTES);
        purge(wDay, 24, ChronoUnit.HOURS);

        if (w15.size() >= limit15) {
            Instant waitUntil = w15.peekFirst().plus(15, ChronoUnit.MINUTES).plusMillis(200);
            long ms = Duration.between(Instant.now(), waitUntil).toMillis();
            if (ms > 0) {
                log.info("Rate limit 15min reached for user {}, waiting {}ms", userId, ms);
                Thread.sleep(ms);
            }
            purge(w15, 15, ChronoUnit.MINUTES);
        }

        if (wDay.size() >= limitDay) {
            Instant waitUntil = wDay.peekFirst().plus(24, ChronoUnit.HOURS).plusMillis(200);
            long ms = Duration.between(Instant.now(), waitUntil).toMillis();
            if (ms > 0) {
                log.info("Rate limit daily reached for user {}, waiting {}ms", userId, ms);
                Thread.sleep(ms);
            }
            purge(wDay, 24, ChronoUnit.HOURS);
        }

        Instant now = Instant.now();
        w15.addLast(now);
        wDay.addLast(now);
    }

    private void purge(Deque<Instant> window, long amount, ChronoUnit unit) {
        Instant cutoff = Instant.now().minus(amount, unit);
        while (!window.isEmpty() && window.peekFirst().isBefore(cutoff)) {
            window.pollFirst();
        }
    }
}
