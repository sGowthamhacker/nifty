import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ExternalLinkHandler from "@/components/ux/ExternalLinkHandler";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nifty50 Analytics — Professional Trading Dashboard",
  description:
    "Real-time NIFTY 50 analytics, candlestick charts, watchlists, and smart alerts for serious traders.",
  keywords: "nifty50, nse, india stocks, trading, analytics, market data",
  openGraph: {
    title: "Nifty50 Analytics",
    description: "Professional trading dashboard for Indian markets",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        <ExternalLinkHandler />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#12141A",
              color: "#E8EAED",
              border: "1px solid #1E2130",
              fontFamily: "'DM Sans', sans-serif",
            },
            success: {
              iconTheme: { primary: "#00D4AA", secondary: "#12141A" },
            },
            error: {
              iconTheme: { primary: "#FF4D6A", secondary: "#12141A" },
            },
          }}
        />
      </body>
    </html>
  );
}
