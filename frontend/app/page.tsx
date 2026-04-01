import { getCurrentUser } from '@/lib/auth'
import { ImportPanel } from '@/components/ImportPanel'

export default async function Home() {
  const user = await getCurrentUser()

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-white">
            Running Map
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Visualise toutes les rues que tu as courues.
          </p>
          <a
            href={`${apiUrl}/api/auth/strava`}
            className="flex items-center gap-3 rounded-full bg-[#FC4C02] px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
            </svg>
            Se connecter avec Strava
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="flex flex-col items-center gap-6 text-center">
        {user.profilePicture && (
          <img
            src={user.profilePicture}
            alt={`${user.firstname} ${user.lastname}`}
            className="h-16 w-16 rounded-full object-cover"
          />
        )}
        <div>
          <h1 className="text-2xl font-semibold text-black dark:text-white">
            Bonjour, {user.firstname} !
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Connecté via Strava
          </p>
        </div>
        <ImportPanel />
        <a
          href="/map"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline underline-offset-2"
        >
          Voir la carte
        </a>
      </div>
    </div>
  )
}
