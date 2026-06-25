'use client'

import dynamic from 'next/dynamic'
import type { Track } from '@/types/track'

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-zinc-900 flex items-center justify-center">
      <span className="text-zinc-400 text-sm">Chargement de la carte…</span>
    </div>
  ),
})

export function MapView({ tracks, selectedDate }: {
  tracks: Track[]
  selectedDate: number
}) {
  return (
    <div className="relative h-full w-full">
      <LeafletMap tracks={tracks} selectedDate={selectedDate} />
    </div>
  )
}
