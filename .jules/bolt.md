## 2025-05-14 - Map Rendering & Data Filtering Optimization

**Learning:** Pre-calculating numeric timestamps (epoch ms) on the server for date-based filtering avoids massive overhead in React render loops. In this case, removing `new Date().getTime()` for thousands of street polylines during time-slider interactions significantly reduced scripting time and eliminated frame drops. Additionally, React 19's strict linting for purity and effect safety necessitates using `useSyncExternalStore` for hydration-safe stable timestamps.

**Action:** Always prefer numeric timestamps over ISO strings for high-frequency filtering in the frontend. Shift date parsing to the server-side data fetching layer. Use a centralized mounting store with `useSyncExternalStore` for React 19 compatibility.
