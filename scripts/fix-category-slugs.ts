import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(import.meta.dirname, '..', '.env.local') })

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const greekToLatin: Record<string, string> = {
  'Α': 'A', 'Β': 'V', 'Γ': 'G', 'Δ': 'D', 'Ε': 'E', 'Ζ': 'Z', 'Η': 'I', 'Θ': 'TH',
  'Ι': 'I', 'Κ': 'K', 'Λ': 'L', 'Μ': 'M', 'Ν': 'N', 'Ξ': 'X', 'Ο': 'O', 'Π': 'P',
  'Ρ': 'R', 'Σ': 'S', 'Τ': 'T', 'Υ': 'Y', 'Φ': 'F', 'Χ': 'CH', 'Ψ': 'PS', 'Ω': 'O',
  'α': 'a', 'β': 'v', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'i', 'θ': 'th',
  'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p',
  'ρ': 'r', 'σ': 's', 'ς': 's', 'τ': 't', 'υ': 'y', 'φ': 'f', 'χ': 'ch', 'ψ': 'ps', 'ω': 'o',
  'ά': 'a', 'έ': 'e', 'ή': 'i', 'ί': 'i', 'ό': 'o', 'ύ': 'y', 'ώ': 'o', 'ΐ': 'i', 'ΰ': 'y',
  'Ά': 'A', 'Έ': 'E', 'Ή': 'I', 'Ί': 'I', 'Ό': 'O', 'Ύ': 'Y', 'Ώ': 'O',
}

function transliterateSlug(slug: string): string {
  let result = ''
  for (const ch of slug) {
    result += greekToLatin[ch] ?? ch
  }
  // Ensure lowercase, clean up
  return result
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function main() {
  const { data: categories, error } = await s.from('categories').select('id, slug').order('slug')
  if (error) { console.error(error); return }

  let updated = 0
  for (const cat of categories!) {
    const hasGreek = /[\u0370-\u03FF\u1F00-\u1FFF]/.test(cat.slug)
    if (!hasGreek) continue

    const newSlug = transliterateSlug(cat.slug)
    console.log(`${cat.slug} → ${newSlug}`)

    const { error: upErr } = await s.from('categories').update({ slug: newSlug }).eq('id', cat.id)
    if (upErr) {
      console.error(`  ERROR updating ${cat.id}:`, upErr.message)
    } else {
      updated++
    }
  }
  console.log(`\nUpdated ${updated} category slugs`)
}

main()
