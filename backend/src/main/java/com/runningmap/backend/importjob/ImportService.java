package com.runningmap.backend.importjob;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.runningmap.backend.activity.Activity;
import com.runningmap.backend.activity.ActivityRepository;
import com.runningmap.backend.auth.User;
import com.runningmap.backend.auth.UserRepository;
import com.runningmap.backend.config.StravaProperties;
import com.runningmap.backend.strava.StravaActivitySummary;
import com.runningmap.backend.strava.StravaApiClient;
import com.runningmap.backend.streets.StreetCoverageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImportService {

    private final ImportJobRepository importJobRepository;
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;
    private final StravaApiClient stravaApiClient;
    private final ObjectMapper objectMapper;
    private final StravaProperties stravaProperties;
    private final StreetCoverageService streetCoverageService;
    private final JdbcTemplate jdbcTemplate;

    public ImportJob startImport(UUID userId) {
        if (importJobRepository.existsByUserIdAndStatusIn(userId, List.of(ImportStatus.PENDING, ImportStatus.RUNNING))) {
            return importJobRepository.findTopByUserIdOrderByCreatedAtDesc(userId).orElseThrow();
        }

        ImportJob job = new ImportJob();
        job.setUserId(userId);
        job = importJobRepository.save(job);

        runImportAsync(job.getId(), userId);
        return job;
    }

    public Optional<ImportJob> getLatestJob(UUID userId) {
        return importJobRepository.findTopByUserIdOrderByCreatedAtDesc(userId);
    }

    @Async
    public void runImportAsync(UUID jobId, UUID userId) {
        ImportJob job = importJobRepository.findById(jobId).orElseThrow();
        User user = userRepository.findById(userId).orElseThrow();

        job.setStatus(ImportStatus.RUNNING);
        job.setStartedAt(LocalDateTime.now());
        importJobRepository.save(job);

        try {
            List<StravaActivitySummary> allRuns = fetchAllRuns(user, job);
            processRuns(allRuns, user, job);

            job.setStatus(ImportStatus.DONE);
            job.setCompletedAt(LocalDateTime.now());
            importJobRepository.save(job);
            log.info("Import done for user {}: {}/{} activities processed",
                    userId, job.getProcessedActivities(), job.getTotalActivities());

            try {
                streetCoverageService.computeCoverageForUser(userId);
            } catch (Exception e) {
                log.error("Street coverage computation failed for user {}", userId, e);
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            failJob(job, "Import interrompu");
        } catch (Exception e) {
            log.error("Import failed for user {}", userId, e);
            failJob(job, e.getMessage());
        }
    }

    private List<StravaActivitySummary> fetchAllRuns(User user, ImportJob job)
            throws InterruptedException {
        List<StravaActivitySummary> allRuns = new ArrayList<>();
        int page = 1;

        int maxActivities = stravaProperties.getMaxActivitiesPerImport();

        while (true) {
            List<StravaActivitySummary> pageResult = stravaApiClient.getActivities(user, page, null);
            if (pageResult.isEmpty()) break;

            allRuns.addAll(pageResult.stream().filter(StravaActivitySummary::isRun).toList());
            page++;

            if (maxActivities > 0 && allRuns.size() >= maxActivities) {
                allRuns = allRuns.subList(0, maxActivities);
                break;
            }

            if (pageResult.size() < 200) break;
        }

        job.setTotalActivities(allRuns.size());
        importJobRepository.save(job);
        return allRuns;
    }

    private void processRuns(List<StravaActivitySummary> runs, User user, ImportJob job) {
        for (StravaActivitySummary summary : runs) {
            try {
                processSingleRun(summary, user);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("Import interrompu", e);
            } catch (Exception e) {
                log.warn("Skipping activity {} for user {} due to error: {}", summary.id(), user.getId(), e.getMessage());
            } finally {
                job.setProcessedActivities(job.getProcessedActivities() + 1);
                importJobRepository.save(job);
            }
        }
    }

    private void processSingleRun(StravaActivitySummary summary, User user)
            throws InterruptedException, JsonProcessingException {
        if (activityRepository.existsByUserIdAndStravaActivityId(user.getId(), summary.id())) {
            log.debug("Skipping already imported activity: \"{}\" (Strava ID: {})", summary.name(), summary.id());
            return;
        }

        log.debug("Fetching GPS stream for: \"{}\" (Strava ID: {})", summary.name(), summary.id());
        Optional<List<List<Double>>> stream = stravaApiClient.getLatlngStream(user, summary.id());
        if (stream.isEmpty()) {
            log.debug("No GPS stream for: \"{}\" (Strava ID: {})", summary.name(), summary.id());
            return;
        }

        log.debug("Saving activity: \"{}\" (Strava ID: {}, {} GPS points)",
                summary.name(), summary.id(), stream.get().size());
        Activity activity = new Activity();
        activity.setUserId(user.getId());
        activity.setStravaActivityId(summary.id());
        activity.setName(summary.name());
        activity.setStartDate(parseDate(summary.startDate()));
        activity.setLatlngStream(objectMapper.writeValueAsString(stream.get()));
        Activity saved = activityRepository.save(activity);

        jdbcTemplate.update(
            "UPDATE activities SET track_geom = ST_MakeLine(" +
            "  array(SELECT ST_SetSRID(ST_MakePoint((c->>1)::float, (c->>0)::float), 4326)" +
            "        FROM jsonb_array_elements(latlng_stream) c)" +
            ") WHERE id = ? AND jsonb_array_length(latlng_stream) >= 2",
            saved.getId()
        );
    }

    private void failJob(ImportJob job, String message) {
        job.setStatus(ImportStatus.ERROR);
        job.setErrorMessage(message);
        job.setCompletedAt(LocalDateTime.now());
        importJobRepository.save(job);
    }

    private LocalDateTime parseDate(String dateStr) {
        if (dateStr == null) return null;
        try {
            return LocalDateTime.parse(dateStr, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'"));
        } catch (Exception e) {
            return null;
        }
    }
}
