"use client";

import { Group, Panel, Separator } from "react-resizable-panels";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Loader2, Terminal, X } from "lucide-react";
import { MessageBubble } from "@/components/workspace/MessageBubble";
import { QuestStepper } from "@/components/workspace/QuestStepper";
import { WorkspaceChatInput } from "@/components/workspace/WorkspaceChatInput";
import { completeQuest } from "@/actions/completeQuest";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppBreadcrumb } from "@/components/navigation/AppBreadcrumb";
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
  userId?: string;
  questId?: string;
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

type Retrospective = {
  executive_summary: string;
  wrong_paths_taken: string[];
  mental_model_shift: string;
  spaced_repetition_tags: string[];
};

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function isRetrospective(v: unknown): v is Retrospective {
  if (!v || typeof v !== "object") return false;
  const x = v as Record<string, unknown>;
  return (
    typeof x.executive_summary === "string" &&
    typeof x.mental_model_shift === "string" &&
    isStringArray(x.wrong_paths_taken) &&
    isStringArray(x.spaced_repetition_tags)
  );
}

export function WorkspaceShell({
  projectId,
  userId,
  questId,
}: WorkspaceShellProps) {
  const router = useRouter();
  const [currentPhase, setCurrentPhase] = useState<QuestPhase>("DISCOVERY");
  const [messages, setMessages] = useState<WorkspaceMockMessage[]>(
    workspaceInitialMessagesMock,
  );
  const [transcript, setTranscript] = useState<WorkspaceMockMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [hatNoticeVisible, setHatNoticeVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationCode, setValidationCode] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState<ReviewVerdict | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [retroLoading, setRetroLoading] = useState(false);
  const [retroError, setRetroError] = useState<string | null>(null);
  const [retrospective, setRetrospective] = useState<Retrospective | null>(null);
  const [rewardLoading, setRewardLoading] = useState(false);
  const [rewardError, setRewardError] = useState<string | null>(null);
  const [contextCopied, setContextCopied] = useState(false);

  const theme = QUEST_PHASE_THEMES[currentPhase];

  const buildContextPayload = useCallback(() => {
    const title = workspaceQuestMock.title;
    const phaseLabel =
      currentPhase === "HANDS_ON" ? "HANDS-ON" : currentPhase;

    if (currentPhase === "DISCOVERY") {
      return [
        `# CONTEXTO DE ARQUITETURA (FASE: ${phaseLabel})`,
        `## OBJETIVO DA QUEST: ${title}`,
        `## BIG PICTURE: ${workspaceQuestMock.big_picture}`,
        `## MINDSET DO ARQUITETO: ${workspaceQuestMock.architect_mindset}`,
        "",
        "**SUA MISSÃO COMO IA:** Não escreva código. Faça-me perguntas socráticas uma a uma para me ajudar a deduzir a melhor forma de implementar isso em Go.",
      ].join("\n");
    }

    if (currentPhase === "HANDS_ON" || currentPhase === "VALIDATION") {
      const dodLines = workspaceQuestMock.definition_of_done.map(
        (item) => `- ${item}`,
      );
      return [
        `# CONTEXTO DE DESENVOLVIMENTO (FASE: ${phaseLabel})`,
        `## OBJETIVO DA QUEST: ${title}`,
        "## DEFINITION OF DONE (REQUISITOS):",
        ...dodLines,
        "",
        "**SUA MISSÃO COMO IA:** Atue como meu Pair Programmer sênior. O código será escrito em Go. Ajude-me a implementar estes requisitos passo a passo. Seja conciso.",
      ].join("\n");
    }

    return [
      `# CONTEXTO (FASE: ${phaseLabel})`,
      `## OBJETIVO DA QUEST: ${title}`,
      "",
      "**SUA MISSÃO COMO IA:** Ajude-me a concluir esta fase de forma objetiva.",
    ].join("\n");
  }, [currentPhase]);

  const handleCopyContext = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildContextPayload());
      setContextCopied(true);
      window.setTimeout(() => setContextCopied(false), 2000);
    } catch {
      setContextCopied(false);
    }
  }, [buildContextPayload]);

  const handlePhaseChange = useCallback((newPhase: QuestPhase) => {
    if (newPhase === currentPhase) return;
    setCurrentPhase(newPhase);
    setTranscript((prev) => (messages.length > 0 ? [...prev, ...messages] : prev));
    setMessages([]);
    setHatNoticeVisible(true);
    setReviewResult(null);
    setReviewError(null);
    setReviewLoading(false);
    if (newPhase === "VALIDATION") {
      setValidationCode("");
    }
    if (newPhase === "DONE") {
      setRetroError(null);
      setRetrospective(null);
      setRewardError(null);
    }
  }, [currentPhase, messages]);

  useEffect(() => {
    if (currentPhase !== "DONE") return;
    if (retroLoading || retrospective) return;
    const finalCode = validationCode.trim();
    if (!finalCode) {
      setRetroError("Código final não encontrado para gerar o post-mortem.");
      return;
    }

    const run = async () => {
      setRetroLoading(true);
      setRetroError(null);
      try {
        const res = await fetch("/api/retrospective", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            finalCode,
            transcript,
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
              : `Erro ao gerar post-mortem (${res.status}).`;
          setRetroError(msg);
          return;
        }

        if (!isRetrospective(data)) {
          setRetroError(
            "Post-mortem veio em formato inesperado. Tente novamente.",
          );
          return;
        }

        setRetrospective(data);
      } catch {
        setRetroError(
          "Não foi possível conectar ao servidor. Verifique sua rede e tente de novo.",
        );
      } finally {
        setRetroLoading(false);
      }
    };

    void run();
  }, [currentPhase, retroLoading, retrospective, transcript, validationCode]);

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
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-zinc-100">
              Workspace
            </h1>
            <div className="mt-1">
              <AppBreadcrumb
                items={[
                  { label: "Home", href: "/" },
                  { label: "Modo Arquiteto AI", href: "/dashboard" },
                  { label: "Workspace" },
                ]}
              />
            </div>
            <p className="mt-0.5 font-mono text-xs text-zinc-500">
              project / {projectId}
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center rounded-lg border border-zinc-700/70 bg-zinc-900/70 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-zinc-600 hover:text-zinc-100"
          >
            Menu inicial
          </Link>
        </div>
      </header>

      <QuestStepper currentPhase={currentPhase} />

      <Group orientation="horizontal" className="min-h-0 flex-1">
        <Panel id="context" defaultSize={40} minSize={22} className="min-w-0">
          <aside className="scrollbar-dark flex h-full flex-col overflow-y-auto border-r border-zinc-800/80 bg-[#060606] px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                  Quest — contexto
                </p>
                <h2 className="mt-2 truncate text-base font-semibold text-zinc-100">
                  {workspaceQuestMock.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => void handleCopyContext()}
                className={[
                  "group inline-flex shrink-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-semibold transition",
                  contextCopied
                    ? "border-emerald-500/60 bg-emerald-950/35 text-emerald-100"
                    : "border-zinc-700/70 bg-zinc-900/60 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800/70",
                ].join(" ")}
                aria-label={
                  contextCopied
                    ? "Contexto copiado"
                    : "Copiar contexto para LMStudio"
                }
              >
                {contextCopied ? (
                  <CheckCircle
                    className="size-4 shrink-0 text-emerald-400"
                    aria-hidden
                  />
                ) : (
                  <Terminal
                    className="size-4 shrink-0 text-zinc-300 group-hover:text-zinc-100"
                    aria-hidden
                  />
                )}
                <span className="hidden whitespace-nowrap sm:inline">
                  {contextCopied ? "Contexto Copiado!" : "Copiar Contexto"}
                </span>
              </button>
            </div>
            <section className="mt-5">
              <h3 className="text-xs font-medium uppercase tracking-wide text-forge-discovery">
                Big picture
              </h3>
              <p className="mt-2 max-h-28 overflow-hidden text-sm leading-relaxed text-zinc-400 sm:max-h-40 md:max-h-none">
                {workspaceQuestMock.big_picture}
              </p>
            </section>
            <section className="mt-6">
              <h3 className="text-xs font-medium uppercase tracking-wide text-forge-handsOn">
                Architect mindset
              </h3>
              <p className="mt-2 max-h-28 overflow-hidden text-sm leading-relaxed text-zinc-400 sm:max-h-40 md:max-h-none">
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
            {currentPhase === "DONE" ? (
              <div className="scrollbar-dark min-h-0 flex-1 overflow-y-auto px-4 py-5">
                <div className="rounded-xl border border-emerald-500/45 bg-emerald-950/20 p-5 shadow-[0_0_45px_-18px_rgba(16,185,129,0.55)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/85">
                    Post-mortem — Relatório da Quest
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-emerald-50">
                    Vitória confirmada. Hora de consolidar o aprendizado.
                  </h2>

                  {retroLoading ? (
                    <p
                      className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-100/90"
                      role="status"
                      aria-live="polite"
                    >
                      <Loader2
                        className="size-4 shrink-0 animate-spin text-emerald-300"
                        aria-hidden
                      />
                      Gerando post-mortem (LMStudio)…
                    </p>
                  ) : null}

                  {retroError ? (
                    <div
                      className="mt-4 rounded-lg border border-red-500/60 bg-red-950/45 px-4 py-3 text-sm text-red-100"
                      role="alert"
                    >
                      {retroError}
                    </div>
                  ) : null}

                  {retrospective ? (
                    <div className="mt-5 space-y-4">
                      <div className="rounded-lg border border-emerald-500/30 bg-[#070707] px-4 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300/85">
                          Executive summary
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                          {retrospective.executive_summary}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <div className="rounded-lg border border-emerald-500/25 bg-[#070707] px-4 py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300/85">
                            Caminhos errados
                          </p>
                          <ul className="mt-2 space-y-2">
                            {retrospective.wrong_paths_taken.length > 0 ? (
                              retrospective.wrong_paths_taken.map((x, i) => (
                                <li
                                  key={`${i}-${x}`}
                                  className="text-sm leading-relaxed text-zinc-200"
                                >
                                  <span className="text-emerald-300/80">
                                    {i + 1}.
                                  </span>{" "}
                                  {x}
                                </li>
                              ))
                            ) : (
                              <li className="text-sm text-zinc-400">
                                Sem desvios relevantes registrados.
                              </li>
                            )}
                          </ul>
                        </div>

                        <div className="rounded-lg border border-emerald-500/25 bg-[#070707] px-4 py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300/85">
                            Mudança de modelo mental
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                            {retrospective.mental_model_shift}
                          </p>
                        </div>

                        <div className="rounded-lg border border-emerald-500/25 bg-[#070707] px-4 py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300/85">
                            Conceitos a reforçar
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {retrospective.spaced_repetition_tags.length > 0 ? (
                              retrospective.spaced_repetition_tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full border border-emerald-400/35 bg-emerald-950/30 px-2.5 py-1 text-xs font-semibold text-emerald-100"
                                >
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-zinc-400">
                                Nenhuma tag retornada.
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {rewardError ? (
                    <div
                      className="mt-4 rounded-lg border border-red-500/60 bg-red-950/45 px-4 py-3 text-sm text-red-100"
                      role="alert"
                    >
                      {rewardError}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    disabled={
                      rewardLoading ||
                      retroLoading ||
                      !retrospective ||
                      !userId ||
                      !(questId ?? projectId)
                    }
                    onClick={async () => {
                      setRewardLoading(true);
                      setRewardError(null);
                      try {
                        if (!userId) {
                          setRewardError(
                            "userId ausente. Passe ?userId=... na URL para habilitar o resgate.",
                          );
                          return;
                        }
                        const resolvedQuestId = (questId ?? projectId).trim();
                        if (!resolvedQuestId) {
                          setRewardError(
                            "questId ausente. Passe ?questId=... na URL para habilitar o resgate.",
                          );
                          return;
                        }

                        await completeQuest({
                          userId,
                          questId: resolvedQuestId,
                        });

                        router.push("/dashboard");
                      } catch (err) {
                        const msg =
                          err instanceof Error
                            ? err.message
                            : "Falha ao completar quest.";
                        setRewardError(msg);
                      } finally {
                        setRewardLoading(false);
                      }
                    }}
                    className="mt-6 w-full rounded-xl border border-emerald-300/60 bg-gradient-to-b from-emerald-400 to-emerald-600 px-5 py-4 text-base font-black tracking-tight text-emerald-950 shadow-[0_0_50px_-14px_rgba(16,185,129,0.7)] transition hover:from-emerald-300 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                  >
                    {rewardLoading
                      ? "Processando recompensa…"
                      : "Receber XP e Voltar ao QG"}
                  </button>
                  <p className="mt-2 text-center text-[11px] text-emerald-200/60">
                    Esta ação atualiza seu progresso, registra o XP e recarrega o
                    Dashboard.
                  </p>
                </div>
              </div>
            ) : (
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
            )}
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
