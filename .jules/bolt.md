## 2025-05-15 - [Pre-calculating timestamps and optimizing hydration]
**Learning:** React 19/Next 16 strict mode and ESLint rules (like `react-hooks/set-state-in-effect`) push towards more efficient patterns like `useSyncExternalStore` for client-only state and deferring state updates. Pre-calculating expensive values (like `new Date().getTime()`) outside of tight loops (filtering/rendering) is a high-ROI optimization for slider-controlled lists.
**Action:** Always prefer `useSyncExternalStore` for hydration-safe client-side values and pre-calculate numeric values for data filtering.
