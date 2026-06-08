"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Kanban,
  Users,
  CheckSquare,
  Settings,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/funil", label: "{Funil}", icon: Kanban },
  { href: "/contatos", label: "Contatos", icon: Users },
  { href: "/atividades", label: "Atividades", icon: CheckSquare },
  { href: "/configuracoes", label: "Config.", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col w-56 shrink-0 bg-we-ink border-r border-white/5">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/5">
        <span className="font-display text-xl text-we-white">We</span>
        <span className="font-display text-xl text-we-lime">Sell</span>
        <span className="font-mono text-[10px] text-we-paper/30 ml-1.5 tracking-widest">CRM</span>
      </div>

      {/* Nav */}
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
                  ? "bg-we-blue text-white"
                  : "text-we-paper/60 hover:bg-white/5 hover:text-we-paper"
              )}
            >
              <Icon size={16} />
              <span className={cn(label.startsWith("{") && "font-mono text-xs")}>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/5">
        <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-[8px] text-sm font-body text-we-paper/40 hover:bg-white/5 hover:text-we-red transition-colors">
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )
}
