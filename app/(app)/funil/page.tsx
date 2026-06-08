import { createClient } from '@/lib/supabase/server'
import { KanbanBoard } from '@/components/funil/kanban-board'

export default async function FunilPage() {
  const supabase = await createClient()

  const [
    { data: stages },
    { data: deals },
    { data: contacts },
  ] = await Promise.all([
    supabase.from('stages').select('id, name, color, position').order('position'),
    supabase.from('deals')
      .select('id, title, value, stage_id, expected_close_date, created_at, contact:contacts(id, name)')
      .eq('status', 'open')
      .order('created_at'),
    supabase.from('contacts').select('id, name').order('name'),
  ])

  const typedDeals = (deals ?? []).map(d => ({
    ...d,
    value: Number(d.value),
    contact: (d.contact as unknown as { id: string; name: string } | null),
  }))

  return (
    <KanbanBoard
      stages={stages ?? []}
      deals={typedDeals}
      contacts={contacts ?? []}
    />
  )
}
