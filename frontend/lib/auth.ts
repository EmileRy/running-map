import { cookies } from 'next/headers'

export interface User {
  id: string
  stravaId: number
  firstname: string
  lastname: string
  profilePicture: string
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return null

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

  try {
    const res = await fetch(`${apiUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}
