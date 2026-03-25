/**
 * Cores por concept_tag (XP_Log.concept_tag) — heatmap e futuros widgets.
 */
export const CONCEPT_TAG_CELL: Record<
  string,
  { bg: string; shadow: string }
> = {
  Go: {
    bg: "bg-cyan-400/70",
    shadow: "0 2px 6px rgba(34, 211, 238, 0.28)",
  },
  Arquitetura: {
    bg: "bg-purple-500/70",
    shadow: "0 2px 6px rgba(168, 85, 247, 0.28)",
  },
  DB: {
    bg: "bg-emerald-500/70",
    shadow: "0 2px 6px rgba(16, 185, 129, 0.28)",
  },
};

export const DEFAULT_CONCEPT_CELL = {
  bg: "bg-zinc-500/65",
  shadow: "0 2px 6px rgba(161, 161, 170, 0.2)",
};

export function getConceptCellStyles(tag: string) {
  return CONCEPT_TAG_CELL[tag] ?? DEFAULT_CONCEPT_CELL;
}
