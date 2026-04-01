'use client'

import { useState, useEffect, useCallback } from 'react'

type ImportStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR'

interface ImportJob {
  status: ImportStatus
  totalActivities: number
  processedActivities: number
  errorMessage?: string
}

export function ImportPanel() {
  const [job, setJob] = useState<ImportJob | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchStatus = useCallback(async () => {
    const res = await fetch('/api/import/status')
    if (res.status === 204) {
      setJob(null)
      return
    }
    if (res.ok) {
      setJob(await res.json())
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    if (job?.status === 'RUNNING' || job?.status === 'PENDING') {
      const id = setInterval(fetchStatus, 5000)
      return () => clearInterval(id)
    }
  }, [job?.status, fetchStatus])

  const startImport = async () => {
    setLoading(true)
    const res = await fetch('/api/import/start', { method: 'POST' })
    if (res.ok) {
      setJob(await res.json())
    }
    setLoading(false)
  }

  if (job?.status === 'RUNNING' || job?.status === 'PENDING') {
    const pct = job.totalActivities > 0
      ? Math.round((job.processedActivities / job.totalActivities) * 100)
      : 0
    return (
      <div className="flex flex-col items-center gap-3 w-64">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Import en cours… {job.processedActivities} / {job.totalActivities > 0 ? job.totalActivities : '?'}
        </p>
        <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className="h-2 rounded-full bg-[#FC4C02] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-zinc-400">{pct}%</p>
      </div>
    )
  }

  if (job?.status === 'DONE') {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm font-medium text-green-600 dark:text-green-400">
          Import terminé — {job.totalActivities} course{job.totalActivities > 1 ? 's' : ''} importée{job.totalActivities > 1 ? 's' : ''}
        </p>
        <button
          onClick={startImport}
          className="text-xs text-zinc-400 hover:text-zinc-600 underline underline-offset-2"
        >
          Relancer
        </button>
      </div>
    )
  }

  if (job?.status === 'ERROR') {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-red-500">Erreur : {job.errorMessage ?? 'inconnue'}</p>
        <button
          onClick={startImport}
          disabled={loading}
          className="rounded-full border border-red-400 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
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
      className="rounded-full bg-zinc-900 px-6 py-3 font-semibold text-white transition-opacity hover:opacity-80 dark:bg-white dark:text-black disabled:opacity-50"
    >
      {loading ? 'Démarrage…' : 'Importer mes activités Strava'}
    </button>
  )
}
