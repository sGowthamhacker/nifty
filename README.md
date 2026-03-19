# NIFTY50 Analytics — Production SaaS Platform

A professional financial analytics SaaS for tracking the NIFTY 50 Indian stock market index.
Built with Next.js 14, Supabase, TradingView Lightweight Charts, and Stripe.

**Build status: ✅ Compiles clean — 18 routes, 0 TypeScript errors**

---

## 🚀 Quick Start (3 Steps)

### Step 1 — Install
```bash
npm install
```

### Step 2 — Your Supabase keys are already set in `.env.local`
Add Stripe keys when ready:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
```

### Step 3 — Run
```bash
npm run dev
# → http://localhost:3000
```

---

## 🗄️ Database Setup (One-Time)

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → your project
2. Click **SQL Editor** → **New Query**
3. Paste entire contents of `supabase/schema.sql` → **Run**

### Make yourself an admin
```sql
UPDATE public.users SET is_admin = TRUE WHERE email = 'your@email.com';
```

---

## 📁 Project Structure

```
nifty50-saas/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Global styles + animations
│   ├── login/page.tsx              # Sign in
│   ├── signup/page.tsx             # Create account
│   ├── dashboard/layout.tsx        # Dashboard shell (Sidebar + TopBar)
│   ├── dashboard/page.tsx          # Main dashboard
│   ├── stocks/page.tsx             # Full Nifty 50 table
│   ├── watchlist/page.tsx          # Personal watchlist
│   ├── alerts/page.tsx             # Price alerts (Pro)
│   ├── settings/page.tsx           # Billing + account
│   ├── admin/page.tsx              # Admin panel
│   └── api/
│       ├── market/index/route.ts   # NIFTY 50 live price — 10s cache
│       ├── market/chart/route.ts   # OHLCV candle data
│       ├── stocks/route.ts         # All 50 stock quotes — 30s cache
│       ├── watchlist/route.ts      # Watchlist CRUD
│       ├── alerts/route.ts         # Alerts CRUD (Pro gate)
│       ├── admin/route.ts          # Admin data (admin gate)
│       └── stripe/
│           ├── checkout/route.ts   # Create Stripe session
│           └── webhook/route.ts    # Handle subscription events
├── components/
│   ├── layout/Sidebar.tsx          # Navigation sidebar
│   ├── layout/TopBar.tsx           # Header with IST clock + live index
│   ├── dashboard/IndexHeroCard.tsx # NIFTY 50 hero stats card
│   ├── dashboard/StocksTable.tsx   # Sortable/searchable stocks table
│   ├── dashboard/GainersLosers.tsx # Top 5 gainers + losers
│   └── charts/CandlestickChart.tsx # TradingView candlestick + volume
├── lib/
│   ├── supabase.ts                 # Browser Supabase client + admin
│   ├── supabase-server.ts          # Server-only Supabase client
│   ├── yahoo-finance.ts            # Yahoo Finance API + mock fallbacks
│   ├── stripe.ts                   # Stripe client + plan config
│   └── utils.ts                    # Formatters, helpers
├── middleware.ts                   # Auth route protection
└── supabase/schema.sql             # Full PostgreSQL schema with RLS
```

---

## 🌐 All 18 Routes

| Route | Type | Description |
|---|---|---|
| `/` | Static | Landing page with pricing |
| `/login` | Static | Email/password sign in |
| `/signup` | Static | Create account |
| `/dashboard` | Dynamic | Main trading dashboard |
| `/stocks` | Dynamic | Nifty 50 stocks table |
| `/watchlist` | Dynamic | Personal watchlist |
| `/alerts` | Dynamic | Price alerts (Pro) |
| `/settings` | Dynamic | Billing + account |
| `/admin` | Dynamic | Admin panel (admin only) |
| `/api/market/index` | API | Live NIFTY 50 — 10s cache |
| `/api/market/chart` | API | Candle data — 60s cache |
| `/api/stocks` | API | All 50 quotes — 30s cache |
| `/api/watchlist` | API | Watchlist CRUD |
| `/api/alerts` | API | Alerts CRUD (Pro gate) |
| `/api/stripe/checkout` | API | Create Stripe session |
| `/api/stripe/webhook` | API | Stripe webhook handler |
| `/api/admin` | API | Admin stats (admin gate) |

---

## 🔐 Auth & Security

- **`middleware.ts`** protects all dashboard routes — unauthenticated → redirected to `/login`
- All Supabase tables have **Row Level Security** — users only access their own data
- Service role key is server-side only, never exposed to browser
- Plan limits enforced server-side in API routes
- Stripe webhook signature verified on every request

---

## 💳 Stripe Setup

### Create product
- Stripe Dashboard → Products → Add Product
- Name: **"NIFTY50 Analytics Pro"**, Price: **₹999/month** (INR, recurring)
- Copy **Price ID** → `STRIPE_PRO_PRICE_ID`

### Webhook (local dev)
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copy signing secret → STRIPE_WEBHOOK_SECRET
```

### Webhook (production on Vercel)
- Endpoint: `https://your-app.vercel.app/api/stripe/webhook`
- Events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_succeeded`

---

## 🚢 Deploy to Vercel

```bash
git init && git add . && git commit -m "init"
git remote add origin https://github.com/YOU/nifty50-saas.git
git push -u origin main
```

1. [vercel.com/new](https://vercel.com/new) → Import repo
2. Add all env vars from `.env.local`
3. Set `NEXT_PUBLIC_APP_URL` to your Vercel domain
4. Deploy

**Supabase config for production:**
- Authentication → URL Configuration → Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/**`

---

## 📡 Live Data

| Data | Refresh | Fallback |
|---|---|---|
| NIFTY 50 index | 10s | Realistic mock |
| All 50 stock quotes | 30s | Realistic mock |
| Chart OHLCV | Per timeframe | Simulated candles |

Yahoo Finance (free, no API key) → auto-fallback to mock data if rate-limited.

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS + custom CSS animations |
| Charts | TradingView Lightweight Charts v4 |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL + RLS |
| Payments | Stripe Subscriptions |
| Market Data | Yahoo Finance API (free) |
| Deployment | Vercel |

---

## 📄 License

MIT — Free for personal and commercial use.
