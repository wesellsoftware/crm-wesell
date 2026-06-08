'use client'

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ArrowLeft, MailCheck } from "lucide-react"
import { useActionState } from "react"
import { forgotPassword } from "@/app/actions/auth"

const gradientBg = { background: "linear-gradient(135deg, #1a1626 0%, #2F2935 45%, #1e1b2e 100%)" }

function Orbs() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #4342F5 0%, transparent 70%)" }} />
      <div className="absolute top-1/2 -right-48 w-[500px] h-[500px] rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, #7845F4 0%, transparent 70%)" }} />
      <div className="absolute -bottom-24 left-1/3 w-[400px] h-[400px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #D7FE65 0%, transparent 70%)" }} />
    </div>
  )
}

export default function RecuperarSenhaPage() {
  const [state, action, pending] = useActionState(forgotPassword, undefined)

  if (state?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden" style={gradientBg}>
        <Orbs />
        <div className="w-full max-w-md text-center space-y-6 glass-light rounded-2xl px-10 py-12 relative z-10">
          <div className="size-16 rounded-full bg-we-lime/20 border border-we-lime/40 flex items-center justify-center mx-auto">
            <MailCheck size={28} className="text-we-ink" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-3xl text-we-ink">Verifique seu e-mail</h2>
            <p className="font-body text-we-ink/55 leading-relaxed">
              Enviamos um link de recuperação. Clique nele para definir uma nova senha.
              <br />
              <span className="text-sm">Não encontrou? Cheque a pasta de spam.</span>
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 font-body text-sm text-we-blue hover:underline font-semibold"
          >
            <ArrowLeft size={14} />
            Voltar ao login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden" style={gradientBg}>
      <Orbs />
      <div className="w-full max-w-md glass-light rounded-2xl px-10 py-10 relative z-10">
        <div className="mb-10">
          <Image src="/assets/logo-oficial-horizontal-preto.png" alt="WeSell CRM" width={120} height={32} className="h-8 w-auto" priority />
        </div>

        <div className="mb-8">
          <h2 className="font-display text-4xl text-we-ink">Recuperar senha</h2>
          <p className="font-body text-we-ink/55 mt-1">
            Informe seu e-mail e enviaremos um link para redefinir sua senha.
          </p>
        </div>

        {state?.error && (
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
            {pending ? "Enviando…" : "Enviar link"}
            {!pending && <ArrowRight size={16} />}
          </button>
        </form>

        <p className="mt-8 text-center text-sm font-body text-we-ink/55">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-we-blue hover:underline font-semibold"
          >
            <ArrowLeft size={14} />
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  )
}
