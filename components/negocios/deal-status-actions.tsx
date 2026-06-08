'use client'

import { useTransition } from 'react'
import { markDealWon, markDealLost } from '@/app/actions/deals'
import { Trophy, XCircle } from 'lucide-react'

export function DealStatusActions({ dealId }: { dealId: string }) {
  const [wonPending, startWon] = useTransition()
  const [lostPending, startLost] = useTransition()

  return (
    <div className="flex gap-3 pt-1">
      <button
        disabled={wonPending || lostPending}
        onClick={() => startWon(() => markDealWon(dealId))}
        className="flex items-center gap-2 px-4 h-9 rounded-[8px] bg-we-green/20 text-we-green font-body text-sm hover:bg-we-green/30 disabled:opacity-50 transition-colors"
      >
        <Trophy size={14} />
        {wonPending ? 'Salvando…' : 'Marcar como ganho'}
      </button>
      <button
        disabled={wonPending || lostPending}
        onClick={() => startLost(() => markDealLost(dealId))}
        className="flex items-center gap-2 px-4 h-9 rounded-[8px] bg-we-red/15 text-we-red font-body text-sm hover:bg-we-red/25 disabled:opacity-50 transition-colors"
      >
        <XCircle size={14} />
        {lostPending ? 'Salvando…' : 'Marcar como perdido'}
      </button>
    </div>
  )
}
