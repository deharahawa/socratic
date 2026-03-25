/**
 * Dados mockados alinhados ao Prisma (User, Project, Quest, XP_Log, ProjectType).
 * Substituir por queries reais nas slices seguintes.
 */

export type MockUser = {
  displayName: string;
  total_xp: number;
  compute_credits: number;
};

export type HeatmapDay = {
  /** Data local (meia-noite) */
  date: Date;
  /** concept_tag do XP_Log dominante no dia; null = sem contribuição */
  concept_tag: string | null;
};

export type MockGreenfieldProject = {
  id: string;
  title: string;
  description: string;
  base_xp: number;
  core_concepts: string[];
  type: "GREENFIELD";
  questsTotal: number;
  questsCompleted: number;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Padrão determinístico: ~40% dos dias com atividade, tags rotacionando. */
export function buildArchitectHeatmapMock(now: Date = new Date()): HeatmapDay[] {
  const today = startOfLocalDay(now);
  const out: HeatmapDay[] = [];
  const tags = ["Go", "Arquitetura", "DB"] as const;

  for (let offset = 89; offset >= 0; offset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - offset);
    const seed = date.getFullYear() * 372 + date.getMonth() * 31 + date.getDate();
    const active = seed % 5 !== 0 && seed % 7 !== 0;
    const concept_tag = active ? tags[seed % tags.length] : null;
    out.push({ date: startOfLocalDay(date), concept_tag });
  }
  return out;
}

export const dashboardUserMock: MockUser = {
  displayName: "Arquiteto",
  total_xp: 12_450,
  compute_credits: 320,
};

export const sustainableMomentumMock = {
  consecutiveWorkDays: 12,
};

export const greenfieldProjectsMock: MockGreenfieldProject[] = [
  {
    id: "proj_api_gateway",
    title: "API Gateway resiliente",
    description: "Projeto GREENFIELD — rate limiting, observabilidade e contratos.",
    base_xp: 800,
    core_concepts: ["Go", "Arquitetura", "DB"],
    type: "GREENFIELD",
    questsTotal: 8,
    questsCompleted: 3,
  },
  {
    id: "proj_event_mesh",
    title: "Mesh de eventos corporativo",
    description: "Padrões outbox, idempotência e sagas leves.",
    base_xp: 1200,
    core_concepts: ["Arquitetura", "DB"],
    type: "GREENFIELD",
    questsTotal: 10,
    questsCompleted: 7,
  },
  {
    id: "proj_obs_stack",
    title: "Stack de observabilidade",
    description: "Tracing, métricas RED e SLOs acionáveis.",
    base_xp: 600,
    core_concepts: ["Go", "DB"],
    type: "GREENFIELD",
    questsTotal: 6,
    questsCompleted: 1,
  },
];

export function formatISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
