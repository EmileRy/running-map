'use client'

import { useState, useEffect, useCallback } from 'react'
import { Spinner } from './Spinner'

type ImportStatus = 'PENDING' | 'RUNNING' | 'COMPUTING_STREETS' | 'DONE' | 'ERROR'

export interface ImportJob {
  status: ImportStatus
  totalActivities: number
  processedActivities: number
  errorMessage?: string
  queuePosition?: number
}

interface Props {
  onStatusChange?: (job: ImportJob | null) => void
  onLoadingChange?: (loading: boolean) => void
  tracksCount?: number
  zonesCount?: number
}


export function ImportPanel({ onStatusChange, onLoadingChange, tracksCount = 0, zonesCount = 0 }: Props) {
  const [job, setJob] = useState<ImportJob | null>(null)
  const [loading, setLoading] = useState(false)

  const updateJob = useCallback((next: ImportJob | null) => {
    setJob(next)
    onStatusChange?.(next)
  }, [onStatusChange])

  const fetchStatus = useCallback(async () => {
    const res = await fetch('/api/import/status')
    if (res.status === 204) { updateJob(null); return }
    if (res.ok) updateJob(await res.json())
  }, [updateJob])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  useEffect(() => {
    const active: ImportStatus[] = ['PENDING', 'RUNNING', 'COMPUTING_STREETS']
    if (job?.status && active.includes(job.status)) {
      const id = setInterval(fetchStatus, 5000)
      return () => clearInterval(id)
    }
  }, [job?.status, fetchStatus])

  const startImport = async () => {
    setLoading(true)
    onLoadingChange?.(true)
    const res = await fetch('/api/import/start', { method: 'POST' })
    if (res.ok) updateJob(await res.json())
    setLoading(false)
    onLoadingChange?.(false)
  }

  if (job?.status === 'PENDING') {
    return (
      <div className="flex flex-col items-center gap-3 w-64">
        <div className="flex items-center gap-2">
          <Spinner />
          <p className="text-sm text-zinc-400">En file d&apos;attente…</p>
        </div>
        {job.queuePosition != null && job.queuePosition > 0 && (
          <p className="text-xs text-zinc-500">
            {job.queuePosition} import{job.queuePosition > 1 ? 's' : ''} en cours devant vous
          </p>
        )}
      </div>
    )
  }

  if (job?.status === 'RUNNING') {
    const fetching = job.totalActivities === 0
    const pct = job.totalActivities > 0
      ? Math.round((job.processedActivities / job.totalActivities) * 100)
      : 0
    return (
      <div className="flex flex-col items-center gap-3 w-64">
        {fetching ? (
          <div className="flex items-center gap-2">
            <Spinner />
            <p className="text-sm text-zinc-400">Récupération des courses…</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-zinc-400">
              Import en cours… {job.processedActivities} / {job.totalActivities}
            </p>
            <div className="h-2 w-full rounded-full bg-zinc-700">
              <div
                className="h-2 rounded-full bg-[#FC4C02] transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500">{pct}%</p>
          </>
        )}
      </div>
    )
  }

  if (job?.status === 'COMPUTING_STREETS') {
    return (
      <div className="flex flex-col items-center gap-3 w-64">
        <div className="flex items-center gap-2">
          <Spinner />
          <p className="text-sm text-zinc-400">Calcul des rues explorées…</p>
        </div>
        <div className="h-2 w-full rounded-full bg-zinc-700 overflow-hidden">
          <div className="h-2 w-1/3 rounded-full bg-[#FC4C02] animate-[slide_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    )
  }

  if (job?.status === 'DONE') {
    const streetsLabel = tracksCount >= 1000
      ? `${Math.round(tracksCount / 1000)}k`
      : `${tracksCount}`
    return (
      <div className="flex flex-col items-center gap-8 text-center w-full">
        <div className="grid grid-cols-3 gap-4 w-full">
          <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-zinc-800/50 border border-zinc-700/50">
            <span className="text-2xl font-bold text-white tabular-nums">{job.totalActivities}</span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Courses</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-zinc-800/50 border border-zinc-700/50">
            <span className="text-2xl font-bold text-white tabular-nums">{streetsLabel}</span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Rues</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-zinc-800/50 border border-zinc-700/50">
            <span className="text-2xl font-bold text-white tabular-nums">{zonesCount}</span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Zones</span>
          </div>
        </div>
        <button
          onClick={startImport}
          disabled={loading}
          className="group relative flex items-center justify-center gap-2 rounded-2xl bg-[#FC4C02] px-6 py-4 font-bold text-white transition-all hover:bg-[#E34402] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 w-full shadow-lg shadow-[#FC4C02]/20"
        >
          {loading ? (
            <Spinner />
          ) : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" />
              </svg>
              Relancer la synchronisation
            </>
          )}
        </button>
      </div>
    )
  }

  if (job?.status === 'ERROR') {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-red-400">Erreur : {job.errorMessage ?? 'inconnue'}</p>
        <button
          onClick={startImport}
          disabled={loading}
          className="rounded-full border border-red-500 px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 disabled:opacity-50"
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={startImport}
      disabled={loading}
      className="group relative flex items-center justify-center gap-3 rounded-2xl bg-[#FC4C02] px-8 py-4 font-bold text-white transition-all hover:bg-[#E34402] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-[#FC4C02]/20"
    >
      {loading ? (
        <Spinner />
      ) : (
        <>
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" />
          </svg>
          Importer mes activités Strava
        </>
      )}
    </button>
  )
}
