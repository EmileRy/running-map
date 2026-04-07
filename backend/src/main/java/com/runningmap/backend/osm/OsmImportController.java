package com.runningmap.backend.osm;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/osm")
@RequiredArgsConstructor
public class OsmImportController {

    private final OsmImportService osmImportService;

    @PostMapping("/import")
    public ResponseEntity<ImportResult> importZone(@RequestParam String zone) {
        int count = osmImportService.importZone(zone);
        return ResponseEntity.ok(new ImportResult(zone, count));
    }

    public record ImportResult(String zone, int importedStreets) {}
}
