"use client"

import { NumberTicker } from "@/registry/magicui/number-ticker"
import { Activity, Calendar, Target, TrendingUp } from "lucide-react"

const tickerClass =
  "font-body text-3xl text-we-paper leading-none font-medium tracking-tighter"

type PipelineKpisProps = {
  openCount: number
  pipelineValue: number
  wonCount: number
  conversionRate: number
}

export function PipelineKpis({
  openCount,
  pipelineValue,
  wonCount,
  conversionRate,
}: PipelineKpisProps) {
  const items = [
    { label: "Oportunidades ativas", value: openCount, icon: Target, color: "#4342F5" },
    { label: "Valor em pipeline", value: pipelineValue, prefix: "R$ ", icon: TrendingUp, color: "#45F47F" },
    { label: "Fechados/Ganhos", value: wonCount, icon: Calendar, color: "#D7FE65" },
    { label: "Taxa de conversão", value: conversionRate, suffix: "%", icon: Activity, color: "#7845F4" },
  ]

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {items.map(({ label, value, prefix, suffix, icon: Icon, color }, index) => (
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
            {prefix}
            <NumberTicker
              value={value}
              delay={index * 0.1}
              className={tickerClass}
            />
            {suffix}
          </p>
        </div>
      ))}
    </div>
  )
}
