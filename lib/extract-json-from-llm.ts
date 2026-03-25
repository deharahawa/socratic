/**
 * Extrai o primeiro bloco JSON objeto da resposta do modelo (primeiro `{` até o último `}`).
 * Útil quando o LMStudio envolve o JSON em texto ou markdown.
 */
export function parseJsonObjectFromLlmText(raw: string): unknown {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Nenhum objeto JSON encontrado na resposta do modelo.");
  }
  const slice = raw.slice(start, end + 1);
  return JSON.parse(slice) as unknown;
}
