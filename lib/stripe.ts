import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder";

export const stripe = new Stripe(stripeKey, {
  apiVersion: "2024-06-20",
  typescript: true,
});

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    priceId: null,
    features: [
      "Live Nifty 50 index data",
      "Basic candlestick charts",
      "Nifty 50 stocks table",
      "Watchlist (up to 5 stocks)",
      "Top gainers & losers",
    ],
    limits: { watchlist: 5, alerts: 0 },
  },
  pro: {
    name: "Pro",
    price: 999,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      "Everything in Free",
      "Unlimited watchlist",
      "Price & % change alerts",
      "Email notifications",
      "Advanced analytics",
      "Historical data (5Y)",
      "Portfolio tracker",
      "Priority support",
    ],
    limits: { watchlist: -1, alerts: -1 },
  },
};
