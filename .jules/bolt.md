## 2025-05-22 - [Map Performance & Hydration]
**Learning:** In Next.js with Leaflet, rendering thousands of polylines via SVG (default) causes significant DOM bloat. Switching to `preferCanvas: true` is a single-line change that offers the best ROI for map responsiveness. Additionally, calculating bounds manually in a single pass is faster than creating multiple `LatLngBounds` objects and calling `extend()`.

**Action:** Always prefer Canvas rendering for complex maps and use single-pass loops for coordinate-heavy calculations. Use pre-calculated numeric timestamps instead of string parsing in render loops to satisfy React's purity requirements and improve performance.
