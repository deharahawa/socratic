"use client";

import { Group, Panel, Separator } from "react-resizable-panels";
import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle, Copy, Siren } from "lucide-react";
import { MessageBubble } from "@/components/workspace/MessageBubble";
import { WorkspaceChatInput } from "@/components/workspace/WorkspaceChatInput";
import { AppBreadcrumb } from "@/components/navigation/AppBreadcrumb";

type TabKey = "ticket" | "logs";

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
};

const incidentTitleMock = "Deadlock na Goroutine de Pagamento";
const userTicketMock = [
  "Pessoal, o checkout travou no meio do pagamento.",
  "O cliente ficou preso na tela de “Processando…”, e depois recebeu cobrança duplicada.",
  "Isso começou hoje após o deploy das 14:07. Preciso de um hotfix urgente.",
].join("\n");

const goStackTraceMock = [
  "panic: fatal error: all goroutines are asleep - deadlock!",
  "",
  "goroutine 1 [chan receive, 32 minutes]:",
  "payments/checkout.(*Processor).WaitForSettlement(0xc00023a180, 0x0?)",
  "\t/app/payments/checkout/processor.go:187 +0x1f4",
  "payments/checkout.(*Handler).Handle(0xc000119600, 0x13f3d20?, 0xc0000b6000?)",
  "\t/app/payments/checkout/http.go:92 +0x6a1",
  "net/http.HandlerFunc.ServeHTTP(0xc00011e000, 0x13f3d20, 0xc0000b6000, 0xc00012a000)",
  "\t/usr/local/go/src/net/http/server.go:2136 +0x2f",
  "",
  "goroutine 42 [select]:",
  "payments/locks.(*Gate).Acquire(0xc0000a8b40, {0x13fd920, 0xc0002b0000})",
  "\t/app/payments/locks/gate.go:55 +0x2c9",
  "payments/checkout.(*Processor).Start(0xc00023a180, 0xc0002b0000)",
  "\t/app/payments/checkout/processor.go:71 +0x19d",
].join("\n");

export function IncidentNocShell({ incidentId }: { incidentId: string }) {
  const [tab, setTab] = useState<TabKey>("ticket");
  const [contextCopied, setContextCopied] = useState(false);

  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "a-boot",
      role: "assistant",
      content:
        "Você está no **NOC Workspace**. Cole o trecho suspeito do código Go e eu ajudo a montar hipóteses, reproduzir e isolar a causa raiz.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const incidentErrorMock = useMemo(
    () => `Checkout travado e possível cobrança duplicada (incident ${incidentId})`,
    [incidentId],
  );

  const buildExportPayload = useCallback(() => {
    return `Atue como SRE. O usuário reportou ${incidentErrorMock} e o log diz:\n\n${goStackTraceMock}\n\nAjude-me a investigar a causa raiz neste código Go.`;
  }, [incidentErrorMock]);

  const handleCopyContext = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildExportPayload());
      setContextCopied(true);
      window.setTimeout(() => setContextCopied(false), 2000);
    } catch {
      setContextCopied(false);
    }
  }, [buildExportPayload]);

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
          phase: "HANDS_ON",
          context: {
            mode: "NOC",
            incidentId,
            severity: "SEV-2",
            title: incidentTitleMock,
            userReport: userTicketMock,
            logs: goStackTraceMock,
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
            "Não foi possível conectar ao servidor. Verifique sua rede e tente de novo.",
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [draft, incidentId, isLoading]);

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[#050505] text-zinc-100">
      <header className="shrink-0 border-b border-red-900/50 bg-[#080808] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-red-400/80">
              NOC Workspace
            </p>
            <h1 className="mt-1 truncate text-sm font-semibold tracking-tight text-zinc-100">
              <span className="text-red-500">🔥 SEV-2:</span>{" "}
              {incidentTitleMock}
            </h1>
            <div className="mt-1">
              <AppBreadcrumb
                items={[
                  { label: "Home", href: "/" },
                  { label: "Modo Chaos/NOC" },
                  { label: "Incident Workspace" },
                ]}
              />
            </div>
            <p className="mt-0.5 font-mono text-xs text-zinc-500">
              incident / {incidentId}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center rounded-lg border border-red-900/50 bg-[#0b0b0b] px-3 py-2 text-xs font-semibold text-red-200 transition hover:border-red-700/60 hover:bg-red-950/25"
            >
              Menu inicial
            </Link>
            <button
              type="button"
              onClick={() => void handleCopyContext()}
              className={[
                "group inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition",
                contextCopied
                  ? "border-emerald-500/60 bg-emerald-950/35 text-emerald-100"
                  : "border-red-900/50 bg-[#0b0b0b] text-red-200 hover:border-red-700/60 hover:bg-red-950/25",
              ].join(" ")}
              aria-label={contextCopied ? "Contexto copiado" : "Exportar contexto"}
            >
              {contextCopied ? (
                <CheckCircle
                  className="size-4 shrink-0 text-emerald-400"
                  aria-hidden
                />
              ) : (
                <Copy
                  className="size-4 shrink-0 text-red-300 group-hover:text-red-200"
                  aria-hidden
                />
              )}
              <span className="hidden whitespace-nowrap sm:inline">
                {contextCopied ? "Contexto Copiado!" : "Exportar Contexto"}
              </span>
            </button>
          </div>
        </div>
      </header>

      <Group orientation="horizontal" className="min-h-0 flex-1">
        <Panel id="crime-scene" defaultSize={42} minSize={24} className="min-w-0">
          <aside className="scrollbar-dark flex h-full flex-col overflow-y-auto border-r border-red-900/50 bg-[#060606] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  A Cena do Crime
                </p>
                <p className="mt-2 text-sm font-semibold text-zinc-200">
                  Evidências coletadas (mock)
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTab("ticket")}
                  className={[
                    "rounded-lg border px-3 py-2 text-xs font-semibold transition",
                    tab === "ticket"
                      ? "border-amber-600/60 bg-amber-950/20 text-amber-200 shadow-[0_0_24px_-12px_rgba(245,158,11,0.45)]"
                      : "border-red-900/40 bg-[#0b0b0b] text-red-200/70 hover:border-red-700/50 hover:text-red-200",
                  ].join(" ")}
                >
                  Chamado do Usuário
                </button>
                <button
                  type="button"
                  onClick={() => setTab("logs")}
                  className={[
                    "rounded-lg border px-3 py-2 text-xs font-semibold transition",
                    tab === "logs"
                      ? "border-amber-600/60 bg-amber-950/20 text-amber-200 shadow-[0_0_24px_-12px_rgba(245,158,11,0.45)]"
                      : "border-red-900/40 bg-[#0b0b0b] text-red-200/70 hover:border-red-700/50 hover:text-red-200",
                  ].join(" ")}
                >
                  Server Logs
                </button>
              </div>
            </div>

            {tab === "ticket" ? (
              <section className="mt-5 rounded-xl border border-red-900/40 bg-black/20 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-red-300/85">
                  [ Chamado do Usuário ]
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                  {userTicketMock}
                </p>
                <div className="mt-4 rounded-lg border border-amber-600/30 bg-amber-950/15 px-3 py-2.5">
                  <p className="text-xs font-semibold text-amber-200">
                    Hipótese inicial
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                    Mudança recente + travamento + cobrança duplicada → risco de
                    concorrência/locks + retry não-idempotente.
                  </p>
                </div>
              </section>
            ) : (
              <section className="mt-5 rounded-xl border border-red-900/40 bg-black/20 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-red-300/85">
                  [ Server Logs ]
                </p>
                <pre className="scrollbar-dark mt-3 overflow-x-auto rounded-lg border border-red-900/30 bg-[#0b0b0b] p-3 font-mono text-xs leading-relaxed text-zinc-200">
                  {goStackTraceMock}
                </pre>
                <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                  Dica: exporte o contexto para colar no seu modelo local e peça
                  uma análise estilo SRE.
                </p>
              </section>
            )}
          </aside>
        </Panel>

        <Separator className="relative w-1.5 shrink-0 bg-red-950/40 transition-colors hover:bg-red-800/40">
          <span className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-red-900/50" />
        </Separator>

        <Panel id="debugger" defaultSize={58} minSize={28} className="min-w-0">
          <div className="flex h-full min-h-0 flex-col border-2 border-red-900/50 bg-[#050505]">
            <div className="shrink-0 border-b border-red-900/40 bg-red-950/20 px-4 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-red-300/80">
                Debugger Mentor
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
                      : "border-l-2 border-red-500/70 bg-red-950/20"
                  }
                />
              ))}
            </div>

            <WorkspaceChatInput
              value={draft}
              onChange={setDraft}
              onSend={() => void handleSend()}
              isLoading={isLoading}
              placeholder="Cole o código Go suspeito / descreva o incidente… (Shift+Enter nova linha)"
            />
          </div>
        </Panel>
      </Group>

      <div className="pointer-events-none fixed bottom-6 right-6 z-50">
        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-red-900/50 bg-black/40 px-3 py-2 text-xs font-semibold text-red-200 shadow-[0_0_40px_-16px_rgba(239,68,68,0.55)] backdrop-blur-sm">
          <Siren className="size-4 text-red-400/90" aria-hidden />
          Modo NOC (Opt-in)
        </div>
      </div>
    </div>
  );
}

