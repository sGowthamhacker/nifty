import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, digits = 2): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(price);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function getPriceColor(change: number): string {
  if (change > 0) return "text-accent-green";
  if (change < 0) return "text-accent-red";
  return "text-text-secondary";
}

export function getPriceBg(change: number): string {
  if (change > 0) return "bg-accent-green/10 text-accent-green";
  if (change < 0) return "bg-accent-red/10 text-accent-red";
  return "bg-text-secondary/10 text-text-secondary";
}

export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function isIndianMarketOpen(): boolean {
  // Get time in IST (UTC+5.5)
  const now = new Date();
  const istTs = now.getTime() + (5.5 * 3600000);
  const ist = new Date(istTs);
  
  const day = ist.getUTCDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  const hours = ist.getUTCHours();
  const minutes = ist.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;

  // Market: Mon-Fri, 9:15 AM (555 mins) - 3:30 PM (930 mins)
  return day >= 1 && day <= 5 && totalMinutes >= 555 && totalMinutes <= 930;
}

export function getMarketStatusLabel(state: string): string {
  switch (state) {
    case "REGULAR": return "Market Open";
    case "PRE": return "Pre-Market";
    case "POST": return "After Hours";
    default: return "Market Closed";
  }
}

export function formatCurrency(v: number): string {
  if (!v) return "₹0.00";
  // If v is > 100,000, it's likely absolute rupees.
  // If v is smaller, it might already be in Crores.
  // We'll normalize to absolute for the formatter if it looks like Crores (benchmark logic).
  let abs = v;
  if (v < 1e9 && v > 0) abs = v * 10000000; // Convert Cr to absolute
  
  if (abs >= 1e12) return `₹${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e7)  return `₹${(abs / 1e7).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`;
  return `₹${abs.toLocaleString("en-IN")}`;
}

export function formatVolume(v: number | undefined | null): string {
  if (!v || isNaN(v)) return "—";
  // Standardize to Lakhs as requested by user
  return `${(v / 100000).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L`;
}

export function formatLakhCrore(v: number): string {
  if (!v) return "0.00";
  // v is typically in Crores. 107.11 Lakh Cr = 10711000 Crores? No, Lakh Cr is 10^5 * 10^7 = 10^12.
  // If v is 107.11 (Lakh Cr), we just show it.
  // If v is 10711000 (Cr), we divide by 1e5.
  if (v > 100000) return (v / 100000).toFixed(2);
  return v.toFixed(2);
}
