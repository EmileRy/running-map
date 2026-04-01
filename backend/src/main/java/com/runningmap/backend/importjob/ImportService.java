package com.runningmap.backend.importjob;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.runningmap.backend.activity.Activity;
import com.runningmap.backend.activity.ActivityRepository;
import com.runningmap.backend.auth.User;
import com.runningmap.backend.auth.UserRepository;
import com.runningmap.backend.strava.StravaActivitySummary;
import com.runningmap.backend.strava.StravaApiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
            log.info("Import done for user {}: {} activities", userId, job.getProcessedActivities());

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            failJob(job, "Import interrompu");
        } catch (Exception e) {
            log.error("Import failed for user {}", userId, e);
            failJob(job, e.getMessage());
        }
    }

    private List<StravaActivitySummary> fetchAllRuns(User user, ImportJob job) throws InterruptedException {
        List<StravaActivitySummary> allRuns = new ArrayList<>();
        int page = 1;

        while (true) {
            List<StravaActivitySummary> page_result = stravaApiClient.getActivities(user, page);
            if (page_result.isEmpty()) break;

            List<StravaActivitySummary> runs = page_result.stream().filter(StravaActivitySummary::isRun).toList();
            allRuns.addAll(runs);
            page++;

            if (page_result.size() < 200) break;
        }

        job.setTotalActivities(allRuns.size());
        importJobRepository.save(job);
        return allRuns;
    }

    private void processRuns(List<StravaActivitySummary> runs, User user, ImportJob job)
            throws InterruptedException, JsonProcessingException {

        for (StravaActivitySummary summary : runs) {
            if (activityRepository.existsByUserIdAndStravaActivityId(user.getId(), summary.id())) {
                job.setProcessedActivities(job.getProcessedActivities() + 1);
                importJobRepository.save(job);
                continue;
            }

            Optional<List<List<Double>>> stream = stravaApiClient.getLatlngStream(user, summary.id());
            if (stream.isEmpty()) {
                job.setProcessedActivities(job.getProcessedActivities() + 1);
                importJobRepository.save(job);
                continue;
            }

            Activity activity = new Activity();
            activity.setUserId(user.getId());
            activity.setStravaActivityId(summary.id());
            activity.setName(summary.name());
            activity.setStartDate(parseDate(summary.startDate()));
            activity.setLatlngStream(objectMapper.writeValueAsString(stream.get()));
            activityRepository.save(activity);

            job.setProcessedActivities(job.getProcessedActivities() + 1);
            importJobRepository.save(job);
        }
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
