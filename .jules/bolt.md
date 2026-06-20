## 2025-05-22 - [Leaflet Performance & React 19 Purity]
**Learning:** Leaflet defaults to SVG rendering, which becomes a bottleneck with thousands of polylines. Setting `preferCanvas: true` is essential for fluid maps. Additionally, React 19's `react-hooks/set-state-in-effect` and `react-hooks/purity` rules prevent synchronous state updates in effects and use of impure functions like `Date.now()` in render.

**Action:** Use `preferCanvas: true` for complex maps. Use `setTimeout(() => setX(...), 0)` to defer state updates and `useSyncExternalStore` for stable, hydration-safe timestamps.
