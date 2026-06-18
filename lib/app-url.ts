import { headers } from 'next/headers'

const PRODUCTION_ORIGIN = 'https://crm.wesellsoftware.com.br'

function isLocalhostUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url)
}

export async function getAppOrigin(): Promise<string> {
  const configured =
    process.env.SITE_URL?.replace(/\/$/, '') ??
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')

  if (configured) {
    if (process.env.NODE_ENV === 'production' && isLocalhostUrl(configured)) {
      return PRODUCTION_ORIGIN
    }
    return configured
  }

  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? (host?.includes('localhost') ? 'http' : 'https')

  if (host) {
    if (process.env.NODE_ENV === 'production' && isLocalhostUrl(host)) {
      return PRODUCTION_ORIGIN
    }
    return `${proto}://${host}`
  }

  if (process.env.NODE_ENV === 'production') return PRODUCTION_ORIGIN

  return 'http://localhost:3000'
}

/** Origin for auth e-mail links (reset password, invites). Never relies on NEXT_PUBLIC_* in production. */
export async function getAuthRedirectOrigin(): Promise<string> {
  const siteUrl = process.env.SITE_URL?.replace(/\/$/, '')
  if (siteUrl) return siteUrl

  if (process.env.NODE_ENV === 'production') return PRODUCTION_ORIGIN

  return getAppOrigin()
}
