'use client'

import { useSyncExternalStore } from 'react'

/**
 * A centralized, hydration-safe utility for React 19 compliance.
 * Provides a stable 'now' timestamp and a mounting flag.
 */

// Stable baseline for 'now' to prevent hydration mismatches and unnecessary ticking in render
const baselineNow = Date.now()

function subscribe() {
  return () => {}
}

/**
 * Hook that returns whether the component is mounted on the client.
 */
export function useIsMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}

/**
 * Hook that returns a stable 'now' timestamp.
 * This satisfies React 19's purity rules by avoiding direct Date.now() calls in render.
 */
export function useMountNow() {
  // Return the baseline to ensure stability and purity.
  // baselineNow is captured when the module is loaded.
  return baselineNow
}
