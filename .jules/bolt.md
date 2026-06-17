## 2025-05-15 - [Optimization of Map Filtering and Rendering]
**Learning:** Parsing ISO date strings inside a render loop or frequently-called `useMemo` (like a slider-controlled filter) is a major CPU bottleneck when handling thousands of items. Moving this to a pre-calculation phase reduces interaction latency from O(N * parsing) to O(N * comparison). Additionally, Leaflet's SVG renderer struggles with >1000 polylines; `preferCanvas` is essential for performance.
**Action:** Always pre-calculate numeric timestamps for time-series data and prefer Canvas for dense geographic visualizations.

## 2025-05-15 - [React 19 Hooks and Infinite Loops]
**Learning:** `useSyncExternalStore` must return a stable value from `getSnapshot`. Returning `Date.now()` directly violates the contract and can trigger infinite loops if used as an effect dependency that sets state. `setTimeout(..., 0)` is a common pattern in React 19 to defer state updates from effects and satisfy the `react-hooks/set-state-in-effect` rule, although it should be used judiciously.
**Action:** Ensure `getSnapshot` in `useSyncExternalStore` is stable. Use `setTimeout` sparingly to satisfy React 19 linting when synchronous state updates in effects are unavoidable.
