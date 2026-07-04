import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { MapLayout } from '@/components/MapLayout'
import type { Track } from '@/types/track'
import type { Zone } from '@/types/zone'

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

async function fetchCoveredStreets(token: string): Promise<Track[]> {
  const res = await fetch(`${apiUrl}/api/streets/covered`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) return []
  const tracks: Track[] = await res.json()

  // Optimization: Pre-calculate numeric timestamps on the server
  // to avoid O(N) Date parsing on every slider interaction on the client.
  return tracks.map(t => ({
    ...t,
    firstRunAtMs: t.firstRunAt ? new Date(t.firstRunAt).getTime() : null
  }))
}

async function fetchZones(token: string): Promise<Zone[]> {
  const res = await fetch(`${apiUrl}/api/streets/zones`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

export default async function MapPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/')

  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value ?? ''

  const [streets, zones] = await Promise.all([
    fetchCoveredStreets(token),
    fetchZones(token),
  ])
  const streetsWithCoords = streets.filter((s) => s.coordinates?.length >= 2)
  const serverNow = new Date().getTime()

  return <MapLayout user={user} tracks={streetsWithCoords} zones={zones} serverNow={serverNow} />
}
