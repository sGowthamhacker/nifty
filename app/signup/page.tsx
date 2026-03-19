"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  TrendingUp, Mail, Lock, Eye, EyeOff, User, 
  ArrowRight, Loader2, AlertTriangle, CheckCircle, 
  Activity, ShieldCheck, Zap, Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StockAscension } from "@/components/background/StockAscension";
import { isMarketOpen } from "@/lib/free-api-client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [marketLive, setMarketLive] = useState(false);

  useEffect(() => {
    setMarketLive(isMarketOpen());
    const timer = setInterval(() => setMarketLive(isMarketOpen()), 60000); // refresh every min
    return () => clearInterval(timer);
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("__timeout__")), 10000)
    );

    try {
      const { data, error: signupError } = await Promise.race([
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        }),
        timeout,
      ]) as any;

      if (signupError) throw signupError;

      if (data.user) {
        setSuccess(true);
      }
    } catch (err: any) {
      if (err.message === "__timeout__") {
        setError("⚠️ Server is not responding. The database may be waking up — please wait 1–2 minutes and try again.");
      } else {
        setError(err.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#07090D] flex items-center justify-center p-6 relative overflow-hidden text-center selection:bg-accent-blue selection:text-white">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern bg-[size:32px_32px] opacity-[0.05]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent-blue/10 rounded-full blur-[120px]" />
        </div>
        
        <StockAscension />

        <div className="w-full max-w-[440px] relative z-10 animate-fade-in text-center mx-auto">
          <div className="relative w-20 h-20 rounded-full bg-accent-green/10 flex items-center justify-center mx-auto mb-10 border border-accent-green/20">
            <div className="absolute inset-0 bg-accent-green/20 blur-xl rounded-full animate-pulse" />
            <CheckCircle size={40} className="text-accent-green relative"/>
          </div>
          
          <h1 className="font-display font-900 text-3xl text-white mb-4 tracking-tighter italic uppercase underline decoration-accent-blue decoration-4 underline-offset-8">Perfect</h1>
          <p className="text-white/40 text-[11px] font-sans tracking-widest leading-relaxed mb-10 max-w-xs mx-auto uppercase">
             A verification email has been sent to <span className="text-white font-900">{email}</span>. Please verify your email to activate your account.
          </p>

          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-2xl text-[13px] font-900 bg-accent-blue hover:bg-accent-blue/90 text-white transition-all shadow-glow-blue border border-white/20 uppercase tracking-widest"
          >
            Go to Login
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090D] flex items-center justify-center p-6 relative overflow-hidden selection:bg-accent-blue selection:text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern bg-[size:32px_32px] opacity-[0.05]" />
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-blue/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent-green/5 blur-[120px] rounded-full animate-pulse delay-1000" />
      </div>

      <StockAscension />

      <div className="w-full max-w-[440px] relative z-10 animate-fade-in text-center mx-auto">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-3 mb-8 hover:scale-105 transition-all group/logo">
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple p-[1px] shadow-glow-blue/20">
             <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-2xl" />
             <div className="relative w-full h-full flex items-center justify-center">
                <TrendingUp size={22} className="text-white group-hover/logo:scale-110 transition-transform" />
             </div>
          </div>
          <div className="text-left">
            <span className="font-display font-900 text-white text-xl tracking-tighter block leading-none">NIFTY 50</span>
            <span className="block text-[8px] text-accent-blue font-900 uppercase tracking-[0.4em] mt-1 opacity-80">Analytics Pro</span>
          </div>
        </Link>

        {/* Unified Card */}
        <div className="relative bg-[#0F1117]/80 border border-white/10 rounded-[32px] p-1 shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
          
          <div className="p-6 sm:p-8 relative z-10 text-left">
             {/* Header */}
             <div className="flex items-center justify-between mb-6">
                <div>
                   <h1 className="font-display font-900 text-2xl text-white tracking-tight mb-2 italic">Create Account</h1>
                   <div className="flex items-center gap-2">
                       {marketLive ? (
                        <div className="flex items-center gap-1.5 bg-accent-green/10 border border-accent-green/20 px-2.5 py-1 rounded-full">
                           <Activity size={10} className="text-accent-green animate-pulse" />
                           <span className="text-accent-green text-[8px] font-900 uppercase tracking-widest leading-none">Market Live</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-accent-red/10 border border-accent-red/20 px-2.5 py-1 rounded-full">
                           <span className="w-1.5 h-1.5 bg-accent-red rounded-full opacity-50" />
                           <span className="text-accent-red text-[8px] font-900 uppercase tracking-widest leading-none">Market Closed</span>
                        </div>
                      )}
                      <p className="text-white/30 text-[9px] font-mono tracking-widest uppercase">Member Account</p>
                   </div>
                </div>
                <div className="flex items-center gap-2 bg-accent-blue/10 border border-accent-blue/20 px-3 py-1.5 rounded-full">
                   <Zap size={14} className="text-accent-blue animate-pulse" />
                   <span className="text-accent-blue text-[9px] font-900 uppercase tracking-widest leading-none text-center">Live</span>
                </div>
             </div>

             <form onSubmit={handleSignup} className="space-y-4 mb-8">
               <div className="space-y-4">
                 <div className="group/input">
                   <label className="block text-white/30 text-[10px] font-900 uppercase tracking-[0.2em] mb-2.5 ml-1">Full Name</label>
                   <div className="relative">
                     <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-accent-blue transition-colors">
                       <User size={18} />
                     </div>
                     <input
                       type="text"
                       value={name}
                       onChange={(e) => setName(e.target.value)}
                       required
                       placeholder="Enter your name"
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-3.5 text-sm text-white focus:outline-none focus:border-accent-blue/50 focus:bg-white/[0.08] transition-all font-sans tracking-tight"
                     />
                   </div>
                 </div>

                 <div className="group/input">
                   <label className="block text-white/30 text-[10px] font-900 uppercase tracking-[0.2em] mb-2.5 ml-1">Email Address</label>
                   <div className="relative">
                     <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-accent-blue transition-colors">
                       <Mail size={18} />
                     </div>
                     <input
                       type="email"
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       required
                       placeholder="your@email.com"
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-3.5 text-sm text-white focus:outline-none focus:border-accent-blue/50 focus:bg-white/[0.08] transition-all font-sans tracking-tight"
                     />
                   </div>
                 </div>

                 <div className="group/input">
                   <label className="block text-white/30 text-[10px] font-900 uppercase tracking-[0.2em] mb-2.5 ml-1">Password</label>
                   <div className="relative">
                     <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-accent-blue transition-colors">
                       <Lock size={18} />
                     </div>
                     <input
                       type={showPassword ? "text" : "password"}
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       required
                       placeholder="••••••••••••"
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-3.5 text-sm text-white focus:outline-none focus:border-accent-blue/50 focus:bg-white/[0.08] transition-all font-sans tracking-tight"
                     />
                     <button
                       type="button"
                       onClick={() => setShowPassword(!showPassword)}
                       className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors focus:outline-none"
                     >
                       {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                     </button>
                   </div>
                 </div>
               </div>

               <button
                 type="submit"
                 disabled={loading || !name || !email || !password}
                 className="w-full group mt-2 flex items-center justify-center gap-3 py-4 rounded-2xl text-[13px] font-900 bg-accent-blue hover:bg-accent-blue/90 text-white transition-all shadow-glow-blue border border-white/20 active:scale-95 disabled:opacity-40 disabled:scale-100 overflow-hidden relative"
               >
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                 {loading ? (
                   <>
                     <Loader2 size={18} className="animate-spin" />
                     <span className="uppercase tracking-widest text-[9px] leading-none">creating account...</span>
                   </>
                 ) : (
                   <>
                     <span className="uppercase tracking-widest leading-none">Sign Up</span>
                     <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                   </>
                 )}
               </button>
             </form>

             {/* Footer Navigation Unified Inside Card */}
             <div className="pt-6 border-t border-white/5 flex flex-col items-center gap-4 text-center">
                <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-all text-[11px] font-900 uppercase tracking-widest group">
                   <Home size={14} className="group-hover:scale-110 transition-transform text-accent-blue/50 group-hover:text-accent-blue" />
                   Home
                </Link>
                <div className="flex items-center gap-1.5 text-white/30 text-[10px] font-900 uppercase tracking-widest">
                   <span>Already have an account?</span>
                   <Link href="/login" className="text-accent-blue hover:text-white transition-colors underline underline-offset-4 decoration-accent-blue/30">
                      Log In
                   </Link>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
