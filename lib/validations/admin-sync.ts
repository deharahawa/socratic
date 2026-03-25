import { z } from "zod";

const nonEmptyString = z
  .string({ error: "Deve ser uma string." })
  .trim()
  .min(1, "Campo obrigatorio.");

const questSyncSchema = z.object({
  title: nonEmptyString,
  big_picture: nonEmptyString,
  architect_mindset: nonEmptyString,
  definition_of_done: z
    .array(nonEmptyString, { error: "definition_of_done deve ser um array." })
    .min(1, "definition_of_done deve ter ao menos um item."),
});

export const projectSyncSchema = z.object({
  title: nonEmptyString,
  description: nonEmptyString,
  base_xp: z
    .number({ error: "base_xp deve ser um numero." })
    .int("base_xp deve ser inteiro.")
    .nonnegative("base_xp deve ser maior ou igual a zero."),
  core_concepts: z
    .array(nonEmptyString, { error: "core_concepts deve ser um array." })
    .min(1, "core_concepts deve ter ao menos um item."),
  quests: z
    .array(questSyncSchema, { error: "quests deve ser um array." })
    .min(1, "Ao menos uma quest e obrigatoria."),
});

export const incidentSyncSchema = z.object({
  title: nonEmptyString,
  severity: nonEmptyString,
  user_report: nonEmptyString,
  system_logs: nonEmptyString,
});

export const adminSyncRequestSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("PROJECT"),
    payload: projectSyncSchema,
  }),
  z.object({
    type: z.literal("INCIDENT"),
    payload: incidentSyncSchema,
  }),
]);

export type ProjectSyncInput = z.infer<typeof projectSyncSchema>;
export type IncidentSyncInput = z.infer<typeof incidentSyncSchema>;
export type AdminSyncRequestInput = z.infer<typeof adminSyncRequestSchema>;
