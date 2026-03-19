export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg-primary/80 backdrop-blur-md">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-accent-blue/20 rounded-2xl"></div>
        <div className="absolute inset-0 border-4 border-accent-blue border-t-transparent rounded-2xl animate-spin shadow-glow-blue"></div>
      </div>
      <div className="mt-6 flex flex-col items-center gap-2">
        <h2 className="text-xl font-display font-800 text-text-primary tracking-tight animate-pulse">Syncing Marketplace</h2>
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    </div>
  );
}
