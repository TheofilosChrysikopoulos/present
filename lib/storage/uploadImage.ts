import { createClient } from '@/lib/supabase/client'
import { STORAGE_BUCKET } from '@/lib/types'

export async function uploadProductImage(
  file: File,
  productId: string
): Promise<{ path: string; publicUrl: string }> {
  const supabase = createClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `${crypto.randomUUID()}.${ext}`
  const path = `products/${productId}/${filename}`

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw error

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)

  return { path, publicUrl: data.publicUrl }
}

export async function uploadVariantImage(
  file: File,
  variantId: string
): Promise<{ path: string; publicUrl: string }> {
  const supabase = createClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `${crypto.randomUUID()}.${ext}`
  const path = `variants/${variantId}/${filename}`

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw error

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)

  return { path, publicUrl: data.publicUrl }
}

export async function deleteStorageFile(path: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path])
  if (error) throw error
}

export function getPublicUrl(path: string): string {
  const supabase = createClient()
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
