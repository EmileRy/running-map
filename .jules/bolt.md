## 2026-06-06 - Optimized Map Responsiveness and Rendering
**Learning:** High-frequency UI interactions like date sliders can cause significant lag if they trigger expensive operations like `Date` parsing or massive SVG DOM updates in mapping libraries. Pre-calculating numeric timestamps and switching to Canvas rendering for vector layers are critical for maintaining 60 FPS performance in such scenarios.
**Action:** Always pre-calculate expensive values used in tight render loops or high-frequency event handlers. For Leaflet maps with many features, enable `preferCanvas: true` from the start.
