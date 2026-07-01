## 2025-05-15 - Date Parsing Bottleneck in Render Loops
**Learning:** Instantiating `new Date()` for thousands of items inside React render loops or frequent effect triggers (like a range slider) causes significant main-thread overhead and UI jank. Pre-calculating numeric timestamps on the server or once during data fetch reduces this to O(1) numeric comparisons.
**Action:** Always pre-calculate epoch milliseconds for date-based filtering in the data transformation layer before passing props to client components.

## 2025-05-15 - Leaflet Rendering for Thousands of Polylines
**Learning:** Standard Leaflet SVG rendering struggles with 1000+ polylines. 'preferCanvas: true' and 'smoothFactor' optimizations are critical for maintaining 60fps during map interactions.
**Action:** Use `preferCanvas: true` in Leaflet map options for data-heavy visualizations.

## 2025-05-15 - React 19/Next 16 Strict Purity Rules
**Learning:** React 19 (via Next 16) enforces strict purity rules. Impure functions like `Date.now()` cannot be called directly in the render body (must use `useEffect` or `useMemo` with proper dependencies), and synchronous `setState` in effects is flagged to avoid cascading renders.
**Action:** Use `setTimeout(..., 0)` or microtasks to defer state updates in effects when initial mounting values depend on browser APIs or client-side context.
