import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const user = await getCurrentUser()

  if (user) redirect('/map')

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Running Map
        </h1>
        <p className="text-zinc-400">
          Visualise toutes les rues que tu as courues.
        </p>
        <a href={`${apiUrl}/api/auth/strava`} className="transition-opacity hover:opacity-90">
          <img src="/btn_strava_connect_with_orange.svg" alt="Se connecter avec Strava" height={48} />
        </a>
      </div>
    </div>
  )
}
