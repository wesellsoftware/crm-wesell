import { Target } from 'lucide-react'
import { PageTitle } from '@/components/page-title'
import { FinMetaForm } from '@/components/financeiro/fin-meta-form'
import { FinMetaCard } from '@/components/financeiro/fin-meta-card'
import { getFinMetaAtingimento } from '@/lib/financeiro/queries'

export default async function MetasPage() {
  const metas = await getFinMetaAtingimento()

  const mensais = metas.filter(m => m.tipo_cohort === 'mensal')
  const trimestrais = metas.filter(m => m.tipo_cohort === 'trimestral')
  const anuais = metas.filter(m => m.tipo_cohort === 'anual')

  return (
    <div className="p-8 space-y-8">
      <div>
        <PageTitle>Metas</PageTitle>
        <p className="font-body text-we-paper/45 text-sm mt-0.5">
          Acompanhamento de faturamento por cohort de tempo
        </p>
      </div>

      <FinMetaForm />

      {metas.length === 0 ? (
        <div className="glass rounded-xl flex flex-col items-center justify-center py-16 gap-3">
          <Target size={32} className="text-we-paper/20" />
          <p className="font-body text-sm text-we-paper/35">Nenhuma meta definida ainda</p>
          <p className="font-body text-xs text-we-paper/25">Use o formulário acima para criar a primeira meta.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {anuais.length > 0 && (
            <section className="space-y-3">
              <h3 className="font-body text-xs text-we-paper/40 uppercase tracking-wide">Metas anuais</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {anuais.map(m => <FinMetaCard key={m.id} meta={m} />)}
              </div>
            </section>
          )}

          {trimestrais.length > 0 && (
            <section className="space-y-3">
              <h3 className="font-body text-xs text-we-paper/40 uppercase tracking-wide">Metas trimestrais</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {trimestrais.map(m => <FinMetaCard key={m.id} meta={m} />)}
              </div>
            </section>
          )}

          {mensais.length > 0 && (
            <section className="space-y-3">
              <h3 className="font-body text-xs text-we-paper/40 uppercase tracking-wide">Metas mensais</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {mensais.map(m => <FinMetaCard key={m.id} meta={m} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
