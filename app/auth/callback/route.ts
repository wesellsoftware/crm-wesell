import { NextResponse } from 'next/server'
import { getPostAuthRedirect, isPendingInvite } from '@/lib/auth/invite'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const type = searchParams.get('type')

  const error = searchParams.get('error')
  const errorCode = searchParams.get('error_code')
  if (error || errorCode) {
    const description = searchParams.get('error_description') ?? ''
    return NextResponse.redirect(
      `${origin}/login?error_code=${encodeURIComponent(errorCode ?? error ?? 'auth_error')}&error_description=${encodeURIComponent(description)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      const { data: { user } } = await supabase.auth.getUser()
      if (type === 'recovery') {
        if (user && isPendingInvite(user)) {
          return NextResponse.redirect(`${origin}/convite`)
        }
        return NextResponse.redirect(`${origin}/nova-senha`)
      }
      const destination = getPostAuthRedirect(user, next)
      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  // Hash fragments (#access_token=…) never reach the server — forward them client-side.
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Redirecionando…</title></head><body><script>window.location.replace('/auth/confirm'+(window.location.search||'')+window.location.hash)</script></body></html>`
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
