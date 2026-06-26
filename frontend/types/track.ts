export interface Track {
  id: string
  zone: string
  name: string | null
  coordinates: number[][]
  firstRunAt: string | null
  firstRunAtMs: number | null
  lastRunAt: string | null
  lengthM: number
}
