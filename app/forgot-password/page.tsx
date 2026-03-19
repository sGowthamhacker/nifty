"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { 
  TrendingUp, Mail, ArrowRight, Loader2, AlertTriangle, 
  CheckCircle, ArrowLeft, Zap, Globe 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StockAscension } from "@/components/background/StockAscension";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (resetError) throw resetError;
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090D] flex items-center justify-center p-6 relative overflow-hidden selection:bg-accent-blue selection:text-white">
      {/* Immersive Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern bg-[size:32px_32px] opacity-[0.05] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent-blue/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-green/5 blur-[120px] rounded-full animate-pulse delay-1000" />
      </div>

      <StockAscension />

      <div className="w-full max-w-md relative z-10 animate-fade-in group text-center">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-3 mb-8 mx-auto hover:scale-105 transition-transform group/logo">
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

        {/* Card */}
        <div className="relative bg-[#0F1117]/80 border border-white/10 rounded-[32px] p-1 shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
          
          <div className="p-6 sm:p-8 relative z-10 text-left">
             {success ? (
               <div className="animate-fade-in text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-accent-green/10 flex items-center justify-center mx-auto mb-6 border border-accent-green/20 relative">
                    <div className="absolute inset-0 bg-accent-green/20 blur-xl rounded-full animate-pulse" />
                    <CheckCircle size={32} className="text-accent-green relative"/>
                  </div>
                  <h1 className="font-display font-900 text-2xl text-white mb-3 tracking-tight uppercase italic">Verifying Access</h1>
                  <p className="text-white/40 text-[10px] font-mono tracking-widest leading-relaxed mb-8 max-w-xs mx-auto uppercase">
                    Verification link dispatched to <span className="text-white font-900">{email}</span>. Please authorize via your inbox.
                  </p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="w-full group mt-2 flex items-center justify-center py-4 rounded-2xl text-[13px] font-900 bg-white/5 hover:bg-white/10 text-white transition-all shadow-card border border-white/10 uppercase tracking-widest"
                  >
                    Try Different Channel
                  </button>
               </div>
             ) : (
               <>
                 {/* Header */}
                 <div className="flex items-center justify-between mb-6">
                    <div>
                       <h1 className="font-display font-900 text-2xl text-white tracking-tight mb-2 italic">Reset Password</h1>
                       <p className="text-white/40 text-[9px] font-mono tracking-widest uppercase">Member Security v5.5</p>
                    </div>
                    <div className="flex items-center gap-2 bg-accent-blue/10 border border-accent-blue/20 px-3 py-1.5 rounded-full">
                       <Zap size={14} className="text-accent-blue animate-pulse" />
                       <span className="text-accent-blue text-[9px] font-900 uppercase">Secure</span>
                    </div>
                 </div>

                 <p className="text-white/40 text-xs mb-6 leading-relaxed">
                   Enter your registered email address below. We'll send instructions to reset your account credentials.
                 </p>

                 <form onSubmit={handleReset} className="space-y-4">
                   {error && (
                     <div className="p-4 bg-accent-red/10 border border-accent-red/20 rounded-2xl flex items-start gap-3 animate-shake">
                       <AlertTriangle size={18} className="text-accent-red shrink-0" />
                       <p className="text-accent-red text-xs font-700 leading-relaxed">{error}</p>
                     </div>
                   )}

                   <div className="group/input">
                     <label className="block text-white/30 text-[10px] font-900 uppercase tracking-[0.2em] mb-2 ml-1">Email Address</label>
                     <div className="relative">
                       <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-accent-blue transition-colors">
                         <Mail size={18} />
                       </div>
                       <input
                         type="email"
                         value={email}
                         onChange={(e) => setEmail(e.target.value)}
                         required
                         placeholder="email@example.com"
                         className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-3.5 text-sm text-white focus:outline-none focus:border-accent-blue/50 focus:bg-white/[0.08] transition-all font-mono tracking-tight"
                       />
                     </div>
                   </div>

                   <button
                     type="submit"
                     disabled={loading || !email}
                     className="w-full group mt-4 flex items-center justify-center gap-3 py-4 rounded-2xl text-[13px] font-900 bg-accent-blue hover:bg-accent-blue/90 text-white transition-all shadow-glow-blue border border-white/20 active:scale-95 disabled:opacity-40 disabled:scale-100 overflow-hidden relative"
                   >
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                     {loading ? (
                       <>
                         <Loader2 size={18} className="animate-spin" />
                         <span className="uppercase tracking-widest">Processing...</span>
                       </>
                     ) : (
                       <>
                         <span className="uppercase tracking-widest">Send Reset Link</span>
                         <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                       </>
                     )}
                   </button>
                 </form>
               </>
             )}
          </div>
        </div>

        <Link href="/login" className="inline-flex items-center gap-2 mt-10 text-white/40 hover:text-white text-[11px] font-900 uppercase tracking-widest transition-all mx-auto group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
          Back to Terminal
        </Link>
      </div>
    </div>
  );
}
