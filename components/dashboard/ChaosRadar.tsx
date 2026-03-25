import { Radar } from "lucide-react";

export function ChaosRadar() {
  return (
    <section className="flex h-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur-md">
      <div
        className="rounded-2xl border border-red-500/15 bg-red-500/[0.07] p-4"
        aria-hidden
      >
        <Radar
          className="size-10 text-red-400/80 animate-[spin_14s_linear_infinite]"
          strokeWidth={1.5}
        />
      </div>
      <h2 className="mt-4 text-sm font-semibold text-zinc-400">
        The Chaos Radar
      </h2>
      <p className="mt-2 max-w-[16rem] text-xs leading-relaxed text-zinc-500">
        Nenhum incidente em produção detectado. Sistemas nominais.
      </p>
    </section>
  );
}
