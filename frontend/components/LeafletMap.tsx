'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Track {
  id: string
  name: string
  coordinates: number[][]
}

export default function LeafletMap({ tracks }: { tracks: Track[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [46.2276, 2.2137],
      zoom: 6,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map)

    const allBounds: L.LatLngBounds[] = []

    for (const track of tracks) {
      if (track.coordinates.length < 2) continue
      const latlngs = track.coordinates as L.LatLngTuple[]
      const polyline = L.polyline(latlngs, {
        color: '#FC4C02',
        weight: 2,
        opacity: 0.65,
        smoothFactor: 1,
      }).addTo(map)
      allBounds.push(polyline.getBounds())
    }

    if (allBounds.length > 0) {
      const combined = allBounds.reduce((acc, b) => acc.extend(b), allBounds[0])
      map.fitBounds(combined, { padding: [32, 32] })
    }

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, []) // tracks are stable — passed once from server

  return <div ref={containerRef} className="h-full w-full" />
}
