import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { MapLayout } from '@/components/MapLayout'
import { Track } from '@/types/track'
import { Zone } from '@/types/zone'

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

async function fetchCoveredStreets(token: string): Promise<Track[]> {
  const res = await fetch(`${apiUrl}/api/streets/covered`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) return []
  const data: Track[] = await res.json()
  // Pre-calculate numeric timestamps on server to avoid expensive Date parsing in the client render loops
  return data.map(track => ({
    ...track,
    firstRunAtMs: track.firstRunAt ? new Date(track.firstRunAt).getTime() : undefined
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

  return <MapLayout user={user} tracks={streetsWithCoords} zones={zones} />
}
