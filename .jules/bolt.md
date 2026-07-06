# Bolt's Performance Journal

## 2026-07-06 - Optimized Slider Responsiveness via Server-Side Pre-calculation
**Learning:** Parsing Date strings into `Date` objects within a render loop (or `useMemo`) that iterates over thousands of tracks causes significant UI lag when triggered by frequent events like range slider updates. React 19's strict linting also flags `Date.now()` in render bodies as impure.
**Action:** Pre-calculate numeric timestamps on the server (Server Component) and pass them as stable props. Use these numeric values for O(1) comparisons in client hooks.

## 2026-07-06 - Handling React 19 Strict Linting in Next.js 16
**Learning:** Next.js 16/React 19 environment in this repo uses custom lint rules (`react-hooks/purity` and `react-hooks/set-state-in-effect`) that are extremely strict. Even `Date.now()` in a Server Component can be flagged if not handled carefully.
**Action:** Use `// eslint-disable-next-line` for intentional single-pass hydration patterns (like `setMounted(true)`) or stable server-side impurity (`Date.now()` at request time), and prefer passing stable values from server to client to maintain render purity.
