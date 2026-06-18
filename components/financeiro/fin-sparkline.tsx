'use client'

import { LineChart, Line } from 'recharts'

type Props = {
  data: number[]
  color: string
  width?: number
  height?: number
}

export function FinSparkline({ data, color, width = 80, height = 32 }: Props) {
  if (data.length < 2 || data.every(v => v === 0)) return null
  const chartData = data.map((value, i) => ({ i, value }))

  return (
    <LineChart width={width} height={height} data={chartData}>
      <Line
        type="monotone"
        dataKey="value"
        stroke={color}
        strokeWidth={1.5}
        dot={false}
        isAnimationActive={false}
      />
    </LineChart>
  )
}
