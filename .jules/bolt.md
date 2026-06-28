## 2025-05-15 - [Pre-calculating timestamps on server]
**Learning:** Parsing date strings into timestamps (`new Date().getTime()`) inside React loops (e.g., for filtering or statistics) is a performance bottleneck, especially when triggered by high-frequency events like slider movements.
**Action:** Pre-calculate numeric timestamps on the server or in the initial data fetch phase and include them in the data model (e.g., `firstRunAtMs`) to enable O(1) numeric comparisons in the UI layer.
