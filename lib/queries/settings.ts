import { createClient as createServerClient } from '@/lib/supabase/server'

export async function getSetting(key: string): Promise<unknown> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle()
  return data?.value ?? null
}

export async function getShowSubcategories(): Promise<boolean> {
  const value = await getSetting('show_subcategories')
  return value === true
}
