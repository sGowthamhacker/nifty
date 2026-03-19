import StocksTable from "@/components/dashboard/StocksTable";

export default function StocksPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display font-800 text-2xl text-text-primary tracking-tight">Nifty 50 Stocks</h1>
        <p className="text-text-muted text-sm mt-1">All 50 index constituents — live prices, click to expand full details</p>
      </div>
      <StocksTable />
    </div>
  );
}
