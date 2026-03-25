import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] bg-forge-radial text-zinc-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <header className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Socratic Forge
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
            Escolha como quer evoluir hoje
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400">
            A plataforma combina trilha de arquitetura, execução prática e
            resposta a incidentes. Você pode alternar entre os modos conforme o
            objetivo da sessão.
          </p>
        </header>

        <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.06] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/90">
              Modo Arquiteto AI
            </p>
            <h2 className="mt-2 text-lg font-semibold text-zinc-50">
              Planejar e acompanhar progresso
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300/90">
              Veja seu heatmap, momentum e evolução por projeto no dashboard.
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-cyan-400/35 bg-black/30 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/45 hover:bg-cyan-950/25"
            >
              Entrar no Dashboard
            </Link>
          </article>

          <article className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
              Modo Raiz
            </p>
            <h2 className="mt-2 text-lg font-semibold text-zinc-50">
              Fullstack manual no seu ritmo
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300/90">
              Rode banco/API/UI localmente no WSL e implemente com controle total
              do fluxo.
            </p>
            <Link
              href="/setup"
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-emerald-400/35 bg-black/30 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300/45 hover:bg-emerald-950/25"
            >
              Abrir guia do Modo Raiz
            </Link>
          </article>

          <article className="rounded-2xl border border-red-500/25 bg-red-500/[0.06] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-red-300/90">
              Modo Chaos / NOC
            </p>
            <h2 className="mt-2 text-lg font-semibold text-zinc-50">
              Investigar incidentes em produção
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300/90">
              Abra o workspace NOC para analisar ticket, logs e hipóteses de
              causa raiz.
            </p>
            <Link
              href="/incident/sev2-local"
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-red-400/35 bg-black/30 px-4 py-3 text-sm font-semibold text-red-100 transition hover:border-red-300/45 hover:bg-red-950/25"
            >
              Abrir NOC Workspace
            </Link>
          </article>
        </section>
      </div>
    </main>
  );
}
