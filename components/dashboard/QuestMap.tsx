import Link from "next/link";

import type { MockGreenfieldProject } from "@/lib/dashboard-mock-data";

type Props = {
  projects: MockGreenfieldProject[];
};

export function QuestMap({ projects }: Props) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-50">Quest Map</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Projetos{" "}
            <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-xs font-medium text-emerald-400">
              GREENFIELD
            </span>{" "}
            em andamento
          </p>
        </div>
      </div>

      <ul className="mt-6 flex flex-col gap-4">
        {projects.map((p) => {
          const pct =
            p.questsTotal > 0
              ? Math.round((p.questsCompleted / p.questsTotal) * 100)
              : 0;
          return (
            <li
              key={p.id}
              className="rounded-xl border border-white/5 bg-black/20 p-4 transition-colors hover:border-white/10 hover:bg-black/30"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-zinc-100">{p.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                    {p.description}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    XP base:{" "}
                    <span className="font-medium text-emerald-400/90">
                      {p.base_xp.toLocaleString("pt-BR")}
                    </span>
                  </p>
                </div>
                <Link
                  href={`/workspace/${p.id}`}
                  className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-center text-xs font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                >
                  Entrar na Forja
                </Link>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span>
                    Quests{" "}
                    <span className="tabular-nums text-zinc-400">
                      {p.questsCompleted}/{p.questsTotal}
                    </span>
                  </span>
                  <span className="tabular-nums text-zinc-400">{pct}%</span>
                </div>
                <div
                  className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progresso de quests em ${p.title}`}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-cyan-500/90 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
