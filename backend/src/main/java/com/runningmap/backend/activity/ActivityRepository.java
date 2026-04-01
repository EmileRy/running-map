package com.runningmap.backend.activity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ActivityRepository extends JpaRepository<Activity, UUID> {
    boolean existsByUserIdAndStravaActivityId(UUID userId, Long stravaActivityId);
}
