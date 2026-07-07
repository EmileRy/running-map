## 2026-07-07 - Optimized Map Initialization and Rendering

**Learning:** Initializing state from props (e.g., `useState(maxDate ?? serverNow)`) in Next.js 16/React 19 Server-to-Client handoffs eliminates the initial `useEffect` waterfall and prevents hydration mismatches when `Date.now()` is needed for initial state. Additionally, Leaflet's default SVG renderer significantly degrades performance with thousands of polylines; the Canvas renderer (`preferCanvas: true`) combined with numeric timestamp filtering (`firstRunAtMs`) provides a much smoother experience.

**Action:** Always prefer server-side pre-calculation of numeric values for frequent client-side filtering and enable Canvas rendering for dense geographic data.
