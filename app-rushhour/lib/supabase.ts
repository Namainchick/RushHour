import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client. Uses the service_role key, which bypasses RLS —
// it must NEVER be imported into a client component. All DB access goes through
// API routes, so the key stays on the server.
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseConfigured = Boolean(url && serviceKey);

export const supabase = supabaseConfigured
  ? createClient(url!, serviceKey!, { auth: { persistSession: false } })
  : null;
