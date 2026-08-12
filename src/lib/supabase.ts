import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Fails loudly in dev rather than silently hitting undefined endpoints.
  console.warn(
    "[ScanForge] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. " +
      "Copy .env.example to .env and fill in your Supabase project's public values."
  );
}

// IMPORTANT: this must only ever use the anon/public key. The service-role
// key belongs on a trusted server and must never reach this bundle.
export const supabase = createClient(url ?? "", anonKey ?? "");
