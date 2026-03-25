import { IncidentNocShell } from "@/components/incident/IncidentNocShell";

type PageProps = {
  params: Promise<{ incidentId: string }>;
};

export default async function IncidentNocPage({ params }: PageProps) {
  const { incidentId } = await params;
  return <IncidentNocShell incidentId={incidentId} />;
}

