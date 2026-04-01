import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    redirect('/?error=auth_failed')
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

  let token: string
  try {
    const res = await fetch(`${apiUrl}/api/auth/callback?code=${encodeURIComponent(code)}`)
    if (!res.ok) {
      redirect('/?error=auth_failed')
    }
    const data = await res.json()
    token = data.token
  } catch {
    redirect('/?error=auth_failed')
  }

  const cookieStore = await cookies()
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 86400,
    path: '/',
  })

  redirect('/')
}
