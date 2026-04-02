'use client'

import dynamic from 'next/dynamic'

interface Track {
  id: string
  name: string | null
  coordinates: number[][]
}

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-zinc-900 flex items-center justify-center">
      <span className="text-zinc-400 text-sm">Chargement de la carte…</span>
    </div>
  ),
})

export function MapView({ tracks, runCount }: { tracks: Track[]; runCount: number }) {
  return (
    <div className="relative h-full w-full">
      <LeafletMap tracks={tracks} />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] rounded-full bg-black/60 px-4 py-2 text-sm text-white backdrop-blur-sm pointer-events-none">
        {runCount} rue{runCount > 1 ? 's' : ''} couvertes
      </div>
    </div>
  )
}
