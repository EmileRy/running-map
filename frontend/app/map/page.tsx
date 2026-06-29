import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { MapLayout } from '@/components/MapLayout'
import type { Track } from '@/types/track'
import type { Zone } from '@/types/zone'

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

type RawStreet = Omit<Track, 'firstRunAtMs'>

async function fetchCoveredStreets(token: string): Promise<RawStreet[]> {
  const res = await fetch(`${apiUrl}/api/streets/covered`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
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

  // Pre-calculate numeric timestamps on the server to avoid expensive Date parsing during slider re-renders
  const tracks: Track[] = streets
    .filter((s) => s.coordinates?.length >= 2)
    .map((s) => ({
      ...s,
      firstRunAtMs: s.firstRunAt ? new Date(s.firstRunAt).getTime() : null,
    }))

  return <MapLayout user={user} tracks={tracks} zones={zones} />
}
