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
  firstRunAtMs?: number | null
}

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
      preferCanvas: true,
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

    let minLat = Infinity, minLng = Infinity, maxLat = -Infinity, maxLng = -Infinity
    let hasCoords = false

    for (const track of tracks) {
      if (track.coordinates.length < 2) continue

      const latlngs = track.coordinates as L.LatLngTuple[]

      // Calcul manuel des bornes en une seule passe (plus performant que polyline.getBounds())
      for (let i = 0; i < latlngs.length; i++) {
        const [lat, lng] = latlngs[i]
        if (lat < minLat) minLat = lat
        if (lat > maxLat) maxLat = lat
        if (lng < minLng) minLng = lng
        if (lng > maxLng) maxLng = lng
      }
      hasCoords = true

      const polyline = L.polyline(latlngs, {
        color: '#FC4C02',
        weight: 2,
        opacity: 0.65,
        smoothFactor: 1,
      }).addTo(map)

      polylinesRef.current.push({
        polyline,
        // Utilisation de la valeur pré-calculée si disponible
        firstRunAt: track.firstRunAtMs !== undefined
          ? track.firstRunAtMs
          : (track.firstRunAt ? new Date(track.firstRunAt).getTime() : null),
      })
    }

    if (hasCoords) {
      map.fitBounds([[minLat, minLng], [maxLat, maxLng]], { padding: [32, 32] })
    }
  }, [tracks])

  // Affichage/masquage des polylines selon la date sélectionnée
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    for (const { polyline, firstRunAt } of polylinesRef.current) {
      if (firstRunAt == null || firstRunAt <= selectedDate) {
        if (!map.hasLayer(polyline)) polyline.addTo(map)
      } else {
        if (map.hasLayer(polyline)) polyline.remove()
      }
    }
  }, [selectedDate])

  return <div ref={containerRef} className="h-full w-full" />
}
