"use client";

import { Code, Lightbulb, ShieldCheck, Trophy } from "lucide-react";
import {
  QUEST_PHASE_ORDER,
  QUEST_PHASE_THEMES,
  type QuestPhase,
  getQuestPhaseIndex,
} from "@/lib/quest-phase";

const STEP_META: Record<
  QuestPhase,
  { label: string; Icon: typeof Lightbulb }
> = {
  DISCOVERY: { label: "Discovery", Icon: Lightbulb },
  HANDS_ON: { label: "Hands-on", Icon: Code },
  VALIDATION: { label: "Validação", Icon: ShieldCheck },
  DONE: { label: "Concluído", Icon: Trophy },
};

type QuestStepperProps = {
  currentPhase: QuestPhase;
};

export function QuestStepper({ currentPhase }: QuestStepperProps) {
  const activeIndex = getQuestPhaseIndex(currentPhase);

  return (
    <nav
      className="shrink-0 border-b border-zinc-800/80 bg-[#070707] px-4 py-3"
      aria-label="Progresso da quest"
    >
      <ol className="mx-auto flex max-w-3xl items-center justify-between gap-2 sm:gap-4">
        {QUEST_PHASE_ORDER.map((phase, index) => {
          const { label, Icon } = STEP_META[phase];
          const theme = QUEST_PHASE_THEMES[phase];
          const isActive = index === activeIndex;
          const isFuture = index > activeIndex;
          const isDone = index < activeIndex;

          return (
            <li
              key={phase}
              className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
            >
              <span
                className={[
                  "flex size-10 shrink-0 items-center justify-center rounded-full border border-zinc-700/80 bg-zinc-900/80 transition-all duration-300",
                  isActive ? theme.stepActiveRing : "",
                  isFuture ? "opacity-60" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-current={isActive ? "step" : undefined}
              >
                <Icon
                  className={[
                    "size-5 shrink-0",
                    isFuture && "text-gray-600",
                    isActive && theme.stepActiveIcon,
                    isDone && theme.stepDoneIcon,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  strokeWidth={isActive ? 2.25 : 1.75}
                />
              </span>
              <span
                className={[
                  "max-w-[5.5rem] truncate text-center text-[10px] font-semibold uppercase tracking-wider sm:max-w-none sm:text-xs",
                  isFuture && "text-gray-600",
                  isActive && theme.stepActiveLabel,
                  isDone && theme.stepDoneLabel,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
