import Link from "next/link";
import { AppBreadcrumb } from "@/components/navigation/AppBreadcrumb";

const steps = [
  {
    title: "1) Subir Postgres com Podman",
    command: "podman-compose up -d",
    note: "Use na raiz do projeto para iniciar o banco local.",
  },
  {
    title: "2) Criar arquivo de ambiente",
    command: "cp .env.example .env",
    note: "Garante que o Prisma encontre DATABASE_URL.",
  },
  {
    title: "3) Instalar dependências",
    command: "npm install",
    note: "Gera cliente Prisma automaticamente no postinstall.",
  },
  {
    title: "4) Criar/aplicar migration local",
    command: "npx prisma migrate dev --name init",
    note: "Cria tabelas no Postgres local.",
  },
  {
    title: "5) Rodar aplicação",
    command: "npm run dev",
    note: "Depois acesse http://localhost:3000.",
  },
];

export default function SetupPage() {
  return (
    <main className="min-h-screen bg-[#050505] bg-forge-radial text-zinc-100">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <header className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <AppBreadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Modo Raiz" },
              { label: "Setup" },
            ]}
          />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/85">
            Modo Raiz
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
            Setup fullstack local no WSL
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Este fluxo sobe o banco com Podman e executa a aplicação inteira no
            seu ambiente local, sem dependências externas.
          </p>
        </header>

        <section className="mt-6 space-y-4">
          {steps.map((step) => (
            <article
              key={step.title}
              className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5"
            >
              <h2 className="text-sm font-semibold tracking-tight text-zinc-100">
                {step.title}
              </h2>
              <p className="mt-2 rounded-lg border border-emerald-500/25 bg-black/30 px-3 py-2 font-mono text-xs text-emerald-100/95">
                {step.command}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                {step.note}
              </p>
            </article>
          ))}
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/root/workspace"
            className="inline-flex items-center justify-center rounded-xl border border-emerald-400/45 bg-emerald-500/[0.12] px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300/60 hover:bg-emerald-500/[0.2]"
          >
            Avancar para Workspace Raiz
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-cyan-400/35 bg-cyan-500/[0.08] px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/45"
          >
            Ir para Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-white/25 hover:text-zinc-100"
          >
            Voltar para Home
          </Link>
        </div>
      </div>
    </main>
  );
}

