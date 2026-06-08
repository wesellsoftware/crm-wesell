'use client'

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, MailWarning } from "lucide-react"
import { useActionState } from "react"
import { login, resendVerification } from "@/app/actions/auth"

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)
  const [resendState, resendAction, resendPending] = useActionState(resendVerification, undefined)

  return (
    <div
      className="min-h-screen flex relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1a1626 0%, #2F2935 45%, #1e1b2e 100%)" }}
    >
      {/* Orbs decorativos */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #4342F5 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 -right-48 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #7845F4 0%, transparent 70%)" }} />
        <div className="absolute -bottom-24 left-1/3 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #D7FE65 0%, transparent 70%)" }} />
      </div>

      {/* Painel de marca — visível só em telas largas */}
      <aside
        className="hidden lg:flex w-[480px] shrink-0 flex-col justify-between glass-dark p-12 relative z-10"
        style={{ background: "rgba(26,22,38,0.70)", borderRight: "1px solid rgba(255,255,255,0.08)" }}
      >
        <Image src="/assets/logo-oficial-horizontal.png" alt="WeSell CRM" width={140} height={38} className="h-9 w-auto" priority />

        <div className="space-y-8">
          <h1 className="font-display text-5xl leading-[1.1] text-we-white">
            Feche mais,<br />mais rápido.
          </h1>
          <p className="font-body text-lg text-we-paper/60 leading-relaxed">
            Gerencie seu funil, contatos e propostas
            em um só lugar — do jeito WeSell.
          </p>

          <div className="flex flex-wrap gap-2">
            {["{Funil}", "{Contatos}", "{Relatórios}"].map((tag) => (
              <span
                key={tag}
                className="font-mono text-xs text-we-lime border border-we-lime/30 rounded-full px-3 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <p className="font-mono text-xs text-we-paper/30">
          © {new Date().getFullYear()} WeSell. Todos os direitos reservados.
        </p>
      </aside>

      {/* Painel do formulário */}
      <main className="flex flex-1 items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md glass-light rounded-2xl px-10 py-10">
          {/* Logo mobile */}
          <div className="lg:hidden mb-10">
            <Image src="/assets/logo-oficial-horizontal-preto.png" alt="WeSell CRM" width={130} height={35} className="h-8 w-auto" priority />
          </div>

          <div className="mb-8">
            <h2 className="font-display text-4xl text-we-ink">Entrar</h2>
            <p className="font-body text-we-ink/55 mt-1">Acesse sua conta WeSell</p>
          </div>

          {state?.type === 'unverified' && (
            <div className="mb-5 px-4 py-3 rounded-[8px] bg-we-yellow/15 border border-we-yellow/40 space-y-2">
              <div className="flex items-start gap-2">
                <MailWarning size={16} className="text-we-ink/70 mt-0.5 shrink-0" />
                <p className="font-body text-sm text-we-ink/80">{state.error}</p>
              </div>
              {resendState?.sent ? (
                <p className="font-body text-xs text-we-ink/55 pl-6">E-mail reenviado!</p>
              ) : (
                <form action={resendAction} className="pl-6">
                  <input type="hidden" name="email" value={state.email} />
                  <button
                    type="submit"
                    disabled={resendPending}
                    className="font-body text-xs text-we-blue hover:underline disabled:opacity-50"
                  >
                    {resendPending ? "Enviando…" : "Reenviar e-mail de confirmação"}
                  </button>
                </form>
              )}
            </div>
          )}

          {state?.type === 'credentials' && (
            <div className="mb-5 px-4 py-3 rounded-[8px] bg-we-red/10 border border-we-red/20">
              <p className="font-body text-sm text-we-red">{state.error}</p>
            </div>
          )}

          <form className="space-y-5" action={action}>
            <div className="space-y-1.5">
              <label className="block text-sm font-body text-we-ink/75" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="seu@email.com"
                className="
                  w-full h-11 px-4 rounded-[8px]
                  border border-we-ink/15 bg-we-paper/40
                  font-body text-we-ink placeholder:text-we-ink/35
                  focus:outline-none focus:ring-2 focus:ring-we-blue focus:border-transparent
                  transition-shadow duration-150
                "
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-body text-we-ink/75" htmlFor="password">
                  Senha
                </label>
                <Link href="/recuperar-senha" className="text-xs font-body text-we-blue hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="
                  w-full h-11 px-4 rounded-[8px]
                  border border-we-ink/15 bg-we-paper/40
                  font-body text-we-ink placeholder:text-we-ink/35
                  focus:outline-none focus:ring-2 focus:ring-we-blue focus:border-transparent
                  transition-shadow duration-150
                "
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="
                w-full h-11 rounded-[8px]
                bg-we-blue text-white font-body font-semibold
                hover:bg-we-blue-deep active:scale-[0.99]
                flex items-center justify-center gap-2
                transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-we-blue focus:ring-offset-2
                disabled:opacity-60 disabled:cursor-not-allowed
              "
            >
              {pending ? "Entrando…" : "Entrar"}
              {!pending && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-body text-we-ink/55">
            Novo por aqui?{" "}
            <Link href="/signup" className="text-we-blue hover:underline font-semibold">
              Criar conta
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
