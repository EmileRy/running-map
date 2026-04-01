package com.runningmap.backend.activity;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface ActivityRepository extends JpaRepository<Activity, UUID> {
    boolean existsByUserIdAndStravaActivityId(UUID userId, Long stravaActivityId);
    Page<Activity> findByUserId(UUID userId, Pageable pageable);

    @Query("SELECT MAX(a.startDate) FROM Activity a WHERE a.userId = :userId")
    Optional<LocalDateTime> findMaxStartDateByUserId(@Param("userId") UUID userId);
}
