import { NextResponse } from "next/server";
import { parseJsonObjectFromLlmText } from "@/lib/extract-json-from-llm";
import { isReviewVerdict } from "@/lib/review-verdict";

const LMSTUDIO_URL = "http://127.0.0.1:1234/v1/chat/completions";

type ReviewRequestBody = {
  submission?: unknown;
  dod?: unknown;
};

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

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

function buildQaSystemPrompt(dodLines: string[]): string {
  const dodBlock = dodLines.map((line, i) => `${i + 1}. ${line}`).join("\n");
  return `Você é um Staff Engineer de QA. Avalie o código submetido contra os seguintes requisitos (DoD):

${dodBlock}

REGRAS DE SAÍDA: Retorne APENAS um objeto JSON válido. Não adicione nenhum texto antes ou depois. Não use blocos de código (\`\`\`).
FORMATO EXATO: { "isApproved": boolean, "feedback": "Seu feedback direto e profissional", "failedRequirements": ["Lista de itens do DoD não atendidos, ou vazio se aprovado"] }`;
}

export async function POST(req: Request) {
  let body: ReviewRequestBody;
  try {
    body = (await req.json()) as ReviewRequestBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const { submission, dod } = body;

  if (typeof submission !== "string" || !submission.trim()) {
    return NextResponse.json(
      { error: "Campo 'submission' deve ser uma string não vazia." },
      { status: 400 },
    );
  }

  if (!isStringArray(dod) || dod.length === 0) {
    return NextResponse.json(
      { error: "Campo 'dod' deve ser um array não vazio de strings." },
      { status: 400 },
    );
  }

  const systemContent = buildQaSystemPrompt(dod);
  const userContent = `Código submetido para revisão:\n\n${submission.trim()}`;

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
        temperature: 0.1,
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
            "Não foi possível interpretar a avaliação do QA. Tente submeter novamente em alguns instantes.",
        },
        { status: 500 },
      );
    }

    if (!isReviewVerdict(parsed)) {
      return NextResponse.json(
        {
          error:
            "A resposta do QA veio em formato inesperado. Tente submeter novamente.",
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
