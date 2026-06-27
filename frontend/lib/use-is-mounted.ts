import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

export function useIsMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true, // Client side
    () => false // Server side
  );
}
