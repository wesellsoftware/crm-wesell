import { headers } from 'next/headers'

export async function getAppOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (configured) return configured

  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? (host?.includes('localhost') ? 'http' : 'https')
  if (host) return `${proto}://${host}`

  return 'http://localhost:3000'
}
