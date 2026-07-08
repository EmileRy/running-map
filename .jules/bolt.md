## 2026-07-08 - [Map Performance Optimization]
**Learning:** Using Leaflet's 'preferCanvas: true' and increasing 'smoothFactor' significantly reduces CPU usage when rendering thousands of street segments. Pre-calculating numeric timestamps for date filtering on the server avoids expensive Date parsing in the render loop.
**Action:** Always prefer Canvas renderer for data-heavy maps and pre-calculate numeric values for frequently used filters.
