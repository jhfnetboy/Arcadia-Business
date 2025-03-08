import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export async function uploadImage(file: File, path: string) {
  const { data, error } = await supabase.storage
    .from('arcadia')
    .upload(`images/${path}`, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) {
    throw error
  }

  return getImageUrl(path)
}

export function getImageUrl(path: string) {
  const { data } = supabase.storage
    .from('arcadia')
    .getPublicUrl(`images/${path}`)
  
  return data.publicUrl
}

export async function deleteImage(path: string) {
  const { error } = await supabase.storage
    .from('arcadia')
    .remove([`images/${path}`])

  if (error) {
    throw error
  }
} 