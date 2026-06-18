'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const items = [
  { href: '/financeiro/dashboard', label: 'Dashboard' },
  { href: '/financeiro/lancamentos', label: 'Lançamentos' },
  { href: '/financeiro/dre', label: 'DRE' },
  { href: '/financeiro/crescimento', label: 'Crescimento' },
  { href: '/financeiro/metas', label: 'Metas' },
  { href: '/financeiro/categorias', label: 'Categorias' },
]

export function FinSubnav() {
  const pathname = usePathname()
  return (
    <div className="flex items-center gap-1 border-b border-white/[0.07] px-8 pt-6 pb-0">
      {items.map(({ href, label }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'px-3 pb-3 text-sm font-body border-b-2 transition-colors',
              active
                ? 'border-we-blue text-we-paper'
                : 'border-transparent text-we-paper/45 hover:text-we-paper/70',
            )}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
