import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Admin-klient med service role-nyckeln - full åtkomst till Supabase Auth
// (radera/lista användare m.m.). Får ALDRIG exponeras till frontend, bara
// användas här på servern. Lat-initierad så att resten av servern kan
// starta även om nyckeln saknas lokalt - felar bara när admin-routes
// faktiskt anropas.
export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl) throw new Error("SUPABASE_URL saknas");
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY saknas");

  client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return client;
}
