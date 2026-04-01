'use client'

import { useState, useRef, useEffect } from 'react'
import { MapView } from './MapView'
import { ImportPanel } from './ImportPanel'

interface User {
  firstname: string
  lastname: string
  profilePicture?: string
}

interface Track {
  id: string
  name: string
  coordinates: number[][]
}

export function MapLayout({ user, tracks }: { user: User; tracks: Track[] }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Ferme le menu si clic en dehors
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
        <span className="font-semibold tracking-tight">Running Map</span>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            {user.profilePicture && (
              <img
                src={user.profilePicture}
                alt=""
                className="h-6 w-6 rounded-full object-cover"
              />
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
      </header>

      {/* Map — isolate confine les z-indexes internes de Leaflet (200-800) dans ce contexte */}
      <div className="flex-1 min-h-0 isolate">
        <MapView tracks={tracks} runCount={tracks.length} />
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
              Lance la synchronisation de tes activités Strava. Seules les nouvelles courses seront téléchargées.
            </p>

            <div className="flex justify-center">
              <ImportPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
