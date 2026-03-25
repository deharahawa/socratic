import { ChaosRadar } from "@/components/dashboard/ChaosRadar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Heatmap } from "@/components/dashboard/Heatmap";
import { QuestMap } from "@/components/dashboard/QuestMap";
import { SustainableMomentum } from "@/components/dashboard/SustainableMomentum";
import {
  buildArchitectHeatmapMock,
  dashboardUserMock,
  greenfieldProjectsMock,
  sustainableMomentumMock,
} from "@/lib/dashboard-mock-data";

export default function DashboardPage() {
  const heatmapDays = buildArchitectHeatmapMock();

  return (
    <div className="min-h-screen bg-[#050505] bg-forge-radial">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
          <div className="lg:col-span-12">
            <DashboardHeader user={dashboardUserMock} />
          </div>

          <div className="lg:col-span-8 lg:row-span-2">
            <Heatmap days={heatmapDays} />
          </div>

          <div className="lg:col-span-4">
            <SustainableMomentum
              consecutiveWorkDays={sustainableMomentumMock.consecutiveWorkDays}
            />
          </div>

          <div className="lg:col-span-4">
            <ChaosRadar />
          </div>

          <div className="lg:col-span-12">
            <QuestMap projects={greenfieldProjectsMock} />
          </div>
        </div>
      </main>
    </div>
  );
}
