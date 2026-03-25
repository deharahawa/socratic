import { Zap } from "lucide-react";

import type { MockUser } from "@/lib/dashboard-mock-data";

type Props = {
  user: MockUser;
};

export function DashboardHeader({ user }: Props) {
  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          Status da forja
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
          Bem-vindo de volta, {user.displayName}
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-4 sm:gap-8">
        <div className="flex flex-col">
          <span className="text-xs text-zinc-500">Saldo XP</span>
          <span className="text-xl font-semibold tabular-nums text-emerald-400">
            {user.total_xp.toLocaleString("pt-BR")}
          </span>
        </div>
        <div className="h-10 w-px bg-white/10 hidden sm:block" aria-hidden />
        <div className="flex flex-col">
          <span className="text-xs text-zinc-500">Créditos de compute</span>
          <span className="flex items-center gap-2 text-xl font-semibold tabular-nums text-zinc-100">
            <Zap
              className="size-5 shrink-0 text-amber-400"
              strokeWidth={2}
              aria-hidden
            />
            {user.compute_credits.toLocaleString("pt-BR")}
          </span>
        </div>
      </div>
    </header>
  );
}
