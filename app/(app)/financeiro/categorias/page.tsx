import { PageTitle } from '@/components/page-title'
import { FinCategoriesManager } from '@/components/financeiro/fin-categories-manager'
import { getFinCategories } from '@/lib/financeiro/queries'

type SearchParams = {
  tab?: string
}

export default async function CategoriasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const activeTab = (params.tab === 'despesa' ? 'despesa' : 'receita') as 'receita' | 'despesa'

  const allCategories = await getFinCategories()
  const receitas = allCategories.filter(c => c.type === 'receita')
  const despesas = allCategories.filter(c => c.type === 'despesa')

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <div>
        <PageTitle>Categorias</PageTitle>
        <p className="font-body text-we-paper/45 text-sm mt-0.5">
          Plano de contas gerencial para classificar receitas e despesas
        </p>
      </div>

      <TabSwitcher active={activeTab} />

      <section className="glass rounded-xl p-6">
        {activeTab === 'receita' ? (
          <FinCategoriesManager categories={receitas} type="receita" />
        ) : (
          <FinCategoriesManager categories={despesas} type="despesa" />
        )}
      </section>
    </div>
  )
}

function TabSwitcher({ active }: { active: 'receita' | 'despesa' }) {
  const tabBase = 'px-5 py-2 text-sm font-body transition-colors'
  const tabInactive = 'text-we-paper/45 hover:text-we-paper/70'

  return (
    <div className="flex items-center gap-0 border border-white/[0.10] rounded-lg w-fit overflow-hidden">
      <a
        href="/financeiro/categorias?tab=receita"
        className={`${tabBase} ${
          active === 'receita'
            ? 'bg-we-green/20 backdrop-blur-[8px] text-white'
            : tabInactive
        }`}
      >
        Receitas
      </a>
      <a
        href="/financeiro/categorias?tab=despesa"
        className={`${tabBase} ${
          active === 'despesa'
            ? 'bg-we-red/20 backdrop-blur-[8px] text-white'
            : tabInactive
        }`}
      >
        Despesas
      </a>
    </div>
  )
}
