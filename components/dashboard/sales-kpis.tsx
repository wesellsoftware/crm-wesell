"use client"

import { NumberTicker } from "@/registry/magicui/number-ticker"
import type { NegociacoesAnalytics } from "@/lib/boards/analytics"
import { CalendarClock, Receipt, TrendingUp } from "lucide-react"

const tickerClass =
  "font-body text-3xl text-we-paper leading-none font-medium tracking-tighter"

export function SalesKpis({ analytics }: { analytics: NegociacoesAnalytics }) {
  const hasData = analytics.wonCount > 0

  const cards = [
    {
      label: "Ticket médio",
      prefix: hasData ? "R$ " : undefined,
      value: analytics.avgTicket,
      decimalPlaces: 0,
      hint: hasData
        ? `${analytics.wonCount} negócio${analytics.wonCount !== 1 ? "s" : ""} ganho${analytics.wonCount !== 1 ? "s" : ""}`
        : "Sem ganhos fechados",
      icon: Receipt,
      color: "#4342F5",
    },
    {
      label: "Média receita/mês",
      prefix: hasData ? "R$ " : undefined,
      value: analytics.avgMonthlyRevenue,
      decimalPlaces: 0,
      hint: "Média das receitas mensais dos ganhos",
      icon: TrendingUp,
      color: "#45F47F",
    },
    {
      label: "Ciclo de vendas médio",
      value: analytics.avgSalesCycleDays,
      suffix: hasData ? " dias" : undefined,
      decimalPlaces: 0,
      hint: "Da criação até Fechado/Ganho",
      icon: CalendarClock,
      color: "#D7FE65",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map(({ label, value, prefix, suffix, decimalPlaces, hint, icon: Icon, color }, index) => (
        <div key={label} className="glass rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-body text-xs text-we-paper/45 uppercase tracking-wide">{label}</p>
            <div
              className="size-7 rounded-lg flex items-center justify-center"
              style={{ background: `${color}22` }}
            >
              <Icon size={14} style={{ color }} />
            </div>
          </div>
          <p className="font-body text-3xl text-we-paper leading-none">
            {hasData ? (
              <>
                {prefix}
                <NumberTicker
                  value={value}
                  decimalPlaces={decimalPlaces}
                  delay={index * 0.1}
                  className={tickerClass}
                />
                {suffix}
              </>
            ) : (
              "—"
            )}
          </p>
          <p className="font-body text-xs text-we-paper/35">{hint}</p>
        </div>
      ))}
    </div>
  )
}
