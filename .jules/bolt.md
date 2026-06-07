# Bolt's Performance Journal

## 2025-05-15 - [Initial Assessment]
**Learning:** Found that slider interactions in `MapLayout.tsx` trigger expensive `new Date()` parsing for every track on every move. Also, Leaflet is using SVG renderer which can be slow for many polylines.
**Action:** Pre-calculate timestamps and enable Canvas renderer.
