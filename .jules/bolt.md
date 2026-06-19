## 2025-05-15 - [Leaflet Rendering & Date Parsing]
**Learning:** For maps with many polylines, switching from SVG (default) to Canvas (`preferCanvas: true`) significantly reduces DOM node count and memory usage. Additionally, pre-calculating timestamps (O(1)) for date-based filtering is much faster than repeatedly parsing strings or creating `new Date()` objects in hot render loops.
**Action:** Always enable Canvas renderer for Leaflet when expecting >100 polylines. Pre-calculate numeric dates during data ingestion/transformation.

## 2025-05-15 - [React 19 Purity & Hydration]
**Learning:** React 19 and Next.js 16 enforce strict purity. Using `Date.now()` directly in a render body causes hydration mismatches and lint errors. `useSyncExternalStore` is the recommended way to provide a stable 'now' timestamp for client components.
**Action:** Use `useSyncExternalStore` for any non-deterministic values used during render.
