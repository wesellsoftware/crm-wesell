export interface WonDealRecord {
  id: string
  amount: number
  createdAt: string
  closedAt: string
  productLabels: string[]
  sellerIds: string[]
}

export interface TopSeller {
  id: string
  name: string
  avatar_url: string | null
  revenue: number
  dealCount: number
}

export interface NegociacoesAnalytics {
  avgTicket: number
  avgMonthlyRevenue: number
  avgSalesCycleDays: number
  revenueByProduct: { product: string; revenue: number; color: string }[]
  topSellers: TopSeller[]
  wonCount: number
}

const NO_PRODUCT_LABEL = 'Sem produto'
const NO_SELLER_ID = '__unassigned__'
const DEFAULT_PRODUCT_COLOR = 'rgba(237,237,235,0.35)'

interface AnalyticsMember {
  id: string
  full_name: string | null
  avatar_url: string | null
}

export function computeNegociacoesAnalytics(
  deals: WonDealRecord[],
  productColors: Record<string, string> = {},
  members: AnalyticsMember[] = []
): NegociacoesAnalytics {
  if (deals.length === 0) {
    return {
      avgTicket: 0,
      avgMonthlyRevenue: 0,
      avgSalesCycleDays: 0,
      revenueByProduct: [],
      topSellers: [],
      wonCount: 0,
    }
  }

  const totalRevenue = deals.reduce((sum, d) => sum + d.amount, 0)
  const avgTicket = totalRevenue / deals.length

  const monthlyTotals = new Map<string, number>()
  for (const deal of deals) {
    const month = deal.closedAt.slice(0, 7)
    monthlyTotals.set(month, (monthlyTotals.get(month) ?? 0) + deal.amount)
  }
  const monthlyValues = Array.from(monthlyTotals.values())
  const avgMonthlyRevenue =
    monthlyValues.length > 0
      ? monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length
      : 0

  const cycleDays = deals.map(d => {
    const created = new Date(d.createdAt).getTime()
    const closed = new Date(d.closedAt).getTime()
    return Math.max(0, Math.round((closed - created) / (1000 * 60 * 60 * 24)))
  })
  const avgSalesCycleDays = Math.round(
    cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length
  )

  const productRevenue = new Map<string, number>()
  for (const deal of deals) {
    const labels =
      deal.productLabels.length > 0 ? deal.productLabels : [NO_PRODUCT_LABEL]
    const share = deal.amount / labels.length
    for (const label of labels) {
      productRevenue.set(label, (productRevenue.get(label) ?? 0) + share)
    }
  }

  const revenueByProduct = Array.from(productRevenue.entries())
    .map(([product, revenue]) => ({
      product,
      revenue,
      color: productColors[product] ?? DEFAULT_PRODUCT_COLOR,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  const membersById = new Map(members.map(m => [m.id, m]))
  const sellerStats = new Map<string, { revenue: number; dealCount: number }>()

  for (const deal of deals) {
    const sellerIds =
      deal.sellerIds.length > 0 ? deal.sellerIds : [NO_SELLER_ID]
    const revenueShare = deal.amount / sellerIds.length

    for (const sellerId of sellerIds) {
      const current = sellerStats.get(sellerId) ?? { revenue: 0, dealCount: 0 }
      sellerStats.set(sellerId, {
        revenue: current.revenue + revenueShare,
        dealCount: current.dealCount + 1,
      })
    }
  }

  const topSellers = Array.from(sellerStats.entries())
    .map(([id, stats]) => {
      const member = membersById.get(id)
      return {
        id,
        name:
          id === NO_SELLER_ID
            ? 'Sem responsável'
            : member?.full_name?.trim() || 'Usuário',
        avatar_url: id === NO_SELLER_ID ? null : member?.avatar_url ?? null,
        revenue: stats.revenue,
        dealCount: stats.dealCount,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)

  return {
    avgTicket,
    avgMonthlyRevenue,
    avgSalesCycleDays,
    revenueByProduct,
    topSellers,
    wonCount: deals.length,
  }
}
