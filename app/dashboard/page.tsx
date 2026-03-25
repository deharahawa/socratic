import Link from "next/link";
import { ProjectType } from "@prisma/client";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Heatmap } from "@/components/dashboard/Heatmap";
import { QuestMap } from "@/components/dashboard/QuestMap";
import { SustainableMomentum } from "@/components/dashboard/SustainableMomentum";
import { AppBreadcrumb } from "@/components/navigation/AppBreadcrumb";
import { prisma } from "@/lib/prisma";
import {
  buildArchitectHeatmapMock,
  dashboardUserMock,
  type MockGreenfieldProject,
  sustainableMomentumMock,
} from "@/lib/dashboard-mock-data";

export const dynamic = "force-dynamic";

async function getGreenfieldProjects(): Promise<MockGreenfieldProject[]> {
  const projects = await prisma.project.findMany({
    where: { type: ProjectType.GREENFIELD },
    include: {
      _count: {
        select: { quests: true },
      },
    },
  });

  return projects.map((project) => ({
    id: project.id,
    title: project.title,
    description: project.description,
    base_xp: project.base_xp,
    core_concepts: project.core_concepts,
    type: "GREENFIELD",
    questsTotal: project._count.quests,
    questsCompleted: 0,
  }));
}

export default async function DashboardPage() {
  const heatmapDays = buildArchitectHeatmapMock();
  const greenfieldProjects = await getGreenfieldProjects();

  return (
    <div className="min-h-screen bg-[#050505] bg-forge-radial">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-4">
          <AppBreadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Modo Arquiteto AI" },
              { label: "Dashboard" },
            ]}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
          <div className="lg:col-span-12">
            <DashboardHeader user={dashboardUserMock} />
          </div>

          <div className="lg:col-span-8">
            <QuestMap projects={greenfieldProjects} />
          </div>

          <div className="space-y-4 lg:col-span-4 lg:self-start">
            <SustainableMomentum
              consecutiveWorkDays={sustainableMomentumMock.consecutiveWorkDays}
            />
            <Heatmap days={heatmapDays} compact />
            <section className="rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-5 backdrop-blur-md">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-red-200/85">
                Chaos / NOC
              </p>
              <h2 className="mt-2 text-base font-semibold text-zinc-100">
                Modo de resposta a incidentes
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Entre no fluxo NOC para investigar incidentes com contexto de logs
                e suporte do mentor em modo debug.
              </p>
              <Link
                href="/incident/sev2-local"
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-red-700/40 bg-[#0b0b0b] px-4 py-3 text-sm font-semibold text-red-200 transition hover:border-red-600/50 hover:bg-red-950/20 hover:text-red-100"
              >
                Abrir Modo Chaos/NOC
              </Link>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
