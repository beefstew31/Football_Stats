import { createClient } from "@supabase/supabase-js";

export const supa = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET; // e.g. "pa-football-stats"

export async function uploadJSON(path, data) {
  const json = JSON.stringify(data);
  const { error } = await supa.storage
    .from(BUCKET)
    .upload(path, new Blob([json], { type: "application/json" }), {
      cacheControl: "3600",
      upsert: true, // <— important so republish overwrites
      contentType: "application/json",
    });
  if (error) throw error;
}
