package com.runningmap.backend.importjob;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ImportJobRepository extends JpaRepository<ImportJob, UUID> {
    Optional<ImportJob> findTopByUserIdOrderByCreatedAtDesc(UUID userId);
    boolean existsByUserIdAndStatusIn(UUID userId, java.util.List<ImportStatus> statuses);
    boolean existsByStatusIn(java.util.List<ImportStatus> statuses);
    Optional<ImportJob> findFirstByStatusOrderByCreatedAtAsc(ImportStatus status);
    long countByStatusAndCreatedAtBefore(ImportStatus status, java.time.LocalDateTime createdAt);
    List<ImportJob> findAllByStatusIn(List<ImportStatus> statuses);
}
