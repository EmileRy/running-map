export interface Track {
  id: string
  zone: string
  name: string | null
  coordinates: number[][]
  firstRunAt: string | null
  lastRunAt: string | null
  lengthM: number
  /** Performance optimization: pre-calculated numeric timestamp */
  firstRunAtMs?: number | null
}
