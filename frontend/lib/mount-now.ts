import { useSyncExternalStore } from 'react'

/**
 * Baseline for stable 'now' timestamp during the lifetime of the application.
 */
const baselineNow = Date.now()

/**
 * Simple store to track mounting state and provide a stable timestamp.
 */
const mountStore = {
  isMounted: false,
  subscribe: (callback: () => void) => {
    if (typeof window === 'undefined') return () => {}

    if (!mountStore.isMounted) {
      mountStore.isMounted = true
      // Delay slightly to ensure hydration is complete
      setTimeout(callback, 0)
    }
    return () => {}
  },
  getSnapshot: () => mountStore.isMounted,
  getServerSnapshot: () => false,

  getNow: () => baselineNow
}

/**
 * Hook that returns { isMounted: boolean, now: number }.
 * Safe for hydration (isMounted is false on server/initial client render).
 * Satisfies React 19 purity rules.
 */
export function useMountNow() {
  const isMounted = useSyncExternalStore(
    mountStore.subscribe,
    mountStore.getSnapshot,
    mountStore.getServerSnapshot
  )

  return { isMounted, now: mountStore.getNow() }
}
