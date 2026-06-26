import { useSyncExternalStore } from 'react'

const BASELINE_NOW = Date.now()

const mountStore = {
  isMounted: false,
  subscribe(callback: () => void) {
    if (typeof window === 'undefined') return () => {}
    mountStore.isMounted = true
    callback()
    return () => {}
  },
  getSnapshot() {
    return mountStore.isMounted
  },
  getServerSnapshot() {
    return false
  }
}

export function useIsMounted() {
  return useSyncExternalStore(
    mountStore.subscribe,
    mountStore.getSnapshot,
    mountStore.getServerSnapshot
  )
}

/**
 * Returns a stable 'now' timestamp.
 * In React 19, Date.now() in render is strictly forbidden for purity.
 * We use a module-level constant BASELINE_NOW to provide a stable, pure value.
 */
export function useMountNow() {
  return BASELINE_NOW
}
