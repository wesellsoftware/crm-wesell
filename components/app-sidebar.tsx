"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  Users,
  DollarSign,
  Target,
  Building2,
  CheckSquare,
  BarChart2,
  Settings,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { logout } from "@/app/actions/auth"
import { SidebarUserAvatar } from "@/components/sidebar-user-avatar"

const navItems = [
  { href: "/dashboard", label: "Painel de vendas", icon: BarChart2 },
  { href: "/boards/contatos", label: "Contatos", icon: Users },
  { href: "/boards/negociacoes", label: "Negociações", icon: DollarSign },
  { href: "/boards/leads", label: "Leads", icon: Target },
  { href: "/boards/contas", label: "Contas", icon: Building2 },
  { href: "/atividades", label: "Atividades", icon: CheckSquare },
  { href: "/configuracoes", label: "Config.", icon: Settings },
]

type AppSidebarProps = {
  avatarUrl: string | null
  fullName: string
}

export function AppSidebar({ avatarUrl, fullName }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="glass-dark relative flex flex-col w-56 shrink-0 border-r-0">
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.07]">
        <Image
          src="/assets/logo-oficial-horizontal.png"
          alt="WeSell CRM"
          width={120}
          height={32}
          className="h-8 w-auto shrink-0"
          priority
        />
        <SidebarUserAvatar avatarUrl={avatarUrl} fullName={fullName} />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-body transition-colors",
                active
                  ? "bg-we-blue/80 text-white shadow-sm backdrop-blur-sm"
                  : "text-we-paper/55 hover:bg-white/[0.07] hover:text-we-paper"
              )}
            >
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/[0.07]">
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-[8px] text-sm font-body text-we-paper/40 hover:bg-white/5 hover:text-we-red transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        </form>
      </div>
    </aside>
  )
}
