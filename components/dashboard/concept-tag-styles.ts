/**
 * Cores por concept_tag (XP_Log.concept_tag) — heatmap e futuros widgets.
 */
export const CONCEPT_TAG_CELL: Record<
  string,
  { bg: string; shadow: string }
> = {
  Go: {
    bg: "bg-cyan-400/90",
    shadow: "0 0 10px rgba(34, 211, 238, 0.75), 0 0 4px rgba(34, 211, 238, 0.9)",
  },
  Arquitetura: {
    bg: "bg-purple-500/90",
    shadow: "0 0 10px rgba(168, 85, 247, 0.75), 0 0 4px rgba(168, 85, 247, 0.9)",
  },
  DB: {
    bg: "bg-emerald-500/90",
    shadow: "0 0 10px rgba(16, 185, 129, 0.75), 0 0 4px rgba(16, 185, 129, 0.9)",
  },
};

export const DEFAULT_CONCEPT_CELL = {
  bg: "bg-zinc-500/80",
  shadow: "0 0 8px rgba(161, 161, 170, 0.5)",
};

export function getConceptCellStyles(tag: string) {
  return CONCEPT_TAG_CELL[tag] ?? DEFAULT_CONCEPT_CELL;
}
