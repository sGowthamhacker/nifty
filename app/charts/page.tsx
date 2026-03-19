import { Suspense } from "react";
import AdvancedChartPage from "@/components/charts/AdvancedChartPage";

export default function ChartsPage() {
  return (
    <Suspense fallback={<div className="h-full w-full flex items-center justify-center bg-bg-primary text-text-muted">Loading Charts...</div>}>
      <AdvancedChartPage />
    </Suspense>
  );
}
