## 2026-06-03 - [Leaflet Canvas Rendering]
**Learning:** For maps with thousands of polylines, switching from SVG (default) to Canvas rendering (`preferCanvas: true`) is the single most impactful performance win. It prevents DOM bloat and keeps the UI responsive.
**Action:** Always enable `preferCanvas` when rendering dense vector data in Leaflet.
## 2026-06-03 - [Efficient Bounds Calculation]
**Learning:** Manually calculating bounding boxes in a single pass over coordinates is faster than creating many `L.LatLngBounds` objects and extending them, especially as the number of segments grows.
**Action:** Use manual loops for global bounds calculation with large datasets.
