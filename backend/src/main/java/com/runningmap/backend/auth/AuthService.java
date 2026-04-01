package com.runningmap.backend.auth;

import com.runningmap.backend.config.StravaProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final StravaProperties stravaProperties;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final WebClient.Builder webClientBuilder;

    public String buildStravaAuthUrl() {
        return UriComponentsBuilder.fromHttpUrl(stravaProperties.getAuthUrl())
                .queryParam("client_id", stravaProperties.getClientId())
                .queryParam("redirect_uri", stravaProperties.getRedirectUri())
                .queryParam("response_type", "code")
                .queryParam("approval_prompt", "auto")
                .queryParam("scope", "activity:read_all")
                .toUriString();
    }

    public String handleCallback(String code) {
        StravaTokenResponse tokenResponse = exchangeCode(code);
        User user = upsertUser(tokenResponse);
        return jwtService.generateToken(user.getId());
    }

    /**
     * Refreshes the Strava access token if it expires within the next 5 minutes.
     * Called before any Strava API request (Phase 3+).
     */
    public User ensureFreshToken(User user) {
        LocalDateTime threshold = LocalDateTime.now(ZoneOffset.UTC).plusMinutes(5);
        if (user.getTokenExpiresAt().isBefore(threshold)) {
            StravaTokenResponse refreshed = refreshToken(user.getRefreshToken());
            user.setAccessToken(refreshed.accessToken());
            user.setRefreshToken(refreshed.refreshToken());
            user.setTokenExpiresAt(toLocalDateTime(refreshed.expiresAt()));
            user = userRepository.save(user);
        }
        return user;
    }

    private StravaTokenResponse exchangeCode(String code) {
        return webClientBuilder.build()
                .post()
                .uri(stravaProperties.getTokenUrl())
                .body(BodyInserters.fromFormData("client_id", stravaProperties.getClientId())
                        .with("client_secret", stravaProperties.getClientSecret())
                        .with("code", code)
                        .with("grant_type", "authorization_code"))
                .retrieve()
                .bodyToMono(StravaTokenResponse.class)
                .block();
    }

    private StravaTokenResponse refreshToken(String refreshToken) {
        return webClientBuilder.build()
                .post()
                .uri(stravaProperties.getTokenUrl())
                .body(BodyInserters.fromFormData("client_id", stravaProperties.getClientId())
                        .with("client_secret", stravaProperties.getClientSecret())
                        .with("refresh_token", refreshToken)
                        .with("grant_type", "refresh_token"))
                .retrieve()
                .bodyToMono(StravaTokenResponse.class)
                .block();
    }

    private User upsertUser(StravaTokenResponse tokenResponse) {
        StravaTokenResponse.Athlete athlete = tokenResponse.athlete();
        return userRepository.findByStravaId(athlete.id())
                .map(existing -> {
                    existing.setAccessToken(tokenResponse.accessToken());
                    existing.setRefreshToken(tokenResponse.refreshToken());
                    existing.setTokenExpiresAt(toLocalDateTime(tokenResponse.expiresAt()));
                    existing.setFirstname(athlete.firstname());
                    existing.setLastname(athlete.lastname());
                    existing.setProfilePicture(athlete.profile());
                    return userRepository.save(existing);
                })
                .orElseGet(() -> {
                    User user = new User();
                    user.setStravaId(athlete.id());
                    user.setFirstname(athlete.firstname());
                    user.setLastname(athlete.lastname());
                    user.setProfilePicture(athlete.profile());
                    user.setAccessToken(tokenResponse.accessToken());
                    user.setRefreshToken(tokenResponse.refreshToken());
                    user.setTokenExpiresAt(toLocalDateTime(tokenResponse.expiresAt()));
                    return userRepository.save(user);
                });
    }

    private LocalDateTime toLocalDateTime(long unixSeconds) {
        return Instant.ofEpochSecond(unixSeconds).atOffset(ZoneOffset.UTC).toLocalDateTime();
    }
}
