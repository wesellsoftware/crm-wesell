import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { DreData, DreSection } from '@/lib/financeiro/types'

function pct(part: number, total: number): string {
  if (!total) return '—'
  return `${((part / total) * 100).toFixed(1)}%`
}

function fmt(v: number) {
  return formatCurrency(Math.abs(v))
}

type RowProps = {
  label: string
  amount: number
  isSubtotal?: boolean
  isResult?: boolean
  indent?: boolean
  percentage?: string
  amountColor?: string
}

function Row({ label, amount, isSubtotal, isResult, indent, percentage, amountColor }: RowProps) {
  return (
    <tr
      className={cn(
        'border-b border-white/[0.04] transition-colors',
        isResult && 'border-t-2 border-t-white/[0.12]',
        isSubtotal && !isResult && 'border-t border-t-white/[0.08]',
        !indent && !isSubtotal && !isResult && 'hover:bg-white/[0.02]',
      )}
    >
      <td className={cn('py-2.5 font-body text-sm', indent ? 'pl-10 text-we-paper/55' : isResult ? 'pl-4 font-semibold text-we-paper' : 'pl-4 font-medium text-we-paper/80')}>
        {label}
      </td>
      <td className={cn('py-2.5 pr-4 text-right font-mono text-sm', amountColor ?? (indent ? 'text-we-paper/45' : isResult ? (amount >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-we-paper/70'))}>
        {fmt(amount)}
      </td>
      <td className="py-2.5 pr-4 text-right font-body text-xs text-we-paper/30 w-16">
        {percentage ?? ''}
      </td>
    </tr>
  )
}

function SectionBlock({ section, receitaBruta }: { section: DreSection; receitaBruta: number }) {
  const isDeduction = section.line !== 'receita_bruta'
  return (
    <>
      <Row
        label={isDeduction ? `(-) ${section.label}` : section.label}
        amount={section.total}
        isSubtotal
        amountColor={isDeduction ? 'text-red-400/80' : 'text-we-paper/70'}
        percentage={pct(section.total, receitaBruta)}
      />
      {section.breakdown.map(b => (
        <Row
          key={b.category_id ?? b.category_name}
          label={b.category_name}
          amount={b.amount}
          indent
        />
      ))}
    </>
  )
}

type Props = { data: DreData }

export function FinDreTable({ data }: Props) {
  const { receitaBruta } = data

  return (
    <div className="glass rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.08]">
            <th className="py-3 pl-4 text-left font-body text-xs text-we-paper/40 font-normal uppercase tracking-wide">
              Linha
            </th>
            <th className="py-3 pr-4 text-right font-body text-xs text-we-paper/40 font-normal uppercase tracking-wide">
              Valor
            </th>
            <th className="py-3 pr-4 text-right font-body text-xs text-we-paper/40 font-normal uppercase tracking-wide w-16">
              % RB
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Receita Bruta */}
          <SectionBlock section={data.sections[0]} receitaBruta={receitaBruta} />

          {/* Deduções */}
          <SectionBlock section={data.sections[1]} receitaBruta={receitaBruta} />

          {/* = Receita Líquida */}
          <Row
            label="= Receita Líquida"
            amount={data.receitaLiquida}
            isResult
            percentage={pct(data.receitaLiquida, receitaBruta)}
          />

          {/* Custos Diretos */}
          <SectionBlock section={data.sections[2]} receitaBruta={receitaBruta} />

          {/* = Margem de Contribuição */}
          <Row
            label="= Margem de Contribuição"
            amount={data.margemContribuicao}
            isResult
            percentage={pct(data.margemContribuicao, receitaBruta)}
          />

          {/* Despesas Fixas */}
          <SectionBlock section={data.sections[3]} receitaBruta={receitaBruta} />

          {/* = Resultado Operacional */}
          <Row
            label="= Resultado Operacional"
            amount={data.resultado}
            isResult
            percentage={pct(data.resultado, receitaBruta)}
          />
        </tbody>
      </table>

      {receitaBruta === 0 && (
        <div className="flex items-center justify-center py-10">
          <p className="font-body text-sm text-we-paper/30">
            Nenhuma transação encontrada para este período.
          </p>
        </div>
      )}
    </div>
  )
}
