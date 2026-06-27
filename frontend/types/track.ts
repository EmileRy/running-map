export interface Track {
  id: string
  zone: string
  name: string | null
  coordinates: number[][]
  firstRunAt: string | null
  lastRunAt: string | null
  firstRunAtMs: number | null // Pre-calculated for performance
  lengthM: number
}
