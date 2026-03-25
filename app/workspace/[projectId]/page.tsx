import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

type PageProps = {
  params: Promise<{ projectId: string }>;
  searchParams?: Promise<{ userId?: string; questId?: string }>;
};

export default async function WorkspacePage({ params, searchParams }: PageProps) {
  const { projectId } = await params;
  const sp = searchParams ? await searchParams : {};

  return (
    <WorkspaceShell
      projectId={projectId}
      userId={sp.userId}
      questId={sp.questId}
    />
  );
}
