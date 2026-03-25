import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ForgeAliasPage({ params }: PageProps) {
  const { projectId } = await params;
  redirect(`/workspace/${projectId}`);
}
