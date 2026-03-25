const { PrismaClient } = require("@prisma/client");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const delayMs = 15000 + Math.floor(Math.random() * 5000);
    await sleep(delayMs);

    let project = await prisma.project.findFirst({
      where: { type: "INCIDENT" },
      select: { id: true },
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          title: "Chaos Sandbox",
          description:
            "Projeto interno para simular incidentes em background (Chaos Engine).",
          base_xp: 250,
          core_concepts: ["observability", "incident-response", "concurrency"],
          type: "INCIDENT",
        },
        select: { id: true },
      });
    }

    await prisma.incidentData.create({
      data: {
        projectId: project.id,
        severity: "SEV-1",
        user_report: "Alertas de CPU em 100% no cluster de processamento de pagamentos.",
        system_logs:
          "fatal error: all goroutines are asleep - deadlock!\n\n" +
          "goroutine 1 [semacquire]:\n" +
          "sync.runtime_Semacquire(0xc000094018)\n" +
          "...",
      },
    });
  } finally {
    try {
      await prisma.$disconnect();
    } catch {
      // ignore
    }
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });

