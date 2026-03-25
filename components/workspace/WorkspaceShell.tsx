"use client";

import { Group, Panel, Separator } from "react-resizable-panels";
import { useCallback, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { MessageBubble } from "@/components/workspace/MessageBubble";
import { QuestStepper } from "@/components/workspace/QuestStepper";
import { WorkspaceChatInput } from "@/components/workspace/WorkspaceChatInput";
import {
  workspaceInitialMessagesMock,
  workspaceQuestMock,
  type WorkspaceMockMessage,
} from "@/lib/workspace-mock-data";
import {
  QUEST_PHASE_THEMES,
  type QuestPhase,
  getNextQuestPhase,
} from "@/lib/quest-phase";
import { isReviewVerdict, type ReviewVerdict } from "@/lib/review-verdict";

type WorkspaceShellProps = {
  projectId: string;
};

function advanceButtonLabel(phase: QuestPhase): string {
  switch (phase) {
    case "DISCOVERY":
      return "Avançar para Hands-on";
    case "HANDS_ON":
      return "Avançar para Validação";
    case "VALIDATION":
      return "Avançar para Conclusão";
    default:
      return "Quest concluída";
  }
}

export function WorkspaceShell({ projectId }: WorkspaceShellProps) {
  const [currentPhase, setCurrentPhase] = useState<QuestPhase>("DISCOVERY");
  const [messages, setMessages] = useState<WorkspaceMockMessage[]>(
    workspaceInitialMessagesMock,
  );
  const [draft, setDraft] = useState("");
  const [hatNoticeVisible, setHatNoticeVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationCode, setValidationCode] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState<ReviewVerdict | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const theme = QUEST_PHASE_THEMES[currentPhase];

  const handlePhaseChange = useCallback((newPhase: QuestPhase) => {
    if (newPhase === currentPhase) return;
    setCurrentPhase(newPhase);
    setMessages([]);
    setHatNoticeVisible(true);
    setReviewResult(null);
    setReviewError(null);
    setReviewLoading(false);
    if (newPhase === "VALIDATION") {
      setValidationCode("");
    }
  }, [currentPhase]);

  useEffect(() => {
    if (!hatNoticeVisible) return;
    const id = window.setTimeout(() => setHatNoticeVisible(false), 4200);
    return () => window.clearTimeout(id);
  }, [hatNoticeVisible]);

  const handleSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || isLoading) return;

    const userMsg: WorkspaceMockMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };

    let apiMessages: { role: string; content: string }[] = [];
    setMessages((prev) => {
      const next = [...prev, userMsg];
      apiMessages = next.map(({ role, content }) => ({ role, content }));
      return next;
    });
    setDraft("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          phase: currentPhase,
          context: workspaceQuestMock,
        }),
      });

      let data: { content?: unknown; error?: unknown } = {};
      try {
        data = (await res.json()) as typeof data;
      } catch {
        data = {};
      }

      if (!res.ok) {
        const errText =
          typeof data.error === "string"
            ? data.error
            : `Erro ao contatar o mentor (${res.status}).`;
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: "assistant",
            content: errText,
            isError: true,
          },
        ]);
        return;
      }

      const reply =
        typeof data.content === "string" ? data.content : "";
      if (!reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: "assistant",
            content: "Resposta vazia do servidor.",
            isError: true,
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          phase: currentPhase,
          content: reply,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content:
            "Não foi possível conectar ao servidor. Verifique sua rede e tente de novo.",
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [draft, currentPhase, isLoading]);

  const handleReviewSubmit = useCallback(async () => {
    const submission = validationCode.trim();
    if (!submission || reviewLoading) return;

    setReviewError(null);
    setReviewResult(null);
    setReviewLoading(true);

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission,
          dod: [...workspaceQuestMock.definition_of_done],
        }),
      });

      let data: unknown;
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        const msg =
          data &&
          typeof data === "object" &&
          typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : `Erro na revisão (${res.status}). Tente novamente.`;
        setReviewError(msg);
        return;
      }

      if (!isReviewVerdict(data)) {
        setReviewError(
          "Resposta inválida do servidor. Tente submeter novamente.",
        );
        return;
      }

      setReviewResult(data);
    } catch {
      setReviewError(
        "Não foi possível conectar ao servidor. Verifique sua rede e tente de novo.",
      );
    } finally {
      setReviewLoading(false);
    }
  }, [validationCode, reviewLoading]);

  const nextPhase = getNextQuestPhase(currentPhase);
  const canAdvance =
    nextPhase !== null &&
    (currentPhase !== "VALIDATION" || reviewResult?.isApproved === true);

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[#050505] text-zinc-100">
      <header className="shrink-0 border-b border-zinc-800/80 bg-[#080808] px-4 py-3">
        <h1 className="text-sm font-semibold tracking-tight text-zinc-100">
          Workspace
        </h1>
        <p className="mt-0.5 font-mono text-xs text-zinc-500">
          project / {projectId}
        </p>
      </header>

      <QuestStepper currentPhase={currentPhase} />

      <Group orientation="horizontal" className="min-h-0 flex-1">
        <Panel id="context" defaultSize={40} minSize={22} className="min-w-0">
          <aside className="scrollbar-dark flex h-full flex-col overflow-y-auto border-r border-zinc-800/80 bg-[#060606] px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Quest — contexto
            </p>
            <h2 className="mt-2 text-base font-semibold text-zinc-100">
              {workspaceQuestMock.title}
            </h2>
            <section className="mt-5">
              <h3 className="text-xs font-medium uppercase tracking-wide text-forge-discovery">
                Big picture
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {workspaceQuestMock.big_picture}
              </p>
            </section>
            <section className="mt-6">
              <h3 className="text-xs font-medium uppercase tracking-wide text-forge-handsOn">
                Architect mindset
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {workspaceQuestMock.architect_mindset}
              </p>
            </section>

            <div className="mt-8 border-t border-zinc-800/80 pt-6">
              <button
                type="button"
                disabled={!canAdvance}
                onClick={() => {
                  if (nextPhase) handlePhaseChange(nextPhase);
                }}
                className="w-full rounded-lg border border-zinc-600/80 bg-zinc-900/80 px-3 py-2.5 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800/80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {advanceButtonLabel(currentPhase)}
              </button>
            </div>
          </aside>
        </Panel>

        <Separator className="relative w-1.5 shrink-0 bg-zinc-900 transition-colors hover:bg-zinc-600">
          <span className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-zinc-700" />
        </Separator>

        <Panel id="chat" defaultSize={60} minSize={28} className="min-w-0">
          <div
            className={`flex h-full min-h-0 flex-col border-2 bg-[#050505] ${theme.chatBorder}`}
          >
            <div
              className={`shrink-0 px-4 py-2 transition-colors duration-300 ${theme.mentorStrip}`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                Mentor
              </p>
            </div>
            <div className="scrollbar-dark min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  role={m.role}
                  content={m.content}
                  questPhase={currentPhase}
                  isError={m.isError}
                />
              ))}
            </div>
            {currentPhase === "VALIDATION" ? (
              <div className="border-t border-zinc-800/90 bg-[#080808] px-3 py-3">
                {reviewLoading ? (
                  <p
                    className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-200/95"
                    role="status"
                    aria-live="polite"
                  >
                    <Loader2
                      className="size-4 shrink-0 animate-spin text-amber-400"
                      aria-hidden
                    />
                    O QA está analisando a sua submissão…
                  </p>
                ) : null}

                {reviewError ? (
                  <div
                    className="mb-3 rounded-lg border border-red-500/55 bg-red-950/45 px-3 py-2.5 text-sm text-red-100 shadow-[0_0_20px_-8px_rgba(239,68,68,0.5)]"
                    role="alert"
                  >
                    {reviewError}
                  </div>
                ) : null}

                {reviewResult?.isApproved ? (
                  <div
                    className="mb-3 rounded-lg border border-emerald-500/70 bg-emerald-950/55 px-4 py-3 text-emerald-50 shadow-[0_0_28px_-10px_rgba(16,185,129,0.55)]"
                    role="status"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300/90">
                      Aprovado pelo QA
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-emerald-100">
                      {reviewResult.feedback}
                    </p>
                    {nextPhase ? (
                      <button
                        type="button"
                        onClick={() => handlePhaseChange(nextPhase)}
                        className="mt-4 w-full rounded-lg border border-emerald-400/60 bg-emerald-600/90 px-3 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-500"
                      >
                        Finalizar Quest (Receber XP)
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {reviewResult && !reviewResult.isApproved ? (
                  <div
                    className="mb-3 rounded-lg border border-red-500/65 bg-red-950/50 px-4 py-3 text-red-50 shadow-[0_0_28px_-10px_rgba(239,68,68,0.45)]"
                    role="alert"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-red-300/90">
                      Reprovado pelo QA
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-red-100">
                      {reviewResult.feedback}
                    </p>
                    {reviewResult.failedRequirements.length > 0 ? (
                      <ul className="mt-3 space-y-2 border-t border-red-500/25 pt-3">
                        {reviewResult.failedRequirements.map((req, i) => (
                          <li
                            key={`${i}-${req}`}
                            className="flex gap-2 text-sm text-red-100/95"
                          >
                            <X
                              className="mt-0.5 size-4 shrink-0 text-red-400"
                              strokeWidth={2.5}
                              aria-hidden
                            />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handlePhaseChange("HANDS_ON")}
                      className="mt-4 w-full rounded-lg border border-zinc-600 bg-zinc-800/90 px-3 py-2.5 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-700/90"
                    >
                      Voltar para Hands-on
                    </button>
                  </div>
                ) : null}

                {!reviewResult?.isApproved ? (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                        Código final para revisão
                      </span>
                      <textarea
                        value={validationCode}
                        onChange={(e) => setValidationCode(e.target.value)}
                        disabled={reviewLoading}
                        rows={10}
                        placeholder="Cole aqui a versão final do código que deseja submeter ao QA…"
                        className="scrollbar-dark mt-1.5 w-full resize-y rounded-md border border-zinc-800 bg-[#0c0c0c] px-3 py-2 font-mono text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus:border-amber-600/70 focus:outline-none focus:ring-1 focus:ring-amber-600/50 disabled:opacity-50"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={
                        reviewLoading || !validationCode.trim()
                      }
                      onClick={() => {
                        void handleReviewSubmit();
                      }}
                      className="w-full rounded-lg border border-amber-500/70 bg-gradient-to-b from-amber-500 to-amber-600 px-4 py-3 text-sm font-bold tracking-tight text-amber-950 shadow-[0_0_24px_-6px_rgba(245,158,11,0.55)] transition hover:from-amber-400 hover:to-amber-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                    >
                      Submeter Código para Revisão (QA)
                    </button>
                    <p className="text-[11px] text-zinc-600">
                      A avaliação usa o LMStudio local (JSON estrito). Em caso de
                      falha de parse, tente submeter novamente.
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <WorkspaceChatInput
                value={draft}
                onChange={setDraft}
                onSend={() => {
                  void handleSend();
                }}
                isLoading={isLoading}
              />
            )}
          </div>
        </Panel>
      </Group>

      <div
        className={[
          "pointer-events-none fixed bottom-6 left-1/2 z-50 max-w-md -translate-x-1/2 px-4 transition-all duration-300",
          hatNoticeVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-2 opacity-0",
        ].join(" ")}
        role="status"
        aria-live="polite"
        aria-hidden={!hatNoticeVisible}
      >
        <div className="pointer-events-auto rounded-lg border border-zinc-600/60 bg-zinc-900/95 px-4 py-3 text-center text-sm text-zinc-200 shadow-lg backdrop-blur-sm">
          Contexto limpo. O Mentor trocou o chapéu.
        </div>
      </div>
    </div>
  );
}
