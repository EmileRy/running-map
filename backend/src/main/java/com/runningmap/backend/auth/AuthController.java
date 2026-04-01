package com.runningmap.backend.auth;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @GetMapping("/strava")
    public void redirectToStrava(HttpServletResponse response) throws IOException {
        response.sendRedirect(authService.buildStravaAuthUrl());
    }

    @GetMapping("/callback")
    public ResponseEntity<Map<String, String>> handleCallback(@RequestParam String code) {
        String token = authService.handleCallback(code);
        return ResponseEntity.ok(Map.of("token", token));
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponse> me(Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        User user = userRepository.findById(userId).orElseThrow();
        return ResponseEntity.ok(new MeResponse(
                user.getId(),
                user.getStravaId(),
                user.getFirstname(),
                user.getLastname(),
                user.getProfilePicture()
        ));
    }

    public record MeResponse(
            UUID id,
            Long stravaId,
            String firstname,
            String lastname,
            String profilePicture
    ) {}
}
