"use client";

import Link from "next/link";
import { Radar, Siren } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type RadarIncident = {
  id: string;
  title: string;
  severity: "SEV-1" | "SEV-2" | "SEV-3";
};

type ChaosRadarProps = {
  incidents: RadarIncident[];
};

export function ChaosRadar({ incidents }: ChaosRadarProps) {
  const router = useRouter();
  const [spawning, setSpawning] = useState(false);
  const prevCountRef = useRef<number>(incidents.length);

  const pendingLabel = useMemo(() => {
    if (incidents.length === 0) return "Nenhum incidente pendente.";
    if (incidents.length === 1) return "1 incidente aguardando triagem.";
    return `${incidents.length} incidentes aguardando triagem.`;
  }, [incidents.length]);

  useEffect(() => {
    const id = window.setInterval(() => {
      router.refresh();
    }, 10_000);
    return () => window.clearInterval(id);
  }, [router]);

  useEffect(() => {
    if (spawning && incidents.length > prevCountRef.current) {
      setSpawning(false);
    }
    prevCountRef.current = incidents.length;
  }, [incidents.length, spawning]);

  return (
    <section className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <div
        className="flex items-center gap-3 rounded-2xl border border-red-500/15 bg-red-500/[0.07] p-4"
        aria-hidden
      >
        <Radar
          className="size-10 text-red-400/80 animate-[spin_14s_linear_infinite]"
          strokeWidth={1.5}
        />
        <div className="min-w-0 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-red-200/80">
            Chaos Radar
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-zinc-200">
            Incidentes pendentes
          </p>
          <p className="mt-1 text-xs text-zinc-500">{pendingLabel}</p>
        </div>
      </div>

      <div className="mt-4 min-h-0 flex-1">
        {incidents.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-center">
            <p className="text-xs leading-relaxed text-zinc-500">
              Nenhum incidente em produção detectado. Sistemas nominais.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {incidents.map((inc) => (
              <li
                key={inc.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-red-300/85">
                    {inc.severity}
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-zinc-200">
                    {inc.title}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-zinc-600">
                    incident / {inc.id}
                  </p>
                </div>

                <Link
                  href={`/incident/${encodeURIComponent(inc.id)}`}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-red-900/50 bg-[#0b0b0b] px-3 py-2 text-xs font-semibold text-red-300 transition hover:border-red-700/60 hover:bg-red-950/25 hover:text-red-200"
                  aria-label={`Investigar incidente ${inc.id}`}
                >
                  <Siren className="size-4 text-red-400/90" aria-hidden />
                  Investigar
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        disabled={spawning}
        onClick={async () => {
          if (spawning) return;
          setSpawning(true);
          try {
            await fetch("/api/chaos/spawn", { method: "POST" });
          } finally {
            router.refresh();
          }
        }}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-zinc-300 transition hover:border-white/15 hover:bg-white/10 hover:text-zinc-100"
      >
        {spawning ? "Processando no Background..." : "Simular Anomalia"}
      </button>
    </section>
  );
}
