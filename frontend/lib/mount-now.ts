import { useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}

// Capture the module-level 'now' once to avoid hydration mismatch and provide a stable baseline
const moduleNow = typeof window !== 'undefined' ? Date.now() : 0

export function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

/**
 * Provides a stable 'now' timestamp for the current session.
 * Using useSyncExternalStore ensures this value is hydration-safe.
 */
export function useNow() {
  return useSyncExternalStore(
    emptySubscribe,
    () => moduleNow || Date.now(), // Return module baseline if available, else current
    () => 0 // Fallback for SSR
  )
}
