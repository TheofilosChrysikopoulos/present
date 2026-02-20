export * from './database'

// Helper to get locale-aware field from bilingual objects
export function getLocalizedField(
  obj: { name_en: string; name_el: string },
  locale: string
): string {
  return locale === 'el' ? obj.name_el : obj.name_en
}

export function getLocalizedDescription(
  obj: { description_en: string | null; description_el: string | null },
  locale: string
): string | null {
  return locale === 'el' ? obj.description_el : obj.description_en
}

// Helper to build public Supabase Storage URL from path
export function getStorageUrl(
  supabaseUrl: string,
  bucket: string,
  path: string
): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}

export const STORAGE_BUCKET = 'product-images'
