import { useSyncExternalStore } from 'react'

const subscribers = new Set<() => void>()
const currentNow = Date.now()

if (typeof window !== 'undefined') {
  // Update once per minute or similar if needed, but for mount-stable 'now' we can just keep it fixed or update occasionally
  // For this app, we mostly need a stable 'now' for the initial mount to avoid hydration mismatch
}

export const mountNowStore = {
  subscribe(callback: () => void) {
    subscribers.add(callback)
    return () => subscribers.delete(callback)
  },
  getSnapshot() {
    return currentNow
  },
  getServerSnapshot() {
    return 0 // Stable value for SSR
  }
}

export function useMountNow() {
  return useSyncExternalStore(
    mountNowStore.subscribe,
    mountNowStore.getSnapshot,
    mountNowStore.getServerSnapshot
  )
}
