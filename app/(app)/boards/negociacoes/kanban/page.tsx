import { notFound } from 'next/navigation'
import { getNegociacoesKanbanData } from '@/lib/boards/queries'
import { NegociacoesKanban } from '@/components/board/negociacoes-kanban'
import { getOrgContext } from '@/lib/boards/org-context'

export default async function NegociacoesKanbanPage() {
  const [data, ctx] = await Promise.all([
    getNegociacoesKanbanData(),
    getOrgContext(),
  ])
  if (!data) notFound()

  const valueCol = data.columns.find(c => c.type === 'currency')
  const contactCol = data.columns.find(c => c.name === 'Contato')
  const personCol = data.columns.find(c => c.name === 'Responsável' && c.type === 'person')

  const relatedNames: Record<string, string> = {}
  for (const r of data.relatedItems) {
    relatedNames[r.id] = r.name
  }

  return (
    <NegociacoesKanban
      groups={data.groups}
      itemsByGroup={data.itemsByGroup}
      values={data.values}
      columns={data.columns}
      members={data.members}
      relatedItems={data.relatedItems}
      valueColumnId={valueCol?.id}
      contactColumnId={contactCol?.id}
      personColumnId={personCol?.id}
      relatedNames={relatedNames}
      currentUserId={ctx?.user.id ?? null}
    />
  )
}
