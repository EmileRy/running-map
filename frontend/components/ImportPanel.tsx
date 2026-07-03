'use client'

import { useState, useEffect, useCallback } from 'react'

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

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-[#FC4C02]" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
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

  useEffect(() => {
    setTimeout(() => {
      fetchStatus()
    }, 0)
  }, [fetchStatus])

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
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex gap-8">
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-semibold text-white">{job.totalActivities}</span>
            <span className="text-xs text-zinc-500">course{job.totalActivities > 1 ? 's' : ''}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-semibold text-white">{streetsLabel}</span>
            <span className="text-xs text-zinc-500">rues couvertes</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-semibold text-white">{zonesCount}</span>
            <span className="text-xs text-zinc-500">zone{zonesCount > 1 ? 's' : ''}</span>
          </div>
        </div>
        <button
          onClick={startImport}
          disabled={loading}
          className="rounded-full bg-white px-6 py-3 font-semibold text-black transition-opacity hover:opacity-80 disabled:opacity-50 w-full"
        >
          {loading ? 'Démarrage…' : 'Relancer la synchronisation'}
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
      className="rounded-full bg-white px-6 py-3 font-semibold text-black transition-opacity hover:opacity-80 disabled:opacity-50"
    >
      {loading ? 'Démarrage…' : 'Importer mes activités'}
    </button>
  )
}
