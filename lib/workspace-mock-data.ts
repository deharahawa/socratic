import type { QuestPhase } from "@/lib/quest-phase";

export const workspaceQuestMock = {
  title: "Greenfield API — contratos e idempotência",
  big_picture:
    "Você está desenhando um serviço de ingestão de eventos que precisa ser seguro sob retries e falhas parciais. O objetivo não é apenas 'fazer passar nos testes', mas garantir que o sistema se comporte de forma previsível quando a rede e os clientes forem hostis.",
  architect_mindset:
    "Pense em fronteiras claras (DTO vs domínio), invariantes que não podem ser violadas e como observabilidade barata hoje evita caos amanhã. Documente pressupostos; questione o que acontece se duas requisições idênticas chegarem em ordem invertida.",
  /** Definition of Done — enviado ao endpoint /api/review na fase VALIDATION. */
  definition_of_done: [
    "Dedupe explícito por `request_id` antes de persistir o evento (sem duplicar registros).",
    "Comportamento definido quando a gravação do evento falha após o dedupe ter sido aplicado.",
    "Respostas de erro distinguíveis de sucesso idempotente (sem estado ambíguo para o cliente).",
  ],
} as const;

export type WorkspaceMockMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Fase narrativa da mensagem (opcional); a UI usa a fase global da quest para o “chapéu”. */
  phase?: QuestPhase;
  /** Erro de API / rede exibido como bolha do mentor */
  isError?: boolean;
};

export const workspaceInitialMessagesMock: WorkspaceMockMessage[] = [
  {
    id: "m1",
    role: "assistant",
    phase: "DISCOVERY",
    content:
      "Antes de codar, **que invariante** você quer garantir com a idempotência? Descreva o fluxo em 2–3 frases.",
  },
  {
    id: "m2",
    role: "user",
    content:
      "Quero que o mesmo `request_id` não gere dois registros. Segue um rascunho em Go:\n\n```go\npackage main\n\nfunc HandleIngest(req Request) error {\n    // TODO: dedupe por request_id\n    return nil\n}\n```",
  },
  {
    id: "m3",
    role: "assistant",
    phase: "HANDS_ON",
    content:
      "Boa. Um caminho é usar uma tabela de dedupe ou lock otimista. Exemplo de esqueleto:\n\n```go\nfunc (s *Service) Ingest(ctx context.Context, req Request) error {\n    if err := s.store.InsertDedupe(ctx, req.RequestID); err != nil {\n        if errors.Is(err, ErrDuplicate) {\n            return nil // idempotente\n        }\n        return err\n    }\n    return s.store.SaveEvent(ctx, req)\n}\n```\n\nO que acontece se `InsertDedupe` commitar e `SaveEvent` falhar?",
  },
];
