export type QuestPhase = "DISCOVERY" | "HANDS_ON" | "VALIDATION" | "DONE";

export const QUEST_PHASE_ORDER: QuestPhase[] = [
  "DISCOVERY",
  "HANDS_ON",
  "VALIDATION",
  "DONE",
];

/** Classes Tailwind por fase — borda do chat, cabeçalho Mentor, bolhas da IA, stepper. */
export type QuestPhaseTheme = {
  chatBorder: string;
  mentorStrip: string;
  assistantBorder: string;
  assistantBg: string;
  stepActiveRing: string;
  stepActiveIcon: string;
  stepActiveLabel: string;
  stepDoneIcon: string;
  stepDoneLabel: string;
};

export const QUEST_PHASE_THEMES: Record<QuestPhase, QuestPhaseTheme> = {
  DISCOVERY: {
    chatBorder: "border-purple-500/50",
    mentorStrip:
      "border-b border-purple-500/30 bg-purple-950/20 text-purple-200/90",
    assistantBorder: "border-l-2 border-purple-500/70",
    assistantBg: "bg-purple-950/20",
    stepActiveRing: "ring-2 ring-purple-500/60 shadow-[0_0_24px_-4px_rgba(168,85,247,0.55)]",
    stepActiveIcon: "text-purple-400",
    stepActiveLabel: "text-purple-300",
    stepDoneIcon: "text-purple-500/70",
    stepDoneLabel: "text-zinc-400",
  },
  HANDS_ON: {
    chatBorder: "border-blue-500/50",
    mentorStrip:
      "border-b border-blue-500/30 bg-blue-950/20 text-blue-200/90",
    assistantBorder: "border-l-2 border-blue-500/70",
    assistantBg: "bg-blue-950/20",
    stepActiveRing: "ring-2 ring-blue-500/60 shadow-[0_0_24px_-4px_rgba(59,130,246,0.55)]",
    stepActiveIcon: "text-blue-400",
    stepActiveLabel: "text-blue-300",
    stepDoneIcon: "text-blue-500/70",
    stepDoneLabel: "text-zinc-400",
  },
  VALIDATION: {
    chatBorder: "border-amber-500/50",
    mentorStrip:
      "border-b border-amber-500/30 bg-amber-950/20 text-amber-200/90",
    assistantBorder: "border-l-2 border-amber-500/70",
    assistantBg: "bg-amber-950/20",
    stepActiveRing: "ring-2 ring-amber-500/60 shadow-[0_0_24px_-4px_rgba(245,158,11,0.5)]",
    stepActiveIcon: "text-amber-400",
    stepActiveLabel: "text-amber-300",
    stepDoneIcon: "text-amber-500/70",
    stepDoneLabel: "text-zinc-400",
  },
  DONE: {
    chatBorder: "border-emerald-500/50",
    mentorStrip:
      "border-b border-emerald-500/30 bg-emerald-950/20 text-emerald-200/90",
    assistantBorder: "border-l-2 border-emerald-500/70",
    assistantBg: "bg-emerald-950/20",
    stepActiveRing: "ring-2 ring-emerald-500/60 shadow-[0_0_24px_-4px_rgba(16,185,129,0.5)]",
    stepActiveIcon: "text-emerald-400",
    stepActiveLabel: "text-emerald-300",
    stepDoneIcon: "text-emerald-500/70",
    stepDoneLabel: "text-zinc-400",
  },
};

export function getQuestPhaseIndex(phase: QuestPhase): number {
  return QUEST_PHASE_ORDER.indexOf(phase);
}

export function getNextQuestPhase(phase: QuestPhase): QuestPhase | null {
  const i = getQuestPhaseIndex(phase);
  if (i < 0 || i >= QUEST_PHASE_ORDER.length - 1) return null;
  return QUEST_PHASE_ORDER[i + 1]!;
}
