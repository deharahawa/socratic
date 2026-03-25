import { ProjectType } from "@prisma/client";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ZodIssue } from "zod";
import { prisma } from "@/lib/prisma";
import { adminSyncRequestSchema } from "@/lib/validations/admin-sync";

function formatIssue(issue: ZodIssue): string {
  const path = issue.path.length ? issue.path.join(".") : "body";
  return `${path}: ${issue.message}`;
}

export async function POST(req: Request) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      {
        error: "JSON invalido.",
        issues: ["body: payload precisa ser JSON valido."],
      },
      { status: 400 },
    );
  }

  const parsed = adminSyncRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Payload invalido.",
        issues: parsed.error.issues.map(formatIssue),
      },
      { status: 400 },
    );
  }

  try {
    if (parsed.data.type === "PROJECT") {
      const { payload } = parsed.data;
      const created = await prisma.$transaction(async (tx) => {
        const project = await tx.project.create({
          data: {
            title: payload.title,
            description: payload.description,
            base_xp: payload.base_xp,
            core_concepts: payload.core_concepts,
            type: ProjectType.GREENFIELD,
          },
        });

        if (payload.quests.length > 0) {
          await tx.quest.createMany({
            data: payload.quests.map((quest, index) => ({
              title: quest.title,
              projectId: project.id,
              big_picture: quest.big_picture,
              architect_mindset: quest.architect_mindset,
              definition_of_done: quest.definition_of_done,
              order: index + 1,
            })),
          });
        }

        return project;
      });

      revalidatePath("/dashboard");

      return NextResponse.json(
        {
          ok: true,
          type: parsed.data.type,
          projectId: created.id,
          message: "Projeto sincronizado com sucesso.",
        },
        { status: 201 },
      );
    }

    const { payload } = parsed.data;
    const created = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          title: payload.title,
          description: payload.user_report,
          base_xp: 0,
          core_concepts: [],
          type: ProjectType.INCIDENT,
        },
      });

      await tx.incidentData.create({
        data: {
          projectId: project.id,
          severity: payload.severity,
          user_report: payload.user_report,
          system_logs: payload.system_logs,
        },
      });

      return project;
    });

    revalidatePath("/dashboard");

    return NextResponse.json(
      {
        ok: true,
        type: parsed.data.type,
        projectId: created.id,
        message: "Incidente sincronizado com sucesso.",
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro interno ao sincronizar.";
    return NextResponse.json(
      {
        error: "Falha ao persistir dados.",
        issues: [message],
      },
      { status: 500 },
    );
  }
}
