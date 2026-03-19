"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ExternalLink, X, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ExternalLinkHandler() {
  const [showModal, setShowModal] = useState(false);
  const [targetUrl, setTargetUrl] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Don't show confirmation on the landing page as requested
      if (pathname === "/") return;

      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (anchor && anchor.href && anchor.target === "_blank") {
        const url = new URL(anchor.href);
        const isExternal = url.hostname !== window.location.hostname;

        if (isExternal) {
          e.preventDefault();
          setTargetUrl(anchor.href);
          setShowModal(true);
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-bg-card border border-border-default rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center mx-auto shadow-glow-blue/10 text-accent-blue">
            <ShieldAlert size={32} />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-display font-800 text-text-primary tracking-tight">External Link Detected</h3>
            <p className="text-text-muted text-sm leading-relaxed font-body opacity-80">
              You are about to leave <span className="text-accent-blue font-700">HTWTH Analytics</span>. 
              We are not responsible for the content or security of external websites.
            </p>
          </div>

          <div className="bg-bg-secondary/50 border border-border-subtle rounded-2xl p-4 truncate text-xs font-mono text-text-secondary select-all">
            {targetUrl}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button 
              onClick={() => setShowModal(false)}
              className="flex-1 px-6 py-4 rounded-2xl bg-bg-elevated border border-border-default text-text-primary font-700 hover:bg-bg-secondary transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <X size={18} /> Cancel
            </button>
            <button 
              onClick={() => {
                window.open(targetUrl, "_blank", "noopener,noreferrer");
                setShowModal(false);
              }}
              className="flex-1 px-6 py-4 rounded-2xl bg-accent-blue text-white font-800 hover:bg-accent-blue/90 shadow-glow-blue transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Continue <ExternalLink size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
