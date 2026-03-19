"use client";
import { useState } from "react";
import Link from "next/link";
import { TrendingUp, Globe, Mail, Phone, MapPin, X, Github, Linkedin, Instagram, Send, ChevronDown, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function Footer({ variant = "full" }: { variant?: "full" | "minimal" }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showApps, setShowApps] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("newsletter_subscribers").insert([{ email }]);
      if (error) {
        if (error.code === '23505') toast.success("You are already subscribed!");
        else throw error;
      } else {
        toast.success("Welcome! You've joined the club.");
        setEmail("");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isMinimal = variant === "minimal";

  // Dynamic Version Logic: now 5.5 (March 2026). Increments 0.1 every 2 months. 
  const getDynamicVersion = () => {
    const baseVersion = 5.5;
    const baseYear = 2026;
    const baseMonth = 2; // March is 2 (0-indexed)
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const totalMonthsSinceBase = (currentYear - baseYear) * 12 + (currentMonth - baseMonth);
    const increments = Math.floor(totalMonthsSinceBase / 2);
    
    if (increments <= 0) return baseVersion.toFixed(1);
    return (baseVersion + increments * 0.1).toFixed(1);
  };

  const version = getDynamicVersion();

  return (
    <footer className={cn(
      "relative z-10 border-t border-border-subtle bg-bg-secondary/80 px-4 sm:px-6 mt-auto overflow-hidden",
      isMinimal ? "py-3 md:py-3" : "pt-10 sm:pt-12 pb-8 sm:pb-10"
    )}>
      {!isMinimal && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 text-center sm:text-left mb-8 sm:mb-10">
          {/* Brand Section */}
          <div className="space-y-5 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center border border-accent-blue/30 shadow-glow-blue/10">
                <TrendingUp size={18} className="text-accent-blue" />
              </div>
              <span className="font-display font-800 text-2xl text-text-primary tracking-tight uppercase">Nifty 50</span>
            </div>
            <p className="text-text-muted text-sm leading-relaxed max-w-sm mx-auto sm:mx-0 font-body opacity-80">
              The ultimate ecosystem for market intelligence and professional analytics. 
              Providing the tools you need to succeed in the Indian markets with real-time accuracy.
            </p>
            <div className="flex items-center gap-4 justify-center sm:justify-start text-text-muted">
              <a href="https://x.com/hackers_00?t=7NOXZfGHFA37-FPR-iaraA&s=09" target="_blank" className="hover:text-text-primary transition-colors"><X size={18} /></a>
              <a href="https://github.com/sGowthamhacker/" target="_blank" className="hover:text-text-primary transition-colors"><Github size={18} /></a>
              <a href="https://in.linkedin.com/in/gowtham-s-528631249" target="_blank" className="hover:text-text-primary transition-colors"><Linkedin size={18} /></a>
              <a href="https://www.instagram.com/gow.tham__rk?utm_source=qr&igsh=NWpveGJ6eXZ0bWM3" target="_blank" className="hover:text-text-primary transition-colors"><Instagram size={18} /></a>
              <a href="https://wa.me/919346082957" target="_blank" className="hover:text-text-primary transition-colors"><Globe size={18} /></a>
            </div>
          </div>

          {/* Platform Section */}
          <div className="space-y-5">
            <h4 className="text-text-primary font-display font-800 text-xs tracking-[0.2em] uppercase opacity-90">Platform</h4>
            <ul className="space-y-3 text-[13px] text-text-muted font-500">
              <li><Link href="/dashboard" className="hover:text-accent-blue transition-all">Overview</Link></li>
              <li><Link href="/charts" className="hover:text-accent-blue transition-all">Live Charts</Link></li>
              <li><Link href="/screener" className="hover:text-accent-blue transition-all">Stock Screener</Link></li>
              
              <li className="relative flex justify-center sm:justify-start">
                <button 
                  onClick={() => setShowApps(!showApps)}
                  className="flex items-center gap-2 text-accent-blue hover:text-accent-blue/80 transition-all font-700 bg-accent-blue/5 px-3 py-1.5 rounded-lg border border-accent-blue/20 shadow-sm"
                >
                  Nifty 50 Portfolio <ChevronDown size={14} className={cn("transition-transform", showApps && "rotate-180")} />
                </button>
                
                {showApps && (
                  <div className="absolute top-full mt-2 w-48 bg-bg-card/95 backdrop-blur-xl border border-border-default rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 p-1.5 animate-in fade-in zoom-in-95 duration-200 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0">
                    <a href="https://htwth.vercel.app/" target="_blank" className="flex items-center justify-between px-3 py-2 hover:bg-bg-elevated rounded-lg transition-all text-xs group">
                      <span>HTWTH Vercel</span>
                      <ExternalLink size={10} className="opacity-0 group-hover:opacity-100" />
                    </a>
                    <a href="https://writeupportalos.netlify.app/" target="_blank" className="flex items-center justify-between px-3 py-2 hover:bg-bg-elevated rounded-lg transition-all text-xs group">
                      <span>HTWTH Netlify</span>
                      <ExternalLink size={10} className="opacity-0 group-hover:opacity-100" />
                    </a>
                  </div>
                )}
              </li>
            </ul>
          </div>

          {/* Connect Section */}
          <div className="space-y-5">
            <h4 className="text-text-primary font-display font-800 text-xs tracking-[0.2em] uppercase opacity-90">Connect</h4>
            <ul className="space-y-4 text-[13px] text-text-muted font-500">
              <li className="flex items-start gap-3 justify-center sm:justify-start">
                <MapPin size={16} className="text-accent-blue shrink-0 mt-0.5" />
                <span className="leading-tight">Research Lab, Tamil Nadu,<br/>India</span>
              </li>
              <li className="flex items-center gap-3 justify-center sm:justify-start">
                <Phone size={16} className="text-accent-blue shrink-0" />
                <span>+91 93460 82957</span>
              </li>
              <li className="flex items-center gap-3 justify-center sm:justify-start">
                <Mail size={16} className="text-accent-blue shrink-0" />
                <span className="truncate">ragow49@gmail.com</span>
              </li>
            </ul>
          </div>

          {/* Newsletter Section */}
          <div className="space-y-6">
            <h4 className="text-text-primary font-display font-800 text-xs tracking-[0.2em] uppercase opacity-90">Stay Updated</h4>
            <p className="text-text-muted text-[12px] leading-relaxed opacity-70">Join our newsletter for the latest market trends.</p>
            <form onSubmit={handleSubscribe} className="relative group">
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address" 
                className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-accent-blue/50 transition-all font-sans"
              />
              <button 
                type="submit"
                disabled={loading}
                className="absolute right-2 top-1.5 bottom-1.5 px-3 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-lg transition-all flex items-center justify-center"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={14} />}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className={cn(
        "max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between transition-all relative group/footer-tier",
        isMinimal ? "gap-2 sm:gap-4" : "gap-4 text-center mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-border-default/20 sm:text-left"
      )}>
        <div className={cn(
          "flex flex-wrap items-center justify-center sm:justify-start transition-all gap-3 sm:gap-6", 
          isMinimal ? "sm:flex-nowrap group-hover/footer-tier:translate-x-4 md:group-hover/footer-tier:translate-x-8 duration-500 ease-out" : "flex-col"
        )}>
          <p className={cn(
            "text-white font-mono tracking-wide opacity-100 uppercase drop-shadow-sm transition-all group-hover/footer-tier:scale-105 text-center sm:text-left break-words",
            isMinimal ? "text-[8px] md:text-[9px]" : "text-[10px]"
          )}>
            © 2026 HackToWriteToHack. All rights reserved.
          </p>
          <div className={cn(
            "relative inline-flex items-center rounded-full overflow-hidden border border-amber-500/30 bg-amber-500/5 group/version shadow-[0_0_12px_rgba(245,158,11,0.1)] transition-all group-hover/footer-tier:scale-110 group-hover/footer-tier:shadow-[0_0_20px_rgba(245,158,11,0.2)]",
            isMinimal ? "px-2 py-0.5" : "px-3 py-1"
          )}>
            {/* White & Golden Shimmer */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-amber-400/40 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />
            
            <span className={cn(
              "relative text-amber-400 font-900 font-mono uppercase flex items-center gap-1.5",
              isMinimal ? "text-[8px] md:text-[10px]" : "text-[10px]"
            )}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_#f59e0b]" />
              GOWTHAM S : VV: {version}
            </span>
          </div>
        </div>
        
        <div className={cn("flex items-center justify-center sm:justify-end transition-all shrink-0", isMinimal ? "gap-4" : "flex-col gap-3 sm:flex-row sm:gap-6")}>
          <div className="flex flex-col items-center sm:items-end justify-center min-w-[70px]">
             <span className={cn(
               "text-white font-mono uppercase tracking-[0.2em] opacity-90 leading-none whitespace-nowrap",
               isMinimal ? "text-[8px] md:text-[9px]" : "text-[11px]"
             )}>
               Architected By
             </span>
             {/* Dynamic Role Switcher (Fade Up Animation) */}
             <div className="relative h-3 overflow-hidden mt-1.5 hidden md:block select-none group-hover/inner:scale-110 transition-transform duration-300">
                <div className="flex flex-col animate-role-rotate text-[8.5px] font-mono font-900 uppercase tracking-[0.4em] sm:text-right px-1">
                   <span className="h-3 leading-none text-blue-400">Developer</span>
                   <span className="h-3 leading-none text-emerald-400">Hacker</span>
                   <span className="h-3 leading-none text-rose-500">Security</span>
                   <span className="h-3 leading-none text-amber-400">Engineer</span>
                   <span className="h-3 leading-none text-blue-400">Developer</span>
                </div>

                {/* Role-Specific Magnetic Strips (Join on Hover) */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-accent-blue/40 -translate-x-full group-hover/inner:translate-x-0 transition-transform duration-500 ease-out z-20" />
                <div className="absolute bottom-0 right-0 w-full h-[1px] bg-accent-blue/40 translate-x-full group-hover/inner:translate-x-0 transition-transform duration-500 ease-out z-20" />
                <div className="absolute top-0 left-0 w-[1px] h-full bg-accent-blue/40 -translate-y-full group-hover/inner:translate-y-0 transition-transform duration-500 delay-100 ease-out z-20" />
                <div className="absolute bottom-0 right-0 w-[1px] h-full bg-accent-blue/40 translate-y-full group-hover/inner:translate-y-0 transition-transform duration-500 delay-100 ease-out z-20" />
             </div>
          </div>

          <div className="relative group/parent">
            <a 
              href="https://gowthamprofile.vercel.app/" 
              target="_blank" 
              className="relative overflow-visible cursor-pointer block group/inner no-underline"
            >
               <div className="flex items-center gap-2 font-display font-900 tracking-tighter transition-all relative">
                  <span className={cn(
                    "relative z-10 text-white border border-white/20 rounded-xl bg-white/5 transition-all group-hover/inner:border-transparent group-hover/inner:bg-white/10 group-hover/inner:scale-[1.02] active:scale-95 flex items-center gap-2 overflow-hidden",
                    isMinimal ? "px-3 py-1 text-[10px] md:text-[11px]" : "px-5 py-2 text-[14px]"
                  )}>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent-blue via-white to-accent-green bg-[length:200%_auto] animate-gradient-x group-hover/inner:text-white transition-colors uppercase tracking-[0.1em]">
                      GOWTHAM S
                    </span>

                    {/* Magnetic Strips (Crazy Join Animation) */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-amber-400 -translate-x-full group-hover/inner:translate-x-0 transition-transform duration-300 ease-out z-20 shadow-[0_0_8px_#fbbf24]" />
                    <div className="absolute bottom-0 right-0 w-full h-[1px] bg-amber-400 translate-x-full group-hover/inner:translate-x-0 transition-transform duration-300 ease-out z-20 shadow-[0_0_8px_#fbbf24]" />
                    <div className="absolute top-0 right-0 w-[1px] h-full bg-amber-400 -translate-y-full group-hover/inner:translate-y-0 transition-transform duration-300 delay-75 ease-out z-20 shadow-[0_0_8px_#fbbf24]" />
                    <div className="absolute bottom-0 left-0 w-[1px] h-full bg-amber-400 translate-y-full group-hover/inner:translate-y-0 transition-transform duration-300 delay-75 ease-out z-20 shadow-[0_0_8px_#fbbf24]" />
                  </span>
                  
                  {/* Magnetic Shimmer and Interactive Glow */}
                  <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-amber-400/30 via-white/10 to-accent-blue/30 opacity-0 group-hover/inner:opacity-80 blur-md transition-opacity duration-300" />
                  <div className="absolute inset-0 rounded-xl bg-amber-400/5 opacity-0 group-hover/inner:opacity-100 scale-110 blur-sm transition-all duration-300" />
               </div>
            </a>

            {/* Improved Fly-out Roles for Hover - Right aligned to prevent overflow */}
            <div className="absolute bottom-[calc(100%+12px)] right-0 flex flex-col items-end opacity-0 group-hover/parent:opacity-100 group-hover/parent:-translate-y-1 transition-all duration-300 pointer-events-none scale-90 group-hover/parent:scale-100 z-[100] whitespace-nowrap">
               <div className="bg-bg-card/95 backdrop-blur-xl border border-white/20 rounded-lg px-3 py-2 shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
                  <div className="flex items-center gap-4 text-[7px] font-900 uppercase tracking-widest text-accent-blue">
                     <span className="hover:text-white transition-colors">Hacker</span>
                     <span className="w-1 h-1 rounded-full bg-white/20" />
                     <span className="hover:text-white transition-colors">Developer</span>
                     <span className="w-1 h-1 rounded-full bg-white/20" />
                     <span className="hover:text-white transition-colors">Security</span>
                     <span className="w-1 h-1 rounded-full bg-white/20" />
                     <span className="hover:text-white transition-colors">Engineer</span>
                  </div>
               </div>
               {/* Arrow aligned to the right side of the button */}
               <div className="w-3 h-3 bg-bg-card/95 border-r border-b border-white/20 rotate-45 -mt-1.5 mr-6 shadow-sm" />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes role-rotate {
          0%, 15% { transform: translateY(0); }
          25%, 40% { transform: translateY(-0.75rem); }
          50%, 65% { transform: translateY(-1.5rem); }
          75%, 90% { transform: translateY(-2.25rem); }
          100% { transform: translateY(-3rem); }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        .animate-role-rotate {
          animation: role-rotate 8s cubic-bezier(0.76, 0, 0.24, 1) infinite;
        }
      `}</style>
    </footer>
  );
}
