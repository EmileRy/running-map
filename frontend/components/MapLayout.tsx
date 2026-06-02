'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from './Spinner'
import { MapView } from './MapView'
import { ImportPanel, type ImportJob } from './ImportPanel'

interface User {
  firstname: string
  lastname: string
  profilePicture?: string
}

interface Track {
  id: string
  zone: string
  name: string | null
  coordinates: number[][]
  firstRunAt: string | null
  lastRunAt: string | null
}

interface Zone {
  name: string
  covered: number
  total: number
  percentage: number
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
      if (!t.firstRunAt) continue
      const ms = new Date(t.firstRunAt).getTime()
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

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    setSelectedDate(maxDate ?? Date.now())
  }, [maxDate])

  // Fallbacks client-only (safe car utilisés seulement après montage)
  const sliderMin = minDate ?? (Date.now() - 5 * 365 * 24 * 60 * 60 * 1000)
  const sliderMax = maxDate ?? Date.now()

  const runCount = useMemo(
    () => visibleTracks.filter(t => !t.firstRunAt || new Date(t.firstRunAt).getTime() <= selectedDate).length,
    [visibleTracks, selectedDate]
  )

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
      {/* Header - Barre flottante */}
      <header className="fixed top-4 left-4 right-4 flex items-center justify-between px-4 py-2 bg-zinc-900/80 backdrop-blur-md text-white rounded-2xl border border-zinc-800 shadow-2xl z-[1100]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#FC4C02] flex items-center justify-center shadow-lg shadow-[#FC4C02]/20">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="font-bold tracking-tight text-lg">Running Map</span>
          </div>

          {isImporting && (
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-zinc-800/50 border border-zinc-700/50 px-3 py-1 animate-pulse">
              <Spinner className="h-3 w-3" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">
                {importJob && importJob.totalActivities > 0
                  ? `${importJob.processedActivities} / ${importJob.totalActivities}`
                  : 'Synchro…'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Zone selector */}
          {zones.length > 0 && (
            <div className="relative hidden md:block">
              <select
                value={selectedZone ?? ''}
                onChange={e => setSelectedZone(e.target.value || null)}
                className="appearance-none rounded-xl bg-zinc-800/50 pl-3 pr-9 py-1.5 text-sm text-zinc-200 border border-zinc-700/50 cursor-pointer hover:bg-zinc-700/50 transition-all focus:outline-none focus:ring-2 focus:ring-[#FC4C02]/50"
              >
                <option value="">Toutes les zones</option>
                {zones.map(z => (
                  <option key={z.name} value={z.name}>{z.name}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </div>
          )}

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-xl bg-zinc-800/50 p-1 pr-3 border border-zinc-700/50 hover:bg-zinc-700/50 transition-all"
            >
              <div className="h-7 w-7 rounded-lg overflow-hidden border border-zinc-600/50 shadow-inner bg-zinc-700">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-zinc-400">
                    {user.firstname[0]}{user.lastname[0]}
                  </div>
                )}
              </div>
              <span className="hidden sm:inline text-sm font-medium text-zinc-200">{user.firstname}</span>
              <svg className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-zinc-800 bg-zinc-900/95 backdrop-blur-xl p-1 shadow-2xl z-[1200] overflow-hidden">
                <div className="px-3 py-2 border-b border-zinc-800/50 mb-1">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Compte</p>
                  <p className="text-sm font-semibold text-zinc-200 truncate">{user.firstname} {user.lastname}</p>
                </div>
                <button
                  onClick={() => { setImportOpen(true); setMenuOpen(false) }}
                  className="group flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-300 hover:bg-[#FC4C02] hover:text-white rounded-xl transition-all"
                >
                  <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" />
                    </svg>
                  </div>
                  Synchroniser Strava
                </button>
                <div className="my-1 border-t border-zinc-800/50" />
                <a
                  href="/api/auth/logout"
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-500 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all"
                >
                   <div className="h-8 w-8 rounded-lg bg-zinc-800/50 flex items-center justify-center">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" />
                    </svg>
                  </div>
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
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-[1000] pointer-events-none">
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-5 shadow-2xl pointer-events-auto overflow-hidden relative group">

              {/* Fond décoratif subtil */}
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#FC4C02]/10 blur-3xl rounded-full pointer-events-none" />

              <div className="relative flex flex-col gap-5">
                {/* Stats row */}
                <div className="flex items-end justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Exploration</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white tabular-nums">
                        {zoneStats ? Math.round(runCount / zoneStats.total * 100) : '--'}%
                      </span>
                      <span className="text-sm font-medium text-zinc-400">
                        {runCount} rue{runCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {showSlider && (
                    <div className="text-right">
                       <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Période</p>
                       <span className="px-3 py-1 rounded-full bg-zinc-800 text-xs font-bold text-zinc-200 border border-zinc-700 shadow-inner">
                        {fmt.format(new Date(Math.min(selectedDate, sliderMax)))}
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress bar / Slider Container */}
                {showSlider && (
                  <div className="flex flex-col gap-3">
                    <div className="relative h-6 flex items-center">
                      {/* Custom Range Slider */}
                      <input
                        type="range"
                        min={sliderMin}
                        max={sliderMax}
                        value={Math.min(selectedDate, sliderMax)}
                        onChange={e => setSelectedDate(Number(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      />

                      {/* Track background */}
                      <div className="absolute inset-y-2 left-0 right-0 bg-zinc-800 rounded-full overflow-hidden">
                         {/* Highlight track */}
                         <div
                          className="h-full bg-gradient-to-r from-[#FC4C02] to-[#FF8C00] transition-all duration-75 shadow-[0_0_15px_rgba(252,76,2,0.3)]"
                          style={{ width: `${((Math.min(selectedDate, sliderMax) - sliderMin) / (sliderMax - sliderMin)) * 100}%` }}
                         />
                      </div>

                      {/* Thumb visual */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 bg-white rounded-full shadow-lg pointer-events-none z-10 flex items-center justify-center border-4 border-[#FC4C02]"
                        style={{ left: `${((Math.min(selectedDate, sliderMax) - sliderMin) / (sliderMax - sliderMin)) * 100}%` }}
                      >
                        <div className="h-1 w-1 bg-[#FC4C02] rounded-full animate-ping" />
                      </div>
                    </div>

                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">{fmt.format(new Date(sliderMin))}</span>
                      <div className="h-px flex-1 mx-4 bg-zinc-800" />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">{fmt.format(new Date(sliderMax))}</span>
                    </div>
                  </div>
                )}
              </div>
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
            <div className="mb-2 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Strava Sync</p>
                <h2 className="text-xl font-bold text-white">Importer mes activités</h2>
              </div>
              <button
                onClick={() => setImportOpen(false)}
                className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-800 hover:text-white transition-all border border-transparent hover:border-zinc-700"
                aria-label="Fermer"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                  <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <p className="mb-6 text-sm text-zinc-400">
              Lance la synchronisation de tes activités Strava. Seules les nouvelles courses seront téléchargées.
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
