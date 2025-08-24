// src/supa.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supa = createClient(supabaseUrl, supabaseKey);

// Used by the upload page to authenticate uploads
export const UPLOAD_PASSWORD = import.meta.env.VITE_UPLOAD_PASSWORD;

// Helper to write JSON to storage
export async function uploadJSON(path, data) {
  const { error } = await supa.storage
    .from(import.meta.env.VITE_SUPABASE_BUCKET)
    .upload(path, new Blob([JSON.stringify(data)], { type: 'application/json' }), {
      upsert: true,
      contentType: 'application/json'
    });
  if (error) throw error;
}
