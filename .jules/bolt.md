# Bolt's Performance Journal

## 2025-05-15 - [Front-end Optimization: Pre-calculated Timestamps & Leaflet Canvas]
**Learning:** Date parsing (`new Date().getTime()`) inside frequent render loops (like slider dragging) is a hidden performance killer. Leaflet's default SVG renderer also struggles with thousands of polylines, causing DOM bloat and layout thrashing.
**Action:** Always pre-calculate numeric values for sorting/filtering using `useMemo` when data is received. Use `preferCanvas: true` for Leaflet maps to handle large datasets efficiently.
