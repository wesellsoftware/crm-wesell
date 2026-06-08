'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: formData.get('password') as string,
  })

  if (error) {
    if (error.code === 'email_not_confirmed') {
      return {
        type: 'unverified' as const,
        error: 'Você ainda não confirmou seu e-mail. Verifique sua caixa de entrada (e o spam).',
        email,
      }
    }
    return { type: 'credentials' as const, error: 'E-mail ou senha inválidos.' }
  }

  redirect('/dashboard')
}

export async function resendVerification(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: formData.get('email') as string,
  })
  if (error) return { error: error.message, sent: false }
  return { sent: true }
}

export async function signup(_: unknown, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('admin_name') as string,
        org_name: formData.get('org_name') as string,
      },
    },
  })

  if (error) return { error: error.message }
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function forgotPassword(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') ?? 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(
    formData.get('email') as string,
    { redirectTo: `${origin}/auth/callback?next=/nova-senha` }
  )

  if (error) return { error: error.message }
  return { success: true }
}

export async function updatePassword(_: unknown, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: formData.get('password') as string,
  })

  if (error) return { error: error.message }
  redirect('/dashboard')
}
