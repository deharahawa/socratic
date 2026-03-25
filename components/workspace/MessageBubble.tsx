"use client";

import { Clipboard } from "lucide-react";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Components } from "react-markdown";
import { QUEST_PHASE_THEMES, type QuestPhase } from "@/lib/quest-phase";

export type { QuestPhase };

type MessageBubbleProps = {
  role: "user" | "assistant";
  content: string;
  /** Fase atual da quest — define cores do “chapéu” do Mentor nas bolhas da IA */
  questPhase?: QuestPhase;
  /** Bolha de erro (ex.: Mentor offline) */
  isError?: boolean;
  /** Sobrescreve classes da bolha do Mentor (modo debugger, etc.) */
  assistantClassName?: string;
};

function CodeBlockWithHeader({
  language,
  code,
}: {
  language: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const label = (language || "text").toLowerCase();

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-zinc-700/80 bg-[#1e1e1e]">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-700/80 bg-zinc-800/90 px-3 py-1.5">
        <span className="font-mono text-xs text-zinc-400">{label}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs text-zinc-300 transition hover:bg-zinc-700/80 hover:text-zinc-100"
          aria-label="Copiar código"
        >
          <Clipboard className="size-3.5 shrink-0 opacity-80" />
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <SyntaxHighlighter
        language={label === "text" ? "text" : label}
        style={vscDarkPlus}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: "0.75rem 1rem",
          borderRadius: 0,
          background: "#1e1e1e",
          fontSize: "0.8125rem",
          lineHeight: 1.55,
        }}
        codeTagProps={{
          style: {
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

const baseMarkdown =
  "prose prose-invert prose-sm max-w-none prose-p:my-2 prose-p:text-zinc-200 prose-headings:text-zinc-100 prose-strong:text-zinc-100 prose-ul:my-2 prose-ol:my-2";

export function MessageBubble({
  role,
  content,
  questPhase = "DISCOVERY",
  isError = false,
  assistantClassName,
}: MessageBubbleProps) {
  const components: Components = useMemo(
    () => ({
      code(props) {
        const { children, className, ...rest } = props;
        const match = /language-(\w+)/.exec(className || "");
        const codeString = String(children).replace(/\n$/, "");

        if (match) {
          return <CodeBlockWithHeader language={match[1]} code={codeString} />;
        }

        return (
          <code
            {...rest}
            className="rounded bg-zinc-800/90 px-1 py-0.5 font-mono text-[0.8125rem] text-forge-xp"
          >
            {children}
          </code>
        );
      },
    }),
    [],
  );

  if (role === "user") {
    return (
      <div className="flex w-full justify-end">
        <div
          className={
            "max-w-[min(100%,42rem)] rounded-lg border-r-2 border-forge-xp bg-zinc-900/50 px-4 py-3 text-left shadow-sm " +
            baseMarkdown
          }
        >
          <ReactMarkdown components={components}>{content}</ReactMarkdown>
        </div>
      </div>
    );
  }

  const t = QUEST_PHASE_THEMES[questPhase];
  const assistantStyle = assistantClassName ?? `${t.assistantBorder} ${t.assistantBg}`;

  if (isError) {
    return (
      <div className="flex w-full justify-start">
        <div
          className={
            "max-w-[min(100%,42rem)] rounded-lg border-l-2 border-red-500/80 bg-red-950/25 px-4 py-3 text-left shadow-sm " +
            baseMarkdown
          }
        >
          <ReactMarkdown components={components}>{content}</ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-start">
      <div
        className={
          `max-w-[min(100%,42rem)] rounded-lg ${assistantStyle} px-4 py-3 text-left shadow-sm ` +
          baseMarkdown
        }
      >
        <ReactMarkdown components={components}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
