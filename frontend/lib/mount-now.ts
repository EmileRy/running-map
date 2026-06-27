// Module-level constant for a stable "now" reference during a single mount session.
// This helps satisfy React 19's purity rules while avoiding flickering.
export const BASELINE_NOW = Date.now();

/**
 * Returns a stable "now" timestamp.
 * In React 19, calling Date.now() directly in render is considered impure.
 */
export function useMountNow() {
  return BASELINE_NOW;
}
