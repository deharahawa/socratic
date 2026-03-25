import { NextResponse } from "next/server";
import type { QuestPhase } from "@/lib/quest-phase";

const LMSTUDIO_URL = "http://127.0.0.1:1234/v1/chat/completions";

type ChatMessage = { role: string; content: string };

type ChatRequestBody = {
  messages?: unknown;
  phase?: unknown;
  context?: unknown;
};

function systemPromptForPhase(phase: QuestPhase): string {
  switch (phase) {
    case "DISCOVERY":
      return "Você é um Arquiteto de Software Sênior. Ajude o usuário a modelar o problema através do método socrático. Faça perguntas investigativas. NUNCA escreva código nesta fase.";
    case "HANDS_ON":
      return "Você é um Pair Programmer Sênior. O usuário está codando em Go. Revise o código, aponte erros de concorrência ou sintaxe, mas evite reescrever a função inteira por ele.";
    case "VALIDATION":
      return "Você é um Engenheiro de QA rigoroso. Avalie estritamente se a lógica atende aos requisitos. Seja direto e binário.";
    case "DONE":
      return "A quest foi concluída. Ofereça um fechamento breve e positivo; evite introduzir novos tópicos técnicos extensos.";
    default:
      return "Você é um mentor técnico. Responda de forma clara e útil.";
  }
}

function isChatMessageArray(v: unknown): v is ChatMessage[] {
  if (!Array.isArray(v)) return false;
  return v.every(
    (item) =>
      item !== null &&
      typeof item === "object" &&
      typeof (item as ChatMessage).role === "string" &&
      typeof (item as ChatMessage).content === "string",
  );
}

function isQuestPhase(v: unknown): v is QuestPhase {
  return (
    v === "DISCOVERY" ||
    v === "HANDS_ON" ||
    v === "VALIDATION" ||
    v === "DONE"
  );
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

export async function POST(req: Request) {
  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const { messages, phase, context } = body;

  if (!isChatMessageArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "Campo 'messages' deve ser um array não vazio de { role, content }." },
      { status: 400 },
    );
  }

  if (!isQuestPhase(phase)) {
    return NextResponse.json(
      { error: "Campo 'phase' inválido ou ausente." },
      { status: 400 },
    );
  }

  let contextBlock = "";
  if (context && typeof context === "object") {
    try {
      contextBlock = `\n\nContexto da quest (JSON):\n${JSON.stringify(context)}`;
    } catch {
      contextBlock = "";
    }
  }

  const systemContent = systemPromptForPhase(phase) + contextBlock;
  const messagesForModel: ChatMessage[] = [
    { role: "system", content: systemContent },
    ...messages,
  ];

  try {
    const lmRes = await fetch(LMSTUDIO_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "local-model",
        messages: messagesForModel,
        temperature: 0.3,
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

    const content = extractAssistantContent(data);
    if (content === null || content === "") {
      return NextResponse.json(
        { error: "LMStudio não retornou conteúdo de assistente." },
        { status: 502 },
      );
    }

    return NextResponse.json({ content });
  } catch (err) {
    if (isConnectionRefused(err)) {
      return NextResponse.json(
        {
          error:
            "Erro: Mentor Offline. Verifique se o LMStudio está rodando na porta 1234.",
        },
        { status: 503 },
      );
    }

    const message = err instanceof Error ? err.message : "Erro desconhecido.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
