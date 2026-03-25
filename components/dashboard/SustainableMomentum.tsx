import { Flame } from "lucide-react";

type Props = {
  consecutiveWorkDays: number;
};

export function SustainableMomentum({ consecutiveWorkDays }: Props) {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-50">
            Sustainable Momentum
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Ritmo saudável de entrega
          </p>
        </div>
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-2.5">
          <Flame
            className="size-5 text-orange-400"
            strokeWidth={2}
            aria-hidden
          />
        </div>
      </div>
      <p className="mt-6 text-4xl font-semibold tabular-nums tracking-tight text-zinc-50">
        {consecutiveWorkDays}
        <span className="ml-2 text-lg font-medium text-zinc-500">
          dias seguidos
        </span>
      </p>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-zinc-400">
        Finais de semana não quebram o momentum. O descanso faz parte da
        engenharia.
      </p>
    </section>
  );
}
