package com.runningmap.backend.importjob;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ImportJobRepository extends JpaRepository<ImportJob, UUID> {
    Optional<ImportJob> findTopByUserIdOrderByCreatedAtDesc(UUID userId);
    boolean existsByUserIdAndStatusIn(UUID userId, java.util.List<ImportStatus> statuses);
}
