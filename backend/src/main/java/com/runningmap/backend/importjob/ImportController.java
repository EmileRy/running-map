package com.runningmap.backend.importjob;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
public class ImportController {

    private final ImportService importService;

    @PostMapping("/start")
    public ResponseEntity<ImportJobResponse> start(Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        ImportJob job = importService.startImport(userId);
        return ResponseEntity.ok(toResponse(job));
    }

    @GetMapping("/status")
    public ResponseEntity<ImportJobResponse> status(Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        return importService.getLatestJob(userId)
                .map(job -> ResponseEntity.ok(toResponse(job)))
                .orElse(ResponseEntity.noContent().build());
    }

    private ImportJobResponse toResponse(ImportJob job) {
        Integer queuePosition = job.getStatus() == ImportStatus.PENDING
                ? (int) importService.getQueuePosition(job)
                : null;
        return new ImportJobResponse(
                job.getId(),
                job.getStatus(),
                job.getTotalActivities(),
                job.getProcessedActivities(),
                job.getErrorMessage(),
                job.getStartedAt(),
                job.getCompletedAt(),
                queuePosition
        );
    }

    public record ImportJobResponse(
            UUID id,
            ImportStatus status,
            int totalActivities,
            int processedActivities,
            String errorMessage,
            java.time.LocalDateTime startedAt,
            java.time.LocalDateTime completedAt,
            Integer queuePosition
    ) {}
}
