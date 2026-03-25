"use client";

import { Bold, Braces, Italic, Loader2, Send } from "lucide-react";
import { useRef } from "react";
import TextareaAutosize from "react-textarea-autosize";

type WorkspaceChatInputProps = {
  value: string;
  onChange: (next: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
};

function applyEdit(
  textarea: HTMLTextAreaElement,
  value: string,
  onChange: (next: string) => void,
  start: number,
  end: number,
  insertion: string,
  selectStart?: number,
  selectEnd?: number,
) {
  const next = value.slice(0, start) + insertion + value.slice(end);
  onChange(next);
  const focus = () => {
    textarea.focus();
    const s = selectStart ?? start + insertion.length;
    const e = selectEnd ?? s;
    textarea.setSelectionRange(s, e);
  };
  requestAnimationFrame(focus);
}

function wrapSelectionOrInsert(
  textarea: HTMLTextAreaElement,
  value: string,
  onChange: (next: string) => void,
  wrap: string,
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end);

  if (selected.length > 0) {
    const insertion = `${wrap}${selected}${wrap}`;
    applyEdit(textarea, value, onChange, start, end, insertion, start + wrap.length, end + wrap.length);
    return;
  }

  const insertion = `${wrap}${wrap}`;
  const mid = start + wrap.length;
  applyEdit(textarea, value, onChange, start, end, insertion, mid, mid);
}

export function WorkspaceChatInput({
  value,
  onChange,
  onSend,
  placeholder = "Mensagem ao Mentor… (Shift+Enter nova linha)",
  disabled = false,
  isLoading = false,
}: WorkspaceChatInputProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const busy = disabled || isLoading;

  const insertGoFence = () => {
    const el = taRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const snippet = "```go\n\n```";
    applyEdit(el, value, onChange, start, end, snippet, start + 6, start + 6);
  };

  const onBold = () => {
    const el = taRef.current;
    if (!el) return;
    wrapSelectionOrInsert(el, value, onChange, "**");
  };

  const onItalic = () => {
    const el = taRef.current;
    if (!el) return;
    wrapSelectionOrInsert(el, value, onChange, "*");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!busy && value.trim()) onSend();
    }
  };

  const handleSendClick = () => {
    if (!busy && value.trim()) onSend();
  };

  return (
    <div className="border-t border-zinc-800/90 bg-[#080808] px-3 py-2">
      <div className="mb-2 flex items-center gap-1">
        <span className="mr-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          Dev
        </span>
        <button
          type="button"
          onClick={onBold}
          disabled={busy}
          className="rounded p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-40"
          title="Negrito (markdown)"
          aria-label="Inserir negrito"
        >
          <Bold className="size-4" strokeWidth={2.25} />
        </button>
        <button
          type="button"
          onClick={onItalic}
          disabled={busy}
          className="rounded p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-40"
          title="Itálico (markdown)"
          aria-label="Inserir itálico"
        >
          <Italic className="size-4" strokeWidth={2.25} />
        </button>
        <button
          type="button"
          onClick={insertGoFence}
          disabled={busy}
          className="rounded p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-40"
          title="Bloco de código Go"
          aria-label="Inserir bloco de código Go"
        >
          <Braces className="size-4" strokeWidth={2.25} />
        </button>
      </div>
      <div className="flex gap-2">
        <TextareaAutosize
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          minRows={1}
          maxRows={10}
          disabled={busy}
          placeholder={placeholder}
          aria-busy={isLoading}
          className="scrollbar-dark min-w-0 flex-1 resize-none rounded-md border border-zinc-800 bg-[#0c0c0c] px-3 py-2 font-mono text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
        />
        <button
          type="button"
          onClick={handleSendClick}
          disabled={busy || !value.trim()}
          className="mt-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800/80 text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-700/80 disabled:cursor-not-allowed disabled:opacity-40"
          title={isLoading ? "Digitando…" : "Enviar"}
          aria-label={isLoading ? "Aguardando resposta do mentor" : "Enviar mensagem"}
        >
          {isLoading ? (
            <Loader2 className="size-5 animate-spin text-zinc-300" aria-hidden />
          ) : (
            <Send className="size-5" aria-hidden />
          )}
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-zinc-600">
        {isLoading ? (
          <span className="text-zinc-500">Digitando…</span>
        ) : (
          <>
            Enter envia · Shift+Enter quebra linha · ideal para colar blocos grandes
          </>
        )}
      </p>
    </div>
  );
}
