import { createClient } from '@/lib/supabase/server'

export async function ensureOrganizationBoards(organizationId: string) {
  const supabase = await createClient()

  const { error: seedError } = await supabase.rpc('seed_organization_boards', {
    p_org_id: organizationId,
  })

  if (seedError) {
    console.error('Failed to seed organization boards:', seedError.message)
    return { seeded: false, error: seedError.message }
  }

  const { error: ensureError } = await supabase.rpc('ensure_negociacoes_produto_column', {
    p_org_id: organizationId,
  })

  if (ensureError && !ensureError.message.includes('does not exist')) {
    console.error('Failed to ensure negociacoes produto column:', ensureError.message)
  }

  const { error: demoError } = await supabase.rpc('seed_demo_board_items')

  if (demoError && !demoError.message.includes('does not exist')) {
    console.error('Failed to seed demo items:', demoError.message)
  }

  return { seeded: true }
}
