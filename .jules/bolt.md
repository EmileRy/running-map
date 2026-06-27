# Bolt's Performance Journal

## 2025-05-15 - Pre-calculated Timestamps for O(1) Filtering
**Learning:** React 19's strict purity rules (react-hooks/purity) prohibit calling 'Date.now()' or 'new Date()' directly in render bodies. More importantly, performing O(N) date parsing inside a high-frequency render loop (like a timeline slider) causes noticeable UI lag as the dataset grows.
**Action:** Always pre-calculate numeric timestamps on the server or in a stable data-fetching layer. Use numeric comparisons in 'useMemo' and render paths to avoid the overhead of object allocation and date parsing during interactions.

## 2025-05-15 - Hydration-Safe Mounting in React 19
**Learning:** Setting state synchronously in 'useEffect' to track mounting (e.g., 'setIsMounted(true)') triggers 'react-hooks/set-state-in-effect' warnings in Next.js 16/React 19, which can block builds.
**Action:** Use 'useSyncExternalStore' for hydration-safe mounting checks or defer state updates using 'requestAnimationFrame' or 'setTimeout(() => ..., 0)' to avoid cascading renders and satisfy strict linting.
