import { notFound } from 'next/navigation'
import { getNegociacoesKanbanData } from '@/lib/boards/queries'
import { NegociacoesKanban } from '@/components/board/negociacoes-kanban'

export default async function NegociacoesKanbanPage() {
  const data = await getNegociacoesKanbanData()
  if (!data) notFound()

  const valueCol = data.columns.find(c => c.type === 'currency')
  const contactCol = data.columns.find(c => c.name === 'Contato')

  const relatedNames: Record<string, string> = {}
  for (const r of data.relatedItems) {
    relatedNames[r.id] = r.name
  }

  return (
    <NegociacoesKanban
      stages={data.stages}
      itemsByStage={data.itemsByStage}
      values={data.values}
      valueColumnId={valueCol?.id}
      contactColumnId={contactCol?.id}
      relatedNames={relatedNames}
    />
  )
}
