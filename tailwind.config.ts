import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0A0B0E",
          secondary: "#0F1117",
          tertiary: "#161820",
          card: "#12141A",
          elevated: "#1A1D27",
        },
        accent: {
          green: "#00D4AA",
          red: "#FF4D6A",
          blue: "#3B82F6",
          amber: "#F59E0B",
          purple: "#8B5CF6",
        },
        border: {
          subtle: "#1E2130",
          default: "#252840",
          strong: "#2E3250",
        },
        text: {
          primary: "#E8EAED",
          secondary: "#9AA0B4",
          muted: "#5A6280",
          inverse: "#0A0B0E",
        },
      },
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)",
        "glow-green":
          "radial-gradient(ellipse at center, rgba(0,212,170,0.15) 0%, transparent 70%)",
        "glow-blue":
          "radial-gradient(ellipse at center, rgba(59,130,246,0.12) 0%, transparent 70%)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        ticker: "ticker 30s linear infinite",
        "blink": "blink 1s step-end infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        ticker: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        blink: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0" } },
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.4)",
        glow: "0 0 30px rgba(0,212,170,0.15)",
        "glow-blue": "0 0 30px rgba(59,130,246,0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
