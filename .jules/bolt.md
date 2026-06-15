## 2024-05-20 - [Frontend] Map Rendering & Data Processing Optimization

**Learning:**
1. Leaflet defaults to SVG rendering, which creates a DOM node for every polyline. For maps with hundreds of tracks, this destroys interaction performance (pan/zoom). Switching to `preferCanvas: true` draws everything to a single `<canvas>`, making it significantly smoother.
2. In React 19, strict ESLint rules (`react-hooks/purity` and `react-hooks/set-state-in-effect`) prevent calling `Date.now()` during render or `setState` synchronously in `useEffect`. These are designed to prevent hydration mismatches and cascading renders.
3. Pre-calculating numeric timestamps (`firstRunAtMs`) in a `useMemo` hook is critical for smooth slider interactions. Parsing `new Date()` strings inside a filter/loop that runs on every slider movement (60fps) is a major CPU bottleneck.

**Action:**
- Always use `preferCanvas: true` for Leaflet maps with dynamic data.
- Pre-calculate all numeric/derived values once when data is received.
- Wrap `setState` in `setTimeout(..., 0)` or use `useSyncExternalStore` for browser-only globals like `Date.now()` to satisfy React 19 purity rules.
