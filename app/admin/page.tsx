"use client";

import { useMemo, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import type { ZodIssue } from "zod";
import {
  incidentSyncSchema,
  projectSyncSchema,
} from "@/lib/validations/admin-sync";

type SyncType = "PROJECT" | "INCIDENT";
type IngestionMode = "IA" | "RAIZ" | "NOC";

const projectTemplateIa = {
  title: "Onboarding Plataforma Forge",
  description:
    "Projeto greenfield para mentor IA com trilha de arquitetura orientada a feedback.",
  base_xp: 320,
  core_concepts: ["Prompt Engineering", "Next.js", "Observability"],
  quests: [
    {
      title: "Modelar objetivo e rubrica do agente",
      big_picture: "Definir limites e criterio de qualidade da assistencia IA.",
      architect_mindset: "Criar contratos claros entre UI, API e agente.",
      definition_of_done: [
        "Prompt base validado",
        "Rubrica de resposta definida",
        "Fluxo de fallback documentado",
      ],
    },
  ],
};

const projectTemplateRaiz = {
  title: "Modo Raiz - Setup local completo",
  description:
    "Projeto para estruturar ambiente local, DB e automacao de setup no WSL.",
  base_xp: 250,
  core_concepts: ["WSL", "PostgreSQL", "Prisma", "DevEx"],
  quests: [
    {
      title: "Subir stack local e validar migrations",
      big_picture: "Garantir bootstrap repetivel do ambiente de desenvolvimento.",
      architect_mindset: "Reduzir friccao de setup com passos deterministas.",
      definition_of_done: [
        "Banco sobe localmente",
        "Migrations aplicadas",
        "Aplicacao responde em localhost",
      ],
    },
  ],
};

const incidentTemplateNoc = {
  title: "Pagamento em producao",
  severity: "SEV-2",
  user_report: "Clientes reportam timeout ao confirmar pagamento.",
  system_logs: "[2026-03-25T11:58:00Z] gateway timeout em /checkout/confirm",
};

const modePresets: Record<IngestionMode, { type: SyncType; payload: unknown }> = {
  IA: { type: "PROJECT", payload: projectTemplateIa },
  RAIZ: { type: "PROJECT", payload: projectTemplateRaiz },
  NOC: { type: "INCIDENT", payload: incidentTemplateNoc },
};

function buildAgentPrompt(mode: IngestionMode): string {
  if (mode === "NOC") {
    return [
      "Voce e um assistente de ingestao do Socratic Forge.",
      "Sua tarefa e gerar APENAS o payload JSON para cadastro de INCIDENTE.",
      "",
      "REGRAS OBRIGATORIAS:",
      "- Responda com JSON puro, sem markdown, sem texto extra, sem crases.",
      "- Nao inclua o envelope { type, payload }.",
      "- Retorne somente os campos abaixo:",
      "  {",
      '    "title": "string",',
      '    "severity": "string",',
      '    "user_report": "string",',
      '    "system_logs": "string"',
      "  }",
      "- Todos os campos devem ser nao vazios.",
      "",
      "Contexto do modo: Modo NOC (incidentes de producao).",
    ].join("\n");
  }

  const modeContext =
    mode === "IA"
      ? "Modo IA (projetos orientados a quests para trabalho com agente)."
      : "Modo Raiz (setup, infraestrutura local e operacao no WSL).";

  return [
    "Voce e um assistente de ingestao do Socratic Forge.",
    "Sua tarefa e gerar APENAS o payload JSON para cadastro de PROJETO.",
    "",
    "REGRAS OBRIGATORIAS:",
    "- Responda com JSON puro, sem markdown, sem texto extra, sem crases.",
    "- Nao inclua o envelope { type, payload }.",
    "- Retorne somente os campos abaixo:",
    "  {",
    '    "title": "string",',
    '    "description": "string",',
    '    "base_xp": 0,',
    '    "core_concepts": ["string"],',
    '    "quests": [',
    "      {",
    '        "title": "string",',
    '        "big_picture": "string",',
    '        "architect_mindset": "string",',
    '        "definition_of_done": ["string"]',
    "      }",
    "    ]",
    "  }",
    "- base_xp deve ser inteiro >= 0.",
    "- core_concepts deve ter ao menos 1 item.",
    "- quests deve ter ao menos 1 quest.",
    "- definition_of_done deve ter ao menos 1 item por quest.",
    "",
    `Contexto do modo: ${modeContext}`,
  ].join("\n");
}

function extractJsonFromEditorInput(input: string): string {
  const trimmed = input.trim();
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fencedMatch) {
    return fencedMatch[1].trim();
  }
  return trimmed;
}

function formatIssueForHumans(type: SyncType, issue: ZodIssue): string {
  const path = issue.path.map(String);

  if (type === "PROJECT" && path[0] === "quests" && path[1] !== undefined) {
    const questIndex = Number(path[1]) + 1;
    const field = path[2] ?? "campo desconhecido";
    return `Falta ou esta invalido o campo ${field} na Quest ${questIndex}.`;
  }

  if (path.length === 0) {
    return issue.message;
  }

  return `Campo ${path.join(".")} invalido: ${issue.message}`;
}

export default function AdminPage() {
  const [mode, setMode] = useState<IngestionMode>("IA");
  const [type, setType] = useState<SyncType>(modePresets.IA.type);
  const [jsonInput, setJsonInput] = useState(
    JSON.stringify(modePresets.IA.payload, null, 2),
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const helperText = useMemo(() => {
    if (mode === "IA") {
      return "Modo IA: cadastro de projeto greenfield orientado a quests.";
    }
    if (mode === "RAIZ") {
      return "Modo Raiz: projeto focado em setup, infraestrutura e operacao local.";
    }
    return "Modo NOC: incidente para investigacao com severidade e logs.";
  }, [mode]);

  const agentPrompt = useMemo(() => buildAgentPrompt(mode), [mode]);

  function handleModeChange(next: IngestionMode) {
    setMode(next);
    const preset = modePresets[next];
    setType(preset.type);
    setErrors([]);
    setSuccess("");
    setCopiedPrompt(false);
    setJsonInput(JSON.stringify(preset.payload, null, 2));
  }

  function handleTypeChange(next: SyncType) {
    setType(next);
    setErrors([]);
    setSuccess("");
    setCopiedPrompt(false);
    const template =
      next === "PROJECT" ? modePresets.IA.payload : modePresets.NOC.payload;
    setJsonInput(JSON.stringify(template, null, 2));
  }

  async function handleCopyPrompt() {
    try {
      await navigator.clipboard.writeText(agentPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 1800);
    } catch {
      setErrors(["Nao foi possivel copiar o prompt automaticamente."]);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    setSuccess("");

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(extractJsonFromEditorInput(jsonInput));
    } catch {
      setErrors(["JSON invalido: verifique virgulas, aspas e chaves."]);
      return;
    }

    const validation =
      type === "PROJECT"
        ? projectSyncSchema.safeParse(parsedJson)
        : incidentSyncSchema.safeParse(parsedJson);

    if (!validation.success) {
      setErrors(validation.error.issues.map((issue) => formatIssueForHumans(type, issue)));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          payload: validation.data,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        issues?: string[];
        message?: string;
      };

      if (!response.ok) {
        const backendErrors = Array.isArray(data.issues) ? data.issues : [];
        setErrors([
          data.error ?? "Falha ao sincronizar com a API.",
          ...backendErrors,
        ]);
        return;
      }

      setSuccess(data.message ?? "Sincronizacao concluida com sucesso.");
    } catch (error) {
      setErrors([
        error instanceof Error
          ? error.message
          : "Erro inesperado durante a sincronizacao.",
      ]);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-zinc-100">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-[#111018] via-[#0b0b12] to-[#09090f] p-6 shadow-[0_0_0_1px_rgba(168,85,247,0.1),0_20px_80px_rgba(59,7,100,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/80">
            Dark Control Room
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">
            Admin Sync Console
          </h1>
          <p className="mt-3 text-sm text-zinc-400">{helperText}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                Preset de modo
              </p>
              <div className="inline-flex rounded-xl border border-zinc-700/70 bg-[#0c0c0f] p-1">
                <button
                  type="button"
                  onClick={() => handleModeChange("IA")}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    mode === "IA"
                      ? "bg-violet-500/25 text-violet-100 ring-1 ring-violet-300/40"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Modo IA
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("RAIZ")}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    mode === "RAIZ"
                      ? "bg-violet-500/25 text-violet-100 ring-1 ring-violet-300/40"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Modo Raiz
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("NOC")}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    mode === "NOC"
                      ? "bg-violet-500/25 text-violet-100 ring-1 ring-violet-300/40"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Modo NOC
                </button>
              </div>
            </div>

            <div className="inline-flex rounded-xl border border-zinc-700/70 bg-[#0c0c0f] p-1">
              <button
                type="button"
                onClick={() => handleTypeChange("PROJECT")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  type === "PROJECT"
                    ? "bg-violet-500/25 text-violet-100 ring-1 ring-violet-300/40"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Cadastrar Projeto
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("INCIDENT")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  type === "INCIDENT"
                    ? "bg-violet-500/25 text-violet-100 ring-1 ring-violet-300/40"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Cadastrar Incidente
              </button>
            </div>

            <TextareaAutosize
              value={jsonInput}
              onChange={(event) => setJsonInput(event.target.value)}
              minRows={18}
              className="w-full rounded-xl border border-zinc-700/80 bg-[#0a0a0a] p-4 font-mono text-sm leading-relaxed text-zinc-100 outline-none ring-violet-400/30 transition focus:border-violet-400/60 focus:ring"
            />

            {errors.length > 0 ? (
              <div className="rounded-xl border border-rose-500/35 bg-rose-950/30 p-4">
                <p className="text-sm font-semibold text-rose-200">
                  Erros de validacao
                </p>
                <ul className="mt-2 space-y-1 text-sm text-rose-100/90">
                  {errors.map((error, index) => (
                    <li key={`${error}-${index}`}>- {error}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {success ? (
              <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/20 p-4 text-sm text-emerald-200">
                {success}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl border border-violet-400/40 bg-violet-500/20 px-5 py-3 text-sm font-semibold text-violet-100 transition hover:border-violet-300/60 hover:bg-violet-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Sincronizando..." : "Forjar & Sincronizar"}
            </button>
          </form>

          <section className="mt-6 rounded-xl border border-zinc-700/70 bg-[#0b0b10] p-4">
            <p className="text-sm font-semibold text-zinc-200">
              Tipos e campos aceitos pela API
            </p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              Envelope do POST: {"{ type: 'PROJECT' | 'INCIDENT', payload: ... }"}.
            </p>
            <div className="mt-3 grid gap-3 text-xs text-zinc-300 md:grid-cols-2">
              <div className="rounded-lg border border-zinc-700/70 bg-black/20 p-3">
                <p className="font-semibold text-violet-200">type: PROJECT</p>
                <p className="mt-1">
                  payload.title, payload.description, payload.base_xp,
                  payload.core_concepts[], payload.quests[].
                </p>
                <p className="mt-1 text-zinc-400">
                  quest: title, big_picture, architect_mindset,
                  definition_of_done[].
                </p>
              </div>
              <div className="rounded-lg border border-zinc-700/70 bg-black/20 p-3">
                <p className="font-semibold text-violet-200">type: INCIDENT</p>
                <p className="mt-1">
                  payload.title, payload.severity, payload.user_report,
                  payload.system_logs.
                </p>
                <p className="mt-1 text-zinc-400">
                  Usado no fluxo NOC para abrir incidente no dashboard.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-zinc-700/70 bg-[#0b0b10] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-zinc-200">
                Prompt para IA (retornar somente payload JSON)
              </p>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="rounded-lg border border-violet-400/40 bg-violet-500/20 px-3 py-1.5 text-xs font-semibold text-violet-100 transition hover:border-violet-300/60 hover:bg-violet-500/30"
              >
                {copiedPrompt ? "Prompt copiado" : "Copiar prompt"}
              </button>
            </div>
            <TextareaAutosize
              value={agentPrompt}
              readOnly
              minRows={14}
              className="mt-3 w-full rounded-lg border border-zinc-700/80 bg-[#09090d] p-3 font-mono text-xs leading-relaxed text-zinc-200 outline-none"
            />
          </section>
        </section>
      </div>
    </main>
  );
}
