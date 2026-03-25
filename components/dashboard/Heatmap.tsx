"use client";

import { useMemo } from "react";

import type { HeatmapDay } from "@/lib/dashboard-mock-data";
import { formatISODate } from "@/lib/dashboard-mock-data";

import { getConceptCellStyles } from "./concept-tag-styles";

type WeekColumn = (HeatmapDay | null)[];

function buildWeekColumns(days: HeatmapDay[]): WeekColumn[] {
  if (days.length === 0) return [];
  const first = days[0]!.date;
  const lead = first.getDay();
  const cells: (HeatmapDay | null)[] = [...Array(lead).fill(null), ...days];
  const cols: WeekColumn[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    cols.push(cells.slice(i, i + 7) as WeekColumn);
  }
  return cols;
}

const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type Props = {
  days: HeatmapDay[];
};

export function Heatmap({ days }: Props) {
  const columns = useMemo(() => buildWeekColumns(days), [days]);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-50">
            Architect&apos;s Heatmap
          </h2>
          <p className="mt-1 max-w-xl text-sm text-zinc-400">
            Contribuições dos últimos 90 dias por{" "}
            <span className="text-zinc-300">concept_tag</span> (estilo XP_Log).
          </p>
        </div>
        <ul className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500 sm:mt-0">
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-cyan-400/90 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
            Go
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-purple-500/90 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
            Arquitetura
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-emerald-500/90 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            DB
          </li>
        </ul>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        <div
          className="flex flex-col justify-between py-0.5 text-[10px] text-zinc-600"
          aria-hidden
        >
          {weekdayLabels.map((d) => (
            <span key={d} className="h-3 leading-3">
              {d}
            </span>
          ))}
        </div>
        <div className="flex min-w-0 gap-1">
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-1">
              {col.map((cell, ri) => {
                if (!cell) {
                  return (
                    <span
                      key={`e-${ci}-${ri}`}
                      className="size-3 shrink-0 rounded-sm bg-transparent"
                    />
                  );
                }
                const iso = formatISODate(cell.date);
                const active = cell.concept_tag !== null;
                const tag = cell.concept_tag;
                const styles =
                  active && tag ? getConceptCellStyles(tag) : null;
                return (
                  <span
                    key={iso}
                    title={
                      active && tag
                        ? `${iso} · ${tag}`
                        : `${iso} · sem atividade`
                    }
                    className={[
                      "size-3 shrink-0 rounded-sm border border-white/5 transition-transform hover:scale-125 hover:z-10",
                      active && styles
                        ? styles.bg
                        : "bg-white/[0.06] hover:bg-white/[0.1]",
                    ].join(" ")}
                    style={
                      active && styles
                        ? { boxShadow: styles.shadow }
                        : undefined
                    }
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
