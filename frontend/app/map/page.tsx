import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { MapLayout } from '@/components/MapLayout'

interface Street {
  id: string
  name: string | null
  coordinates: number[][]
}

async function fetchCoveredStreets(token: string): Promise<Street[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
  const res = await fetch(`${apiUrl}/api/streets/covered`, {
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

  const streets = await fetchCoveredStreets(token)
  const streetsWithCoords = streets.filter((s) => s.coordinates?.length >= 2)

  return <MapLayout user={user} tracks={streetsWithCoords} />
}
