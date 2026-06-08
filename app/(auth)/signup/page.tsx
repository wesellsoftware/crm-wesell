'use client'

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { useActionState } from "react"
import { signup } from "@/app/actions/auth"

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, undefined)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const confirm = (form.elements.namedItem('confirm_password') as HTMLInputElement).value
    if (password !== confirm) {
      e.preventDefault()
      setConfirmError('As senhas não coincidem.')
      return
    }
    setConfirmError(null)
  }

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

      {/* Painel de marca */}
      <aside
        className="hidden lg:flex w-[480px] shrink-0 flex-col justify-between p-12 relative z-10"
        style={{
          background: "rgba(67,66,245,0.28)",
          backdropFilter: "blur(24px) saturate(160%)",
          WebkitBackdropFilter: "blur(24px) saturate(160%)",
          borderRight: "1px solid rgba(255,255,255,0.10)"
        }}
      >
        <Image src="/assets/logo-oficial-horizontal.png" alt="WeSell CRM" width={140} height={38} className="h-9 w-auto" priority />

        <div className="space-y-8">
          <h1 className="font-display text-5xl leading-[1.1] text-white">
            Comece<br />agora.
          </h1>
          <p className="font-body text-lg text-white/70 leading-relaxed">
            Configure sua organização em minutos e
            tenha seu funil rodando hoje.
          </p>

          <ul className="space-y-3">
            {[
              "Funil configurável por etapas",
              "Multi-usuário com papéis",
              "Integração nativa com n8n",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 font-body text-white/80">
                <span className="size-5 rounded-full bg-we-lime flex items-center justify-center shrink-0">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#2F2935" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="font-mono text-xs text-white/30">
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
            <h2 className="font-display text-4xl text-we-ink">Criar conta</h2>
            <p className="font-body text-we-ink/55 mt-1">Configure sua organização WeSell</p>
          </div>

          {state?.error && (
            <div className="mb-5 px-4 py-3 rounded-[8px] bg-we-red/10 border border-we-red/20">
              <p className="font-body text-sm text-we-red">{state.error}</p>
            </div>
          )}

          <form className="space-y-5" action={action} onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="block text-sm font-body text-we-ink/75" htmlFor="org_name">
                Nome da organização
              </label>
              <input
                id="org_name"
                name="org_name"
                type="text"
                required
                placeholder="Ex: Empresa Comercial Ltda"
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
              <label className="block text-sm font-body text-we-ink/75" htmlFor="admin_name">
                Seu nome
              </label>
              <input
                id="admin_name"
                name="admin_name"
                type="text"
                required
                placeholder="Nome completo"
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
              <label className="block text-sm font-body text-we-ink/75" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  placeholder="Mín. 8 caracteres"
                  className="
                    w-full h-11 px-4 pr-11 rounded-[8px]
                    border border-we-ink/15 bg-we-paper/40
                    font-body text-we-ink placeholder:text-we-ink/35
                    focus:outline-none focus:ring-2 focus:ring-we-blue focus:border-transparent
                    transition-shadow duration-150
                  "
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-we-ink/35 hover:text-we-ink/70 transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-body text-we-ink/75" htmlFor="confirm_password">
                Confirmar senha
              </label>
              <div className="relative">
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="Repita a senha"
                  className={`
                    w-full h-11 px-4 pr-11 rounded-[8px]
                    border bg-we-paper/40
                    font-body text-we-ink placeholder:text-we-ink/35
                    focus:outline-none focus:ring-2 focus:border-transparent
                    transition-shadow duration-150
                    ${confirmError
                      ? 'border-we-red/50 focus:ring-we-red'
                      : 'border-we-ink/15 focus:ring-we-blue'
                    }
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-we-ink/35 hover:text-we-ink/70 transition-colors"
                  aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmError && (
                <p className="font-body text-xs text-we-red">{confirmError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={pending}
              className="
                w-full h-11 rounded-[8px]
                bg-we-lime text-we-ink font-body font-semibold
                hover:bg-we-lime/80 active:scale-[0.99]
                flex items-center justify-center gap-2
                transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-we-lime focus:ring-offset-2
                disabled:opacity-60 disabled:cursor-not-allowed
              "
            >
              {pending ? "Criando conta…" : "Criar conta"}
              {!pending && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-body text-we-ink/55">
            Já tem conta?{" "}
            <Link href="/login" className="text-we-blue hover:underline font-semibold">
              Entrar
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
