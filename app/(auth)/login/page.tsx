import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Painel de marca — visível só em telas largas */}
      <aside className="hidden lg:flex w-[480px] shrink-0 flex-col justify-between bg-we-ink p-12">
        <div>
          <span className="font-display text-3xl text-we-white">We</span>
          <span className="font-display text-3xl text-we-lime">Sell</span>
          <span className="font-mono text-sm text-we-paper/40 ml-2 tracking-widest">CRM</span>
        </div>

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
      <main className="flex flex-1 items-center justify-center bg-we-white px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden mb-10">
            <span className="font-display text-3xl text-we-blue">We</span>
            <span className="font-display text-3xl text-we-ink">Sell</span>
            <span className="font-mono text-sm text-we-ink/40 ml-2 tracking-widest">CRM</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-4xl text-we-ink">Entrar</h2>
            <p className="font-body text-we-ink/55 mt-1">Acesse sua conta WeSell</p>
          </div>

          <form className="space-y-5" action="/login" method="POST">
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
                <a href="#" className="text-xs font-body text-we-blue hover:underline">
                  Esqueceu a senha?
                </a>
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
              className="
                w-full h-11 rounded-[8px]
                bg-we-blue text-white font-body font-semibold
                hover:bg-we-blue-deep active:scale-[0.99]
                flex items-center justify-center gap-2
                transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-we-blue focus:ring-offset-2
              "
            >
              Entrar
              <ArrowRight size={16} />
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
