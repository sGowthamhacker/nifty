"use client";
import { useEffect, useState } from "react";
import { Settings, User, Shield, CreditCard, Bell, ChevronRight, Mail, Key, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ full_name: "" });

  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;

      if (user) {
        setUser(user);
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (mounted) {
          if (data) {
            setProfile(data);
            setFormData({ full_name: data.full_name || "" });
          } else {
            // Fallback
            setFormData({ full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "" });
          }
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUser();
    return () => { mounted = false; };
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .upsert({
          id: user.id,
          email: user.email,
          full_name: formData.full_name,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (e: any) {
      toast.error(e.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { id: "profile", label: "Profile", icon: User },
    { id: "account", label: "Account", icon: Mail },
    { id: "security", label: "Security", icon: Key },
    { id: "billing", label: "Billing", icon: CreditCard },
  ];

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
        <p className="text-text-muted font-mono text-xs uppercase tracking-widest">Loading sensitive data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center text-accent-blue border border-accent-blue/20">
          <Settings size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-display font-800 text-text-primary tracking-tight">Account Settings</h1>
          <p className="text-text-muted text-[10px] font-mono uppercase tracking-[0.2em] mt-0.5">Configuration & Personalization</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar Tabs - Responsive */}
        <div className="lg:col-span-3 flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-3 px-4 py-3 rounded-xl text-sm font-700 transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-accent-blue/12 text-accent-blue border-l-2 lg:border-l-2 border-b-2 lg:border-b-0 border-accent-blue lg:pl-[14px]"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
              )}
            >
              <tab.icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-6">
          <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden shadow-xl">
            {activeTab === "profile" ? (
              <div className="divide-y divide-border-subtle/50">
                {/* Header/Avatar */}
                <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-br from-bg-card to-bg-secondary/50">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center text-3xl font-800 text-text-primary border border-white/5 shadow-glow-blue/5">
                      {user?.email?.[0].toUpperCase() || "?"}
                    </div>
                    <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                      <Settings size={16} className="text-white" />
                    </div>
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-xl font-display font-700 text-text-primary">{profile?.full_name || "New Trader"}</h3>
                    <p className="text-text-muted text-sm font-body">{user?.email}</p>
                    <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue text-[10px] font-mono font-700 uppercase border border-accent-blue/20">
                        {profile?.plan || "Free Tier"}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-bg-elevated text-text-muted text-[10px] font-mono font-700 uppercase border border-border-subtle">
                        ID: {user?.id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-text-muted uppercase tracking-[0.2em] font-700">Display Name</label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ full_name: e.target.value })}
                        placeholder="e.g. John Doe"
                        className="w-full bg-bg-elevated/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/50 focus:bg-bg-elevated transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-text-muted uppercase tracking-[0.2em] font-700">Email Address</label>
                      <input
                        type="email"
                        disabled
                        value={user?.email || ""}
                        className="w-full bg-bg-elevated/30 border border-border-subtle/50 rounded-xl px-4 py-3 text-sm text-text-muted cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="bg-bg-elevated/20 rounded-2xl p-4 border border-border-subtle/30">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-accent-amber/10 text-accent-amber shrink-0 border border-accent-amber/20">
                        <Shield size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-700 text-text-primary mb-1">Public Profile</p>
                        <p className="text-[11px] text-text-muted leading-relaxed">
                          Your display name will be used across the platform for alerts and watchlists. 
                          Email is kept private and never shared.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-6 sm:p-8 bg-bg-secondary/30 flex items-center justify-between">
                  <p className="text-[11px] text-text-muted font-body hidden sm:block">
                    Last updated: {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : "Never"}
                  </p>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent-blue hover:bg-accent-blue/90 text-white px-8 py-3 rounded-xl text-sm font-800 transition-all shadow-glow-blue border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} className="group-hover:scale-110 transition-transform" />}
                    {saving ? "Updating..." : "Save Profile"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-bg-elevated flex items-center justify-center text-text-muted mx-auto mb-4 border border-border-subtle">
                  <Shield size={24} className="opacity-30" />
                </div>
                <h3 className="text-text-primary font-700">Modular Feature</h3>
                <p className="text-text-muted text-sm max-w-xs mx-auto">
                  The <span className="text-accent-blue font-600">{activeTab}</span> settings module is currently being optimized for security.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-blue/10 text-accent-blue text-[10px] font-mono font-700 uppercase">
                  Coming Soon
                </div>
              </div>
            )}
          </div>

          {/* Danger Zone */}
          {activeTab === "profile" && (
            <div className="bg-accent-red/5 border border-accent-red/20 rounded-2xl p-6 sm:p-8">
              <h4 className="text-accent-red font-800 text-sm mb-2 flex items-center gap-2 uppercase tracking-widest font-mono">
                Danger Zone
              </h4>
              <p className="text-text-muted text-xs mb-6 max-w-lg">
                Once you delete your account, there is no going back. Please be certain about this action. 
                All your watchlists and alerts will be permanently removed.
              </p>
              <button className="text-accent-red border border-accent-red/30 px-6 py-2.5 rounded-xl text-xs font-700 hover:bg-accent-red/10 transition-all">
                Delete Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
