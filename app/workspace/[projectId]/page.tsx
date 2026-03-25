import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function WorkspacePage({ params }: PageProps) {
  const { projectId } = await params;

  return <WorkspaceShell projectId={projectId} />;
}
