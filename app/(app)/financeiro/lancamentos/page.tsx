import { PageTitle } from '@/components/page-title'
import { FinTransactionsTable } from '@/components/financeiro/fin-transactions-table'
import {
  getFinTransactions,
  getFinCategories,
  getFinAccountsForSelect,
  getFinClientsForSelect,
  getFinProjectsForSelect,
} from '@/lib/financeiro/queries'

type SearchParams = {
  tab?: string
  status?: string
}

export default async function LancamentosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const activeTab = (params.tab === 'despesa' ? 'despesa' : 'receita') as 'receita' | 'despesa'
  const initialStatus = ['pendente', 'atrasado', 'pago'].includes(params.status ?? '')
    ? (params.status as 'pendente' | 'atrasado' | 'pago')
    : undefined

  const [receitas, despesas, categories, banks, clients, projects] = await Promise.all([
    getFinTransactions({ type: 'receita' }),
    getFinTransactions({ type: 'despesa' }),
    getFinCategories(),
    getFinAccountsForSelect(),
    getFinClientsForSelect(),
    getFinProjectsForSelect(),
  ])

  return (
    <div className="p-8 space-y-6">
      <div>
        <PageTitle>Lançamentos</PageTitle>
        <p className="font-body text-we-paper/45 text-sm mt-0.5">Contas a receber e a pagar</p>
      </div>

      {/* Tab switcher */}
      <TabSwitcher active={activeTab} />

      {activeTab === 'receita' ? (
        <FinTransactionsTable
          rows={receitas}
          type="receita"
          categories={categories}
          banks={banks}
          clients={clients}
          projects={projects}
          initialStatus={initialStatus}
        />
      ) : (
        <FinTransactionsTable
          rows={despesas}
          type="despesa"
          categories={categories}
          banks={banks}
          clients={clients}
          projects={projects}
          initialStatus={initialStatus}
        />
      )}
    </div>
  )
}

function TabSwitcher({ active }: { active: 'receita' | 'despesa' }) {
  const tabBase = 'px-5 py-2 text-sm font-body transition-colors'
  const tabInactive = 'text-we-paper/45 hover:text-we-paper/70'

  return (
    <div className="flex items-center gap-0 border border-white/[0.10] rounded-lg w-fit overflow-hidden">
      <a
        href="/financeiro/lancamentos?tab=receita"
        className={`${tabBase} ${
          active === 'receita'
            ? 'bg-we-green/20 backdrop-blur-[8px] text-white'
            : tabInactive
        }`}
      >
        A receber
      </a>
      <a
        href="/financeiro/lancamentos?tab=despesa"
        className={`${tabBase} ${
          active === 'despesa'
            ? 'bg-we-red/20 backdrop-blur-[8px] text-white'
            : tabInactive
        }`}
      >
        A pagar
      </a>
    </div>
  )
}
