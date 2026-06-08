'use client'

import type { BoardColumn, BoardItem, BoardItemValue } from '@/lib/boards/types'
import { formatCurrency } from '@/lib/utils'
import { getStatusOption } from '@/lib/boards/column-types'

interface BoardGroupFooterProps {
  groupItems: BoardItem[]
  columns: BoardColumn[]
  values: BoardItemValue[]
  extraCols?: number
}

export function BoardGroupFooter({ groupItems, columns, values, extraCols = 0 }: BoardGroupFooterProps) {
  const currencyCol = columns.find(c => c.type === 'currency')
  const statusCol = columns.find(c => c.type === 'status')

  let total = 0
  if (currencyCol) {
    for (const item of groupItems) {
      const val = values.find(v => v.item_id === item.id && v.column_id === currencyCol.id)
      total += Number((val?.value as { amount?: number })?.amount ?? 0)
    }
  }

  const statusCounts: Record<string, { count: number; color: string; label: string }> = {}
  if (statusCol) {
    for (const item of groupItems) {
      const val = values.find(v => v.item_id === item.id && v.column_id === statusCol.id)
      const optionId = (val?.value as { option_id?: string })?.option_id
      if (optionId) {
        const opt = getStatusOption(statusCol.settings, optionId)
        if (opt) {
          if (!statusCounts[optionId]) {
            statusCounts[optionId] = { count: 0, color: opt.color, label: opt.label }
          }
          statusCounts[optionId].count++
        }
      }
    }
  }

  const statusEntries = Object.values(statusCounts)
  const totalStatus = statusEntries.reduce((s, e) => s + e.count, 0)

  if (!currencyCol && statusEntries.length === 0) return null

  return (
    <tfoot>
      <tr className="border-t border-white/[0.06] bg-white/[0.02]">
        <td className="px-2 py-2 border-r border-white/[0.04]" />
        {columns.map(col => {
          if (col.type === 'currency') {
            return (
              <td key={col.id} className="px-3 py-2 border-r border-white/[0.04]">
                <span className="font-mono text-xs font-semibold text-we-paper/60">
                  Total {formatCurrency(total)}
                </span>
              </td>
            )
          }
          if (col.type === 'status' && statusEntries.length > 0) {
            return (
              <td key={col.id} className="px-3 py-2 border-r border-white/[0.04]">
                <div className="flex h-2.5 rounded-full overflow-hidden gap-px max-w-[220px]">
                  {statusEntries.map(entry => (
                    <div
                      key={entry.label}
                      className="h-full transition-all"
                      style={{
                        backgroundColor: entry.color,
                        width: `${(entry.count / totalStatus) * 100}%`,
                      }}
                      title={`${entry.label}: ${entry.count}`}
                    />
                  ))}
                </div>
              </td>
            )
          }
          return <td key={col.id} className="px-3 py-2 border-r border-white/[0.04]" />
        })}
        {extraCols > 0 && Array.from({ length: extraCols }).map((_, i) => (
          <td key={`extra-${i}`} className="px-3 py-2" />
        ))}
      </tr>
    </tfoot>
  )
}
