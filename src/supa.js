import { createClient } from '@supabase/supabase-js'

export const SUPA_URL = import.meta.env.VITE_SUPABASE_URL
export const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
export const BUCKET   = import.meta.env.VITE_SUPABASE_BUCKET || 'public'
export const UPLOAD_PASSWORD = import.meta.env.VITE_UPLOAD_PASSWORD || 'letmein'

export const supa = (SUPA_URL && SUPA_KEY) ? createClient(SUPA_URL, SUPA_KEY) : null

export function getPublicUrl(path){
  if (!supa) throw new Error('Supabase not configured')
  const { data } = supa.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadJSON(path, obj){
  if (!supa) throw new Error('Supabase not configured')
  const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' })
  const { error } = await supa.storage.from(BUCKET).upload(path, blob, { upsert: true, cacheControl: '3600' })
  if (error) throw error
  return true
}
