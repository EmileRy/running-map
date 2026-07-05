import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { MapLayout } from '@/components/MapLayout'

interface Track {
  id: string
  zone: string
  name: string | null
  coordinates: number[][]
  firstRunAt: string | null
  firstRunAtMs: number | null
  lastRunAt: string | null
  lengthM: number
}

interface Street {
  id: string
  zone: string
  name: string | null
  coordinates: number[][]
  firstRunAt: string | null
  lastRunAt: string | null
  lengthM: number
}

interface Zone {
  name: string
  covered: number
  total: number
  totalLengthM: number
  percentage: number
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

async function fetchCoveredStreets(token: string): Promise<Street[]> {
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
  // In Server Components, Date.now() is acceptable for generating a stable timestamp for the current request
  // eslint-disable-next-line react-hooks/purity
  const serverNow = Date.now()
  const tracks: Track[] = streets
    .filter((s) => s.coordinates?.length >= 2)
    .map((s) => ({
      ...s,
      firstRunAtMs: s.firstRunAt ? new Date(s.firstRunAt).getTime() : null,
    }))

  return <MapLayout user={user} tracks={tracks} zones={zones} serverNow={serverNow} />
}
