import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FinSubnav } from '@/components/financeiro/fin-subnav'

export default async function FinanceiroLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="flex flex-col h-full">
      <FinSubnav />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}
