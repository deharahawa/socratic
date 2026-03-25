"use client";

import Link from "next/link";
import { Group, Panel, Separator } from "react-resizable-panels";
import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, Copy, TerminalSquare } from "lucide-react";
import { MessageBubble } from "@/components/workspace/MessageBubble";
import { WorkspaceChatInput } from "@/components/workspace/WorkspaceChatInput";
import { AppBreadcrumb } from "@/components/navigation/AppBreadcrumb";

type RootPhase = "DISCOVERY" | "HANDS_ON" | "VALIDATION";

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
};

const phaseMeta: Record<
  RootPhase,
  {
    label: string;
    badgeClass: string;
    helper: string;
    iaMission: string;
  }
> = {
  DISCOVERY: {
    label: "Discovery",
    badgeClass: "border-cyan-500/50 bg-cyan-950/25 text-cyan-200",
    helper: "Mapeie arquitetura, escopo e riscos antes de codar.",
    iaMission:
      "Ajude como arquiteto de software: faça perguntas socráticas e valide hipóteses antes da implementação.",
  },
  HANDS_ON: {
    label: "Hands-on",
    badgeClass: "border-emerald-500/50 bg-emerald-950/25 text-emerald-200",
    helper: "Implemente por incrementos pequenos e verificáveis.",
    iaMission:
      "Atue como pair programmer sênior e proponha passos objetivos de implementação fullstack.",
  },
  VALIDATION: {
    label: "Validation",
    badgeClass: "border-amber-500/50 bg-amber-950/25 text-amber-200",
    helper: "Consolide testes, checklist técnico e critérios de aceite.",
    iaMission:
      "Reveja a solução com foco em risco, regressão, observabilidade e critérios de pronto.",
  },
};

const projectBrief = [
  "Você está no Modo Raiz: execução local fullstack no WSL.",
  "Objetivo: construir e validar as entregas de arquitetura com suporte da IA, sem abstrair etapas técnicas.",
  "Infra: Podman/Postgres + Next.js + Prisma.",
].join(" ");

export function RootModeShell() {
  const [phase, setPhase] = useState<RootPhase>("DISCOVERY");
  const [contextCopied, setContextCopied] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "a-root-boot",
      role: "assistant",
      content:
        "Bem-vindo ao **Modo Raiz**. Descreva o que você vai construir e eu te acompanho da arquitetura até validação final.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const meta = phaseMeta[phase];

  const buildContextPayload = useCallback(() => {
    return [
      `# MODO RAIZ (FASE: ${meta.label.toUpperCase()})`,
      `## RESUMO`,
      projectBrief,
      "",
      `## MISSAO DA IA`,
      meta.iaMission,
      "",
      "## RESTRICOES",
      "- Rodar fullstack local (WSL).",
      "- Priorizar mudancas pequenas + validacao continua.",
      "- Explicar trade-offs de arquitetura quando necessario.",
    ].join("\n");
  }, [meta.iaMission, meta.label]);

  const handleCopyContext = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildContextPayload());
      setContextCopied(true);
      window.setTimeout(() => setContextCopied(false), 2000);
    } catch {
      setContextCopied(false);
    }
  }, [buildContextPayload]);

  const handleSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMsg = {
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
          phase,
          context: {
            mode: "ROOT",
            title: "Modo Raiz Fullstack",
            projectBrief,
            iaMission: meta.iaMission,
          },
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

      const reply = typeof data.content === "string" ? data.content : "";
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
            "Nao foi possivel conectar ao servidor. Verifique sua rede e tente de novo.",
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [draft, isLoading, meta.iaMission, phase]);

  const phaseButtons = useMemo(
    () =>
      (Object.keys(phaseMeta) as RootPhase[]).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => setPhase(key)}
          className={[
            "rounded-lg border px-3 py-2 text-xs font-semibold transition",
            phase === key
              ? phaseMeta[key].badgeClass
              : "border-emerald-900/40 bg-[#0b0b0b] text-emerald-200/70 hover:border-emerald-700/50 hover:text-emerald-200",
          ].join(" ")}
        >
          {phaseMeta[key].label}
        </button>
      )),
    [phase],
  );

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[#050505] text-zinc-100">
      <header className="shrink-0 border-b border-emerald-900/45 bg-[#080808] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
              Root Workspace
            </p>
            <h1 className="mt-1 truncate text-sm font-semibold tracking-tight text-zinc-100">
              Modo Raiz — Execucao Fullstack Manual
            </h1>
            <div className="mt-1">
              <AppBreadcrumb
                items={[
                  { label: "Home", href: "/" },
                  { label: "Modo Raiz", href: "/setup" },
                  { label: "Workspace" },
                ]}
              />
            </div>
            <p className="mt-0.5 font-mono text-xs text-zinc-500">
              phase / {meta.label.toLowerCase()}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center rounded-lg border border-emerald-900/50 bg-[#0b0b0b] px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:border-emerald-700/60 hover:bg-emerald-950/25"
            >
              Menu inicial
            </Link>
            <button
              type="button"
              onClick={() => void handleCopyContext()}
              className={[
                "group inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition",
                contextCopied
                  ? "border-emerald-500/60 bg-emerald-950/35 text-emerald-100"
                  : "border-emerald-900/50 bg-[#0b0b0b] text-emerald-200 hover:border-emerald-700/60 hover:bg-emerald-950/25",
              ].join(" ")}
              aria-label={contextCopied ? "Contexto copiado" : "Exportar contexto"}
            >
              {contextCopied ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-400" aria-hidden />
              ) : (
                <Copy className="size-4 shrink-0 text-emerald-300 group-hover:text-emerald-200" aria-hidden />
              )}
              <span className="hidden whitespace-nowrap sm:inline">
                {contextCopied ? "Contexto Copiado!" : "Exportar Contexto"}
              </span>
            </button>
          </div>
        </div>
      </header>

      <Group orientation="horizontal" className="min-h-0 flex-1">
        <Panel id="root-briefing" defaultSize={42} minSize={24} className="min-w-0">
          <aside className="scrollbar-dark flex h-full flex-col overflow-y-auto border-r border-emerald-900/45 bg-[#060606] px-4 py-4">
            <div className="flex flex-wrap items-center gap-2">{phaseButtons}</div>

            <section className="mt-5 rounded-xl border border-emerald-900/40 bg-black/20 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/85">
                [ Projeto / Problema ]
              </p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                {projectBrief}
              </p>
              <div className="mt-4 rounded-lg border border-emerald-500/25 bg-emerald-950/12 px-3 py-2.5">
                <p className="text-xs font-semibold text-emerald-200">
                  Etapa atual: {meta.label}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  {meta.helper}
                </p>
              </div>
            </section>

            <section className="mt-4 rounded-xl border border-emerald-900/35 bg-black/20 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                [ Guia de Execucao ]
              </p>
              <ul className="mt-3 space-y-2 text-xs text-zinc-400">
                <li className="rounded-lg border border-emerald-900/30 bg-[#0b0b0b] px-3 py-2 font-mono text-emerald-200/90">
                  podman-compose up -d
                </li>
                <li className="rounded-lg border border-emerald-900/30 bg-[#0b0b0b] px-3 py-2 font-mono text-emerald-200/90">
                  npx prisma migrate dev --name init
                </li>
                <li className="rounded-lg border border-emerald-900/30 bg-[#0b0b0b] px-3 py-2 font-mono text-emerald-200/90">
                  npm run dev
                </li>
              </ul>
            </section>
          </aside>
        </Panel>

        <Separator className="relative w-1.5 shrink-0 bg-emerald-950/35 transition-colors hover:bg-emerald-800/35">
          <span className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-emerald-900/50" />
        </Separator>

        <Panel id="root-mentor" defaultSize={58} minSize={28} className="min-w-0">
          <div className="flex h-full min-h-0 flex-col border-2 border-emerald-900/45 bg-[#050505]">
            <div className="shrink-0 border-b border-emerald-900/35 bg-emerald-950/20 px-4 py-2">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-emerald-200/85">
                <TerminalSquare className="size-3.5" aria-hidden />
                Root Mentor AI
              </p>
            </div>

            <div className="scrollbar-dark min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  role={m.role}
                  content={m.content}
                  questPhase="HANDS_ON"
                  isError={m.isError}
                  assistantClassName={
                    m.isError
                      ? undefined
                      : "border-l-2 border-emerald-500/70 bg-emerald-950/20"
                  }
                />
              ))}
            </div>

            <WorkspaceChatInput
              value={draft}
              onChange={setDraft}
              onSend={() => void handleSend()}
              isLoading={isLoading}
              placeholder="Descreva seu passo atual, cole trecho de codigo ou erro do ambiente..."
            />
          </div>
        </Panel>
      </Group>
    </div>
  );
}

