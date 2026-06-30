## 2025-05-15 - [Map Rendering & Slider Optimization]
**Learning:** Rendering thousands of SVG polylines in Leaflet causes significant main-thread lag during map interactions and slider-based filtering. React 19's strict purity rules also penalize `Date.now()` or expensive parsing inside render/memo loops.
**Action:** Always enable `preferCanvas: true` for high-density maps. Pre-calculate numeric timestamps (`firstRunAtMs`) on the server or during data fetch to allow O(1) numeric comparisons in filtering logic, avoiding expensive `new Date()` parsing on every slider move.
