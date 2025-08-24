// src/supa.js
import { createClient } from '@supabase/supabase-js';

const supa = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

// Uploads JSON to a path in the storage bucket, replacing any existing file.
export async function uploadJSON(path, json) {
  const bucket = import.meta.env.VITE_SUPABASE_BUCKET;
  const blob = new Blob([JSON.stringify(json)], {
    type: 'application/json'
  });
  const { error } = await supa.storage
    .from(bucket)
    .upload(path, blob, {
      upsert: true,
      contentType: 'application/json'
    });
  if (error) throw error;
}

export const UPLOAD_PASSWORD = import.meta.env.VITE_UPLOAD_PASSWORD;
export { supa };
