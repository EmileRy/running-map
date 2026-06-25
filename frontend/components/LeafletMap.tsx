'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Track } from '@/types/track'

interface PolylineEntry {
  polyline: L.Polyline
  firstRunAt: number | null // epoch ms, null = toujours visible
}

export default function LeafletMap({ tracks, selectedDate }: {
  tracks: Track[]
  selectedDate: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const polylinesRef = useRef<PolylineEntry[]>([])

  // Initialisation de la carte — une seule fois
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [46.2276, 2.2137],
      zoom: 6,
      zoomControl: true,
      preferCanvas: true, // Use Canvas renderer for better performance with many polylines
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      polylinesRef.current = []
    }
  }, [])

  // Mise à jour des polylines quand les tracks changent
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Supprimer les anciennes polylines
    for (const { polyline } of polylinesRef.current) {
      polyline.remove()
    }
    polylinesRef.current = []

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
      polylinesRef.current.push({
        polyline,
        firstRunAt: track.firstRunAtMs ?? null,
      })
    }

    if (allBounds.length > 0) {
      const combined = allBounds.reduce((acc, b) => acc.extend(b), allBounds[0])
      map.fitBounds(combined, { padding: [32, 32] })
    }
  }, [tracks])

  // Affichage/masquage des polylines selon la date sélectionnée
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    // Manual loop for maximum performance during frequent slider updates
    for (let i = 0; i < polylinesRef.current.length; i++) {
      const { polyline, firstRunAt } = polylinesRef.current[i]
      const visible = firstRunAt == null || firstRunAt <= selectedDate
      const has = map.hasLayer(polyline)
      if (visible && !has) {
        polyline.addTo(map)
      } else if (!visible && has) {
        polyline.remove()
      }
    }
  }, [selectedDate])

  return <div ref={containerRef} className="h-full w-full" />
}
