import { notFound } from 'next/navigation'
import { getBoardBySlug } from '@/lib/boards/queries'
import { BoardPageClient } from '@/components/board/board-page'
import { BOARD_SLUGS } from '@/lib/boards/templates'
import { PageTitle } from '@/components/page-title'
import { getOrgContext } from '@/lib/boards/org-context'

export default async function BoardPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  if (!BOARD_SLUGS.includes(slug)) {
    notFound()
  }

  const data = await getBoardBySlug(slug)

  const ctx = await getOrgContext()

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <PageTitle className="mb-2">
          {ctx ? 'Board não encontrado' : 'Sessão expirada'}
        </PageTitle>
        <p className="font-body text-we-paper/50 text-sm max-w-md">
          {ctx
            ? `Não foi possível carregar o board "${slug}". Tente recarregar a página.`
            : 'Faça login novamente para acessar seus boards.'}
        </p>
      </div>
    )
  }

  return <BoardPageClient data={data} currentUserId={ctx?.user.id ?? null} />
}
