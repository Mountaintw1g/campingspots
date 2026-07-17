import { createClient } from "@supabase/supabase-js";

// .trim() skyddar mot extra radbrytning/mellanslag som lätt smyger sig med
// vid copy-paste i molnplattformars miljövariabel-fält (t.ex. Vercel).
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL.trim(),
  import.meta.env.VITE_SUPABASE_ANON_KEY.trim(),
);
