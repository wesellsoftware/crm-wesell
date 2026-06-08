import { MemberAvatar } from '@/components/board/cells/member-avatar'
import type { TopSeller } from '@/lib/boards/analytics'
import { cn, formatCurrency } from '@/lib/utils'

const RANK_COLORS = ['#D7FE65', '#45D4F4', '#F4A545']

export function TopSellersRanking({ data }: { data: TopSeller[] }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="font-mono text-base text-we-paper/25">Sem vendedores no ranking</p>
      </div>
    )
  }

  const maxRevenue = data[0]?.revenue ?? 0

  return (
    <ol className="space-y-3">
      {data.map((seller, index) => {
        const width = maxRevenue > 0 ? (seller.revenue / maxRevenue) * 100 : 0
        const rankColor = RANK_COLORS[index] ?? 'rgba(237,237,235,0.35)'

        return (
          <li
            key={seller.id}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className="font-mono text-base font-semibold w-6 text-center shrink-0"
                style={{ color: rankColor }}
              >
                {index + 1}
              </span>
              <MemberAvatar
                member={{ full_name: seller.name, avatar_url: seller.avatar_url }}
                size="default"
              />
              <div className="min-w-0 flex-1">
                <p className="font-body text-base text-we-paper/85 truncate">{seller.name}</p>
                <p className="font-body text-base text-we-paper/45">
                  {seller.dealCount} negócio{seller.dealCount !== 1 ? 's' : ''}
                </p>
              </div>
              <p className="font-mono text-base text-we-lime shrink-0">
                {formatCurrency(seller.revenue)}
              </p>
            </div>
            <div className="mt-2.5 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all')}
                style={{ width: `${width}%`, backgroundColor: rankColor }}
              />
            </div>
          </li>
        )
      })}
    </ol>
  )
}
