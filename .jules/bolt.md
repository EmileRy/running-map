## 2025-05-15 - React 19 Purity and Hydration Performance
**Learning:** React 19 enforces strict purity rules for renders, prohibiting calls to impure functions like Date.now() directly in the component body. Additionally, synchronous setState in useEffect triggers cascading renders that degrade performance.
**Action:** Use a centralized baseline timestamp and useSyncExternalStore for hydration-safe mounting. Defer initial state updates using setTimeout(..., 0) or microtasks to avoid cascading renders while maintaining React 19 compliance.

## 2025-05-15 - Leaflet Canvas Rendering for Performance
**Learning:** For maps displaying many polylines (hundreds or thousands), the default SVG renderer creates too many DOM nodes, slowing down interactions and slider updates.
**Action:** Enable 'preferCanvas: true' in Leaflet options to switch to a single canvas element, significantly improving responsiveness during frequent filtering operations.
