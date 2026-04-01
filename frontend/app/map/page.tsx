import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { MapLayout } from '@/components/MapLayout'

interface Track {
  id: string
  name: string
  coordinates: number[][]
}

interface TracksPage {
  content: Track[]
  last: boolean
}

async function fetchAllTracks(token: string): Promise<Track[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
  const all: Track[] = []
  let page = 0

  while (true) {
    const res = await fetch(`${apiUrl}/api/tracks?page=${page}&size=100`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) break

    const data: TracksPage = await res.json()
    all.push(...data.content)
    if (data.last) break
    page++
  }

  return all
}

export default async function MapPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/')

  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value ?? ''

  const tracks = await fetchAllTracks(token)
  const tracksWithCoords = tracks.filter((t) => t.coordinates?.length >= 2)

  return <MapLayout user={user} tracks={tracksWithCoords} />
}
