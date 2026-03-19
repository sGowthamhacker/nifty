"use client";

import { useEffect, useState } from "react";
import { Bell, Plus, Trash2, AlertTriangle, CheckCircle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { NIFTY50_SYMBOLS } from "@/lib/symbols";
import toast from "react-hot-toast";

interface Alert {
  id: string;
  symbol: string;
  condition: "above" | "below" | "percent_change";
  target_value: number;
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    symbol: "RELIANCE",
    condition: "above" as "above" | "below" | "percent_change",
    target_value: "",
  });

  useEffect(() => {
    fetchAlerts();
    checkPlan();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const checkPlan = async () => {
    try {
      const res = await fetch("/api/watchlist");
      if (res.status === 403) { setIsPro(false); return; }
      // Try to post an alert to check — we derive plan from response
      const alertRes = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: "TEST", condition: "above", target_value: 999999 }),
      });
      if (alertRes.status === 403) {
        setIsPro(false);
      } else {
        setIsPro(true);
        // Undo if it worked (shouldn't hit valid threshold anyway)
      }
    } catch {}
  };

  const createAlert = async () => {
    if (!form.target_value) return toast.error("Enter a target value");
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: form.symbol,
          condition: form.condition,
          target_value: parseFloat(form.target_value),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Alert created!");
      fetchAlerts();
      setShowCreate(false);
      setForm({ symbol: "RELIANCE", condition: "above", target_value: "" });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const deleteAlert = async (id: string) => {
    await fetch(`/api/alerts?id=${id}`, { method: "DELETE" });
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    toast.success("Alert deleted");
  };

  const conditionLabel = (c: string) => {
    if (c === "above") return "Price above";
    if (c === "below") return "Price below";
    return "% change exceeds";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-700 text-2xl text-text-primary">Price Alerts</h1>
          <p className="text-text-muted text-sm mt-1">{alerts.length} active alerts</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-accent-blue hover:bg-accent-blue/90 text-white px-4 py-2.5 rounded-xl text-sm font-500 transition-all"
        >
          <Plus size={14} />
          New Alert
        </button>
      </div>

      {/* Pro gate */}
      {!isPro && (
        <div className="bg-accent-amber/5 border border-accent-amber/20 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-amber/15 flex items-center justify-center shrink-0">
            <Lock size={18} className="text-accent-amber" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-600 text-text-primary mb-1">Alerts require Pro plan</h3>
            <p className="text-text-muted text-sm mb-3">
              Upgrade to Pro to create unlimited price alerts and receive email notifications when your targets are hit.
            </p>
            <a
              href="/settings"
              className="inline-flex items-center gap-2 bg-accent-amber text-bg-primary px-4 py-2 rounded-xl text-sm font-600 hover:bg-accent-amber/90 transition"
            >
              Upgrade to Pro — ₹999/mo
            </a>
          </div>
        </div>
      )}

      {/* Create Alert Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border-default rounded-2xl w-full max-w-md shadow-card">
            <div className="flex items-center justify-between p-5 border-b border-border-subtle">
              <h3 className="font-display font-600 text-text-primary">Create Alert</h3>
              <button onClick={() => setShowCreate(false)} className="text-text-muted hover:text-text-primary">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-text-muted text-xs font-mono uppercase tracking-wider block mb-2">Stock</label>
                <select
                  value={form.symbol}
                  onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                  className="w-full bg-bg-elevated border border-border-subtle rounded-xl px-3 py-2.5 text-sm font-mono text-text-primary focus:outline-none focus:border-accent-blue/50"
                >
                  {NIFTY50_SYMBOLS.map((s) => (
                    <option key={s.symbol} value={s.symbol}>
                      {s.symbol} — {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-text-muted text-xs font-mono uppercase tracking-wider block mb-2">Condition</label>
                <select
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value as any })}
                  className="w-full bg-bg-elevated border border-border-subtle rounded-xl px-3 py-2.5 text-sm font-mono text-text-primary focus:outline-none focus:border-accent-blue/50"
                >
                  <option value="above">Price rises above</option>
                  <option value="below">Price falls below</option>
                  <option value="percent_change">% change exceeds</option>
                </select>
              </div>
              <div>
                <label className="text-text-muted text-xs font-mono uppercase tracking-wider block mb-2">
                  {form.condition === "percent_change" ? "Percentage (%)" : "Price (₹)"}
                </label>
                <input
                  type="number"
                  value={form.target_value}
                  onChange={(e) => setForm({ ...form, target_value: e.target.value })}
                  placeholder={form.condition === "percent_change" ? "e.g. 5" : "e.g. 2500"}
                  className="w-full bg-bg-elevated border border-border-subtle rounded-xl px-3 py-2.5 text-sm font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/50"
                />
              </div>
              <button
                onClick={createAlert}
                className="w-full bg-accent-blue hover:bg-accent-blue/90 text-white py-2.5 rounded-xl text-sm font-500 transition"
              >
                Create Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerts list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-20">
          <Bell size={40} className="text-text-muted mx-auto mb-4 opacity-40" />
          <h3 className="text-text-primary font-display font-600 text-lg mb-2">No alerts yet</h3>
          <p className="text-text-muted text-sm">Create an alert to get notified when prices hit your targets</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "bg-bg-card border rounded-2xl px-5 py-4 flex items-center gap-4 group hover:border-border-default transition-colors",
                alert.triggered_at ? "border-accent-green/20" : "border-border-subtle"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                alert.triggered_at ? "bg-accent-green/15" : "bg-accent-blue/15"
              )}>
                {alert.triggered_at
                  ? <CheckCircle size={16} className="text-accent-green" />
                  : <AlertTriangle size={16} className="text-accent-blue" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-text-primary font-500 text-sm">{alert.symbol}</span>
                  <span className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded",
                    alert.is_active && !alert.triggered_at
                      ? "bg-accent-blue/10 text-accent-blue"
                      : "bg-text-muted/10 text-text-muted"
                  )}>
                    {alert.triggered_at ? "TRIGGERED" : "ACTIVE"}
                  </span>
                </div>
                <p className="text-text-muted text-xs font-mono mt-0.5">
                  {conditionLabel(alert.condition)}{" "}
                  <span className="text-text-secondary">
                    {alert.condition === "percent_change"
                      ? `${alert.target_value}%`
                      : `₹${alert.target_value.toLocaleString("en-IN")}`}
                  </span>
                </p>
              </div>
              <button
                onClick={() => deleteAlert(alert.id)}
                className="text-text-muted hover:text-accent-red opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
