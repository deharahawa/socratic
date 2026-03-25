"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { QuestStatus } from "@prisma/client";

type CompleteQuestInput = {
  userId: string;
  questId: string;
};

export async function completeQuest({ userId, questId }: CompleteQuestInput) {
  if (!userId.trim()) throw new Error("userId inválido.");
  if (!questId.trim()) throw new Error("questId inválido.");

  await prisma.$transaction(async (tx) => {
    const progress = await tx.userQuestProgress.findUnique({
      where: { userId_questId: { userId, questId } },
    });

    if (!progress) {
      throw new Error("Progresso da quest não encontrado para este usuário.");
    }

    if (progress.status === QuestStatus.COMPLETED) {
      return;
    }

    const quest = await tx.quest.findUnique({
      where: { id: questId },
      include: { project: true },
    });

    if (!quest) {
      throw new Error("Quest não encontrada.");
    }

    const awardXp = quest.project.base_xp;
    const concept_tag = quest.project.core_concepts[0] ?? "General";
    const reason = `Quest concluída: ${quest.title}`;

    await tx.userQuestProgress.update({
      where: { userId_questId: { userId, questId } },
      data: { status: QuestStatus.COMPLETED },
    });

    await tx.user.update({
      where: { id: userId },
      data: { total_xp: { increment: awardXp } },
    });

    await tx.xP_Log.create({
      data: {
        userId,
        amount: awardXp,
        reason,
        concept_tag,
      },
    });
  });

  revalidatePath("/dashboard");
}

