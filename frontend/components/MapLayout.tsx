'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MapView } from './MapView'
import { ImportPanel, type ImportJob } from './ImportPanel'
import { Track } from '@/types/track'
import { Zone } from '@/types/zone'

interface User {
  firstname: string
  lastname: string
  profilePicture?: string
}

const fmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

export function MapLayout({ user, tracks, zones }: { user: User; tracks: Track[]; zones: Zone[] }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importJob, setImportJob] = useState<ImportJob | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const prevStatusRef = useRef<string | null | undefined>(undefined)
  const menuRef = useRef<HTMLDivElement>(null)

  const visibleTracks = useMemo(
    () => selectedZone ? tracks.filter(t => t.zone === selectedZone) : tracks,
    [tracks, selectedZone]
  )

  // Dates min/max calculées uniquement depuis les données (pas de Date.now() ici — hydration mismatch)
  const { minDate, maxDate } = useMemo(() => {
    let min = Infinity
    let max = -Infinity
    for (const t of visibleTracks) {
      const ms = t.firstRunAtMs
      if (ms === null) continue
      if (ms < min) min = ms
      if (ms > max) max = ms
    }
    return {
      minDate: isFinite(min) ? min : null,
      maxDate: isFinite(max) ? max : null,
    }
  }, [visibleTracks])

  // Infinity = tout afficher (valeur stable côté SSR, jamais rendue dans le DOM)
  const [selectedDate, setSelectedDate] = useState<number>(Infinity)
  // Rendu du slider uniquement côté client pour pouvoir utiliser Date.now() librement
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTimeout(() => setMounted(true), 0)
  }, [])

  useEffect(() => {
    setTimeout(() => setSelectedDate(maxDate ?? Date.now()), 0)
  }, [maxDate])

  // Fallbacks client-only (safe car utilisés seulement après montage)
  const [sliderMin, setSliderMin] = useState<number>(0)
  const [sliderMax, setSliderMax] = useState<number>(0)

  useEffect(() => {
    if (mounted) {
      setTimeout(() => {
        setSliderMin(minDate ?? (Date.now() - 5 * 365 * 24 * 60 * 60 * 1000))
        setSliderMax(maxDate ?? Date.now())
      }, 0)
    }
  }, [mounted, minDate, maxDate])

  const { runCount, coveredLengthM } = useMemo(() => {
    let count = 0
    let length = 0
    for (const t of visibleTracks) {
      if (t.firstRunAtMs === null || t.firstRunAtMs <= selectedDate) {
        count++
        length += t.lengthM
      }
    }
    return { runCount: count, coveredLengthM: length }
  }, [visibleTracks, selectedDate])

  const zoneStats = selectedZone ? zones.find(z => z.name === selectedZone) ?? null : null

  const showSlider = mounted && visibleTracks.length > 0

  const isImporting = importLoading || importJob?.status === 'RUNNING' || importJob?.status === 'PENDING'

  const handleStatusChange = useCallback((job: ImportJob | null) => {
    const prevStatus = prevStatusRef.current
    prevStatusRef.current = job?.status ?? null
    setImportJob(job)

    if (job?.status === 'DONE' && prevStatus != null && prevStatus !== 'DONE') {
      router.refresh()
    }
  }, [router])

  const fetchStatus = useCallback(async () => {
    const res = await fetch('/api/import/status')
    if (res.status === 204) { handleStatusChange(null); return }
    if (res.ok) handleStatusChange(await res.json())
  }, [handleStatusChange])

  useEffect(() => {
    const t = setTimeout(fetchStatus, 0)
    return () => clearTimeout(t)
  }, [fetchStatus])

  useEffect(() => {
    const active = ['PENDING', 'RUNNING', 'COMPUTING_STREETS']
    if (!importOpen && importJob?.status && active.includes(importJob.status)) {
      const id = setInterval(fetchStatus, 5000)
      return () => clearInterval(id)
    }
  }, [importOpen, importJob?.status, fetchStatus])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-zinc-900 text-white shrink-0 z-10">
        <div className="flex items-center gap-3">
          <span className="font-semibold tracking-tight">Running Map</span>
          {isImporting && (
            <div className="flex items-center gap-2 rounded-full bg-zinc-800 px-3 py-1">
              <svg className="h-3.5 w-3.5 animate-spin text-[#FC4C02]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-xs text-zinc-400">
                {importJob && importJob.totalActivities > 0
                  ? `${importJob.processedActivities} / ${importJob.totalActivities}`
                  : 'Import…'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Powered by Strava */}
          <a
            href="https://www.strava.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-500 hover:text-[#FC5200] transition-colors"
          >
            Powered by Strava
          </a>

          {/* Zone selector */}
          {zones.length > 0 && (
            <div className="relative">
              <select
                value={selectedZone ?? ''}
                onChange={e => setSelectedZone(e.target.value || null)}
                className="appearance-none rounded-full bg-zinc-800 pl-3 pr-8 py-1.5 text-sm text-zinc-200 border border-zinc-700 cursor-pointer hover:bg-zinc-700 transition-colors focus:outline-none"
              >
                <option value="">Toutes les zones</option>
                {zones.map(z => (
                  <option key={z.name} value={z.name}>{z.name}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              {user.profilePicture && (
                <img src={user.profilePicture} alt="" className="h-6 w-6 rounded-full object-cover" />
              )}
              <span>{user.firstname} {user.lastname}</span>
              <svg className={`h-3.5 w-3.5 transition-transform ${menuOpen ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 rounded-lg border border-zinc-700 bg-zinc-800 py-1 shadow-xl">
                <button
                  onClick={() => { setImportOpen(true); setMenuOpen(false) }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-700 transition-colors"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" />
                  </svg>
                  Importer mes courses
                </button>
                <div className="my-1 border-t border-zinc-700" />
                <a
                  href="/api/auth/logout"
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" />
                  </svg>
                  Se déconnecter
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Map + overlay */}
      <div className="flex-1 min-h-0 isolate relative">
        <MapView tracks={visibleTracks} selectedDate={selectedDate} />

        {mounted && (
          <div className="absolute bottom-0 left-0 right-0 z-[1000] px-6 pb-5 pt-10 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
            <div className="max-w-3xl mx-auto flex flex-col gap-3">

              {/* Badge compteur + date courante */}
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-sm">
                  {zoneStats
                    ? `${Math.round(coveredLengthM / zoneStats.totalLengthM * 1000) / 10}% explorés (${runCount} rue${runCount > 1 ? 's' : ''} couvertes)`
                    : `${runCount} rue${runCount > 1 ? 's' : ''} couvertes`}
                </span>
                {showSlider && (
                  <span className="text-sm font-medium text-white">
                    {fmt.format(new Date(Math.min(selectedDate, sliderMax)))}
                  </span>
                )}
              </div>

              {/* Curseur temporel */}
              {showSlider && (
                <div className="pointer-events-auto flex flex-col gap-1">
                  <input
                    type="range"
                    min={sliderMin}
                    max={sliderMax}
                    value={Math.min(selectedDate, sliderMax)}
                    onChange={e => setSelectedDate(Number(e.target.value))}
                    className="w-full h-1.5 appearance-none rounded-full cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-[#FC4C02] [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4
                      [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#FC4C02]
                      [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #FC4C02 0%, #FC4C02 ${((Math.min(selectedDate, sliderMax) - sliderMin) / (sliderMax - sliderMin)) * 100}%, #52525b ${((Math.min(selectedDate, sliderMax) - sliderMin) / (sliderMax - sliderMin)) * 100}%, #52525b 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>{fmt.format(new Date(sliderMin))}</span>
                    <span>{fmt.format(new Date(sliderMax))}</span>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* Import modal */}
      {importOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setImportOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-zinc-900 p-6 shadow-2xl border border-zinc-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Importer mes courses</h2>
              <button
                onClick={() => setImportOpen(false)}
                className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                aria-label="Fermer"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                  <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <p className="mb-6 text-sm text-zinc-400">
              Lance la synchronisation de tes activités. Seules les nouvelles courses seront téléchargées.
            </p>
            <div className="flex justify-center">
              <ImportPanel onStatusChange={handleStatusChange} onLoadingChange={setImportLoading} tracksCount={tracks.length} zonesCount={zones.length} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
