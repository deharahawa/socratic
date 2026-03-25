import { NextResponse } from "next/server";
import { parseJsonObjectFromLlmText } from "@/lib/extract-json-from-llm";

const LMSTUDIO_URL = "http://127.0.0.1:1234/v1/chat/completions";

type TranscriptMessage = {
  role: "user" | "assistant";
  content: string;
};

type RetrospectiveRequestBody = {
  finalCode?: unknown;
  transcript?: unknown;
};

type Retrospective = {
  executive_summary: string;
  wrong_paths_taken: string[];
  mental_model_shift: string;
  spaced_repetition_tags: string[];
};

function isConnectionRefused(err: unknown): boolean {
  if (err && typeof err === "object" && "cause" in err) {
    const c = (err as { cause?: unknown }).cause;
    if (c && typeof c === "object" && "code" in c) {
      return (c as { code: string }).code === "ECONNREFUSED";
    }
  }
  if (err && typeof err === "object" && "code" in err) {
    return (err as { code: string }).code === "ECONNREFUSED";
  }
  return false;
}

function extractAssistantContent(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const first = choices[0];
  if (!first || typeof first !== "object") return null;
  const message = (first as { message?: unknown }).message;
  if (!message || typeof message !== "object") return null;
  const content = (message as { content?: unknown }).content;
  return typeof content === "string" ? content : null;
}

function isTranscriptMessage(v: unknown): v is TranscriptMessage {
  if (!v || typeof v !== "object") return false;
  const x = v as { role?: unknown; content?: unknown };
  return (
    (x.role === "user" || x.role === "assistant") && typeof x.content === "string"
  );
}

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

function buildSystemPrompt(): string {
  return `Você é um Staff Engineer conduzindo um Post-Mortem de um projeto de engenharia recém-aprovado. Analise o código final e o histórico de chat do usuário.
FORMATO EXATO (JSON PURO):
{
"executive_summary": "Resumo de 2 linhas do desafio superado.",
"wrong_paths_taken": ["Erro conceitual ou tentativa falha que o usuário teve no chat"],
"mental_model_shift": "A correção de rota que permitiu o sucesso.",
"spaced_repetition_tags": ["Tag1", "Tag2"]
}

REGRAS DE SAÍDA: Retorne APENAS um objeto JSON válido. Não adicione nenhum texto antes ou depois. Não use blocos de código (\`\`\`).`;
}

export async function POST(req: Request) {
  let body: RetrospectiveRequestBody;
  try {
    body = (await req.json()) as RetrospectiveRequestBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const { finalCode, transcript } = body;

  if (typeof finalCode !== "string" || !finalCode.trim()) {
    return NextResponse.json(
      { error: "Campo 'finalCode' deve ser uma string não vazia." },
      { status: 400 },
    );
  }

  if (!Array.isArray(transcript) || transcript.length === 0) {
    return NextResponse.json(
      { error: "Campo 'transcript' deve ser um array não vazio de mensagens." },
      { status: 400 },
    );
  }

  const normalized: TranscriptMessage[] = [];
  for (const m of transcript) {
    if (!isTranscriptMessage(m)) {
      return NextResponse.json(
        { error: "Campo 'transcript' contém mensagens em formato inválido." },
        { status: 400 },
      );
    }
    if (m.content.trim()) normalized.push({ role: m.role, content: m.content });
  }

  if (normalized.length === 0) {
    return NextResponse.json(
      { error: "Campo 'transcript' não contém conteúdo útil." },
      { status: 400 },
    );
  }

  const systemContent = buildSystemPrompt();
  const userContent = `CÓDIGO FINAL APROVADO:\n\n${finalCode.trim()}\n\nTRANSCRIPT CONSOLIDADO:\n\n${JSON.stringify(
    normalized,
    null,
    2,
  )}`;

  try {
    const lmRes = await fetch(LMSTUDIO_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "local-model",
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: userContent },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    if (!lmRes.ok) {
      const errText = await lmRes.text().catch(() => "");
      return NextResponse.json(
        {
          error: `LMStudio respondeu com status ${lmRes.status}.${errText ? ` ${errText.slice(0, 200)}` : ""}`,
        },
        { status: 502 },
      );
    }

    let data: unknown;
    try {
      data = await lmRes.json();
    } catch {
      return NextResponse.json(
        { error: "Resposta do LMStudio não é JSON válido." },
        { status: 502 },
      );
    }

    const rawContent = extractAssistantContent(data);
    if (rawContent === null || rawContent === "") {
      return NextResponse.json(
        { error: "LMStudio não retornou conteúdo de assistente." },
        { status: 502 },
      );
    }

    let parsed: unknown;
    try {
      parsed = parseJsonObjectFromLlmText(rawContent);
    } catch {
      return NextResponse.json(
        {
          error:
            "Não foi possível interpretar o post-mortem. Tente novamente em alguns instantes.",
        },
        { status: 500 },
      );
    }

    if (!isRetrospective(parsed)) {
      return NextResponse.json(
        {
          error:
            "A resposta do post-mortem veio em formato inesperado. Tente novamente.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(parsed);
  } catch (err) {
    if (isConnectionRefused(err)) {
      return NextResponse.json(
        {
          error:
            "Mentor offline. Verifique se o LMStudio está rodando na porta 1234.",
        },
        { status: 503 },
      );
    }

    const message = err instanceof Error ? err.message : "Erro desconhecido.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

