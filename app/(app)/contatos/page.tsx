import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { NewContactDialog } from '@/components/contatos/new-contact-dialog'
import { User, Building2 } from 'lucide-react'

export default async function ContatosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('contacts')
    .select('id, name, email, phone, company, created_at')
    .order('name')

  if (q) {
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,company.ilike.%${q}%`)
  }

  const { data: contacts } = await query

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-we-paper">Contatos</h1>
          <p className="font-body text-we-paper/45 text-sm mt-0.5">
            {contacts?.length ?? 0} contato{(contacts?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <NewContactDialog />
      </div>

      {/* Search */}
      <form method="GET" className="relative max-w-sm">
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Buscar por nome, e-mail ou empresa…"
          className="
            w-full h-10 pl-4 pr-10 rounded-[8px]
            glass-input text-we-paper/80 placeholder:text-we-paper/30
            font-body text-sm
            focus:outline-none focus:ring-2 focus:ring-we-blue/50
          "
        />
      </form>

      {/* List */}
      {!contacts?.length ? (
        <div className="glass rounded-xl p-16 flex flex-col items-center gap-3 text-center">
          <div className="size-12 rounded-full bg-white/[0.06] flex items-center justify-center">
            <User size={20} className="text-we-paper/30" />
          </div>
          <p className="font-body text-we-paper/50">
            {q ? 'Nenhum contato encontrado.' : 'Nenhum contato cadastrado ainda.'}
          </p>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="px-5 py-3 text-left font-body text-xs text-we-paper/40 font-normal">Nome</th>
                <th className="px-5 py-3 text-left font-body text-xs text-we-paper/40 font-normal hidden md:table-cell">Empresa</th>
                <th className="px-5 py-3 text-left font-body text-xs text-we-paper/40 font-normal hidden lg:table-cell">E-mail</th>
                <th className="px-5 py-3 text-left font-body text-xs text-we-paper/40 font-normal hidden lg:table-cell">Telefone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {contacts.map(c => (
                <tr key={c.id} className="hover:bg-white/[0.03] transition-colors group">
                  <td className="px-5 py-3.5">
                    <Link href={`/contatos/${c.id}`} className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-we-blue/20 flex items-center justify-center shrink-0">
                        <span className="font-body text-xs text-we-blue font-semibold">
                          {c.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-body text-sm text-we-paper/85 group-hover:text-we-paper transition-colors">
                        {c.name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      {c.company && <Building2 size={12} className="text-we-paper/30 shrink-0" />}
                      <span className="font-body text-sm text-we-paper/55">{c.company ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <span className="font-mono text-xs text-we-paper/50">{c.email ?? '—'}</span>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <span className="font-mono text-xs text-we-paper/50">{c.phone ?? '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
