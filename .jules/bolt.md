## 2025-05-14 - Pre-calculating numeric timestamps for hot paths
**Learning:** Offloading `Date` parsing from Client Components to Server Components significantly improves responsiveness in interaction-heavy features (like date sliders). Numeric comparisons are O(1) and extremely cheap compared to ISO string parsing inside render loops.
**Action:** Always check if data transformation can happen on the server or once during initial load when building interactive visualizations.
