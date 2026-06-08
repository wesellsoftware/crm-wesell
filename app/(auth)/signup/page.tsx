import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function SignupPage() {
  return (
    <div className="min-h-screen flex">
      {/* Painel de marca */}
      <aside className="hidden lg:flex w-[480px] shrink-0 flex-col justify-between bg-we-blue p-12">
        <div>
          <span className="font-display text-3xl text-white">We</span>
          <span className="font-display text-3xl text-we-lime">Sell</span>
          <span className="font-mono text-sm text-white/40 ml-2 tracking-widest">CRM</span>
        </div>

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
      <main className="flex flex-1 items-center justify-center bg-we-white px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden mb-10">
            <span className="font-display text-3xl text-we-blue">We</span>
            <span className="font-display text-3xl text-we-ink">Sell</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-4xl text-we-ink">Criar conta</h2>
            <p className="font-body text-we-ink/55 mt-1">Configure sua organização WeSell</p>
          </div>

          <form className="space-y-5" action="/signup" method="POST">
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
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Mín. 8 caracteres"
                minLength={8}
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
              className="
                w-full h-11 rounded-[8px]
                bg-we-lime text-we-ink font-body font-semibold
                hover:bg-we-lime/80 active:scale-[0.99]
                flex items-center justify-center gap-2
                transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-we-lime focus:ring-offset-2
              "
            >
              Criar conta
              <ArrowRight size={16} />
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
