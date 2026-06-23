import { useSyncExternalStore } from 'react'

const baseline = Date.now()

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

/**
 * Returns true if the component is mounted on the client.
 * Uses useSyncExternalStore to avoid hydration mismatches.
 */
export function useMounted() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/**
 * Returns a stable 'now' timestamp that is safe to use in render.
 * Uses a module-level baseline to ensure consistency and purity.
 */
export function useNow() {
  return baseline
}

/**
 * Combined hook for mounting and current time.
 */
export function useMountNow() {
  const mounted = useMounted()
  const now = useNow()
  return { mounted, now }
}
