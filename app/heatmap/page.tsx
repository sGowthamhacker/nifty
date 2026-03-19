import MarketHeatmap from "@/components/heatmap/MarketHeatmap";

export const metadata = {
  title: "Market Heatmap | NIFTY 50",
  description: "Visual heat map of the NIFTY 50 stock performance.",
};

export default function HeatmapPage() {
  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="font-display font-800 text-3xl text-text-primary tracking-tight">Market Heatmap</h1>
        <p className="text-text-muted text-sm">Visualizing performance across the NIFTY 50 index constituents</p>
      </div>
      <MarketHeatmap />
    </div>
  );
}
