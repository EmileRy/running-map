'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Track {
  id: string
  zone: string
  name: string | null
  coordinates: number[][]
  firstRunAt: string | null
  lastRunAt: string | null
  firstRunAtMs: number | null
}

interface PolylineEntry {
  polyline: L.Polyline
  firstRunAtMs: number | null // epoch ms, null = toujours visible
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
      preferCanvas: true, // Optimization: Use Canvas renderer for thousands of polylines
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

    let combinedBounds: L.LatLngBounds | null = null

    for (const track of tracks) {
      if (track.coordinates.length < 2) continue
      const latlngs = track.coordinates as L.LatLngTuple[]
      const polyline = L.polyline(latlngs, {
        color: '#FC4C02',
        weight: 2,
        opacity: 0.65,
        smoothFactor: 1,
      }).addTo(map)

      // Optimization: Manual bounds calculation in a single pass to avoid object allocations
      const bounds = polyline.getBounds()
      if (!combinedBounds) {
        combinedBounds = L.latLngBounds(bounds.getSouthWest(), bounds.getNorthEast())
      } else {
        combinedBounds.extend(bounds)
      }

      polylinesRef.current.push({
        polyline,
        firstRunAtMs: track.firstRunAtMs,
      })
    }

    if (combinedBounds) {
      map.fitBounds(combinedBounds, { padding: [32, 32] })
    }
  }, [tracks])

  // Affichage/masquage des polylines selon la date sélectionnée
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    for (const { polyline, firstRunAtMs } of polylinesRef.current) {
      if (firstRunAtMs == null || firstRunAtMs <= selectedDate) {
        if (!map.hasLayer(polyline)) polyline.addTo(map)
      } else {
        if (map.hasLayer(polyline)) polyline.remove()
      }
    }
  }, [selectedDate])

  return <div ref={containerRef} className="h-full w-full" />
}
