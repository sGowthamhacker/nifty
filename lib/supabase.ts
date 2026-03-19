import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: any = null;

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? (supabaseInstance || (supabaseInstance = createClientComponentClient())) 
  : new Proxy({}, {
      get: () => new Proxy(() => {}, { 
        get: () => () => ({ data: { session: null, user: null, subscription: { unsubscribe: () => {} } }, error: null }) 
      })
    }) as any;

// Admin client — server-side only, never expose to browser
// We use a lazy initializer or safe check to avoid crashing during build if env vars are missing
export const supabaseAdmin = (supabaseUrl && (process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey))
  ? createClient(
      supabaseUrl!,
      (process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey)!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
  : null as any;

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          plan: "free" | "pro";
          is_admin: boolean;
          created_at: string;
        };
      };
      watchlists: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          added_at: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          condition: "above" | "below" | "percent_change";
          target_value: number;
          is_active: boolean;
          triggered_at: string | null;
          created_at: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          plan: "free" | "pro";
          status: string;
          current_period_end: string;
          created_at: string;
        };
      };
    };
  };
};
