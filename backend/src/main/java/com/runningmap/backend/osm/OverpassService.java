package com.runningmap.backend.osm;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class OverpassService {

    private static final List<String> OVERPASS_ENDPOINTS = List.of(
            "https://overpass.kumi.systems/api/interpreter",
            "https://overpass-api.de/api/interpreter",
            "https://overpass.openstreetmap.fr/api/interpreter"
    );

    private final RestClient restClient;

    public OverpassService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(30));
        factory.setReadTimeout(Duration.ofSeconds(180));
        this.restClient = RestClient.builder().requestFactory(factory).build();
    }

    public List<OverpassWay> fetchWaysForZone(String zone) {
        String query = """
                [out:json][timeout:120];
                area["name"="%s"]["boundary"="administrative"]["admin_level"="8"]->.a;
                way["highway"~"^(residential|living_street|pedestrian|footway|path|cycleway|service|unclassified|tertiary|secondary|primary)$"]["area"!="yes"](area.a);
                out geom;
                """.formatted(zone);

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("data", query);

        Exception lastException = null;
        for (String endpoint : OVERPASS_ENDPOINTS) {
            try {
                log.info("Trying Overpass endpoint: {}", endpoint);
                OverpassResponse response = restClient.post()
                        .uri(endpoint)
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .body(formData)
                        .retrieve()
                        .body(OverpassResponse.class);

                if (response == null || response.elements() == null) return List.of();

                return response.elements().stream()
                        .filter(e -> "way".equals(e.type()) && e.geometry() != null && e.geometry().size() >= 2)
                        .map(e -> new OverpassWay(
                                e.id(),
                                e.tags() != null ? e.tags().get("name") : null,
                                e.geometry()
                        ))
                        .toList();
            } catch (Exception e) {
                log.warn("Overpass endpoint {} failed: {}", endpoint, e.getMessage());
                lastException = e;
            }
        }

        throw new RuntimeException("All Overpass endpoints failed for zone: " + zone, lastException);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OverpassResponse(List<OverpassElement> elements) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OverpassElement(
            String type,
            Long id,
            List<OverpassNode> geometry,
            @JsonProperty("tags") Map<String, String> tags
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OverpassNode(double lat, double lon) {}

    public record OverpassWay(Long id, String name, List<OverpassNode> nodes) {}
}
