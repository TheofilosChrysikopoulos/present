/**
 * Product Import Script
 *
 * Reads review_corrections.json files from the CORFU and GREECE folders,
 * extracts images from PSD files, and imports products into the Supabase database.
 *
 * Usage:
 *   npx tsx import-products.ts --dry-run                # Test mode (no DB writes)
 *   npx tsx import-products.ts --dry-run --with-images   # Test mode + extract images
 *   npx tsx import-products.ts                           # Real import
 */

import fs from 'fs'
import path from 'path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readPsd, initializeCanvas, type Layer } from 'ag-psd'
import sharp from 'sharp'
import dotenv from 'dotenv'
import { createCanvas } from '@napi-rs/canvas'

// Initialize ag-psd with a Node.js canvas implementation
initializeCanvas(
  (width: number, height: number) => createCanvas(width, height) as any
)

// ── Configuration ──────────────────────────────────────────────────────
dotenv.config({ path: path.resolve(import.meta.dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const STORAGE_BUCKET = 'product-images'

const DRY_RUN = process.argv.includes('--dry-run')
const WITH_IMAGES = process.argv.includes('--with-images')

const EXTRACT_ROOT = 'C:\\MyStuff\\Projects\\ExtractProducts'
const OUTPUT_ROOT = path.join(EXTRACT_ROOT, 'output')

const REGIONS = ['CORFU', 'GREECE'] as const
type Region = (typeof REGIONS)[number]

// Path rewrite: old network path → local path
const PATH_REWRITES: Record<string, string> = {
  '\\\\192.168.1.22\\shared_files_new\\CORFU\\': path.join(EXTRACT_ROOT, 'CORFU') + '\\',
  '\\\\192.168.1.22\\shared_files_new\\GREECE\\': path.join(EXTRACT_ROOT, 'GREECE') + '\\',
}

// ── Types ──────────────────────────────────────────────────────────────

interface ReviewJson {
  version: number
  saved_at: string
  pages: PageData[]
}

interface PageData {
  psd_path: string
  filename: string
  rel_dir: string
  canvas: [number, number]
  products: ProductData[]
  images: ImageData[]
}

interface ProductData {
  code: string
  price: string
  old_price: string
  has_offer: boolean
  description: string
  company: string
  image_indices: number[]
  variants: VariantData[]
}

interface VariantData {
  name: string
  image_ids: number[]
}

interface ImageData {
  id: number
  name: string
  left: number
  top: number
  width: number
  height: number
  merged_from?: MergedLayer[]
}

interface MergedLayer {
  id: number
  name: string
  left: number
  top: number
  width: number
  height: number
}

// ── Parsed product for import ──────────────────────────────────────────
interface ParsedProduct {
  sku: string
  name_en: string
  name_el: string
  description_en: string
  description_el: string
  price: number
  discount_price: number | null
  company: string
  region: 'corfu' | 'greece' | 'all'
  categoryPath: string[]       // e.g. ['ΜΑΣΚΕΣ-ΓΥΑΛΑΚΙΑ', 'ΣΕΤ ΜΑΣΚΑ-ΑΝΑΠΝΕΥΣΤΗΡΑΣ']
  variants: ParsedVariant[]
  isBizouMerge?: boolean       // ΜΠΙΖΟΥ grouped product
}

interface ParsedVariant {
  sku_suffix: string
  is_primary: boolean
  sort_order: number
  images: ParsedImage[]
}

interface ParsedImage {
  imageData: ImageData         // Reference to the JSON image info
  psdPath: string              // Resolved local PSD path
  allPageImages: ImageData[]   // All images in the page (for recursive nested merge lookup)
  is_primary: boolean
  sort_order: number
}

// ── Utils ──────────────────────────────────────────────────────────────

function rewritePsdPath(psdPath: string): string {
  for (const [oldPrefix, newPrefix] of Object.entries(PATH_REWRITES)) {
    if (psdPath.startsWith(oldPrefix)) {
      return psdPath.replace(oldPrefix, newPrefix)
    }
  }
  return psdPath
}

/** Strip numbers, dots, leading/trailing symbols, and dashes used as separators from folder names */
function cleanCategoryName(folderName: string): string {
  // Remove leading "N. " pattern (e.g., "1. ΚΑΠΕΛΑ" → "ΚΑΠΕΛΑ")
  let cleaned = folderName.replace(/^\d+\.\s*/, '')
  // Remove any remaining numbers
  cleaned = cleaned.replace(/\d+/g, '')
  // Remove symbols except spaces and hyphens within words
  cleaned = cleaned.replace(/[^a-zA-Zα-ωΑ-Ωά-ώ\s\-]/g, '')
  // Collapse multiple spaces/hyphens
  cleaned = cleaned.replace(/[\s\-]+/g, ' ').trim()
  return cleaned
}

/** Create a URL-friendly slug from a name (transliterates Greek to Latin) */
function slugify(name: string): string {
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
  let transliterated = ''
  for (const ch of name) {
    transliterated += greekToLatin[ch] ?? ch
  }
  return transliterated
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Sanitize a string for use in Supabase storage paths (ASCII only) */
function sanitizeForStorage(str: string): string {
  // Map common Greek letters to Latin equivalents
  const greekToLatin: Record<string, string> = {
    'Α': 'A', 'Β': 'B', 'Γ': 'G', 'Δ': 'D', 'Ε': 'E', 'Ζ': 'Z', 'Η': 'H', 'Θ': 'TH',
    'Ι': 'I', 'Κ': 'K', 'Λ': 'L', 'Μ': 'M', 'Ν': 'N', 'Ξ': 'X', 'Ο': 'O', 'Π': 'P',
    'Ρ': 'R', 'Σ': 'S', 'Τ': 'T', 'Υ': 'Y', 'Φ': 'F', 'Χ': 'CH', 'Ψ': 'PS', 'Ω': 'O',
    'α': 'a', 'β': 'b', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'h', 'θ': 'th',
    'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p',
    'ρ': 'r', 'σ': 's', 'ς': 's', 'τ': 't', 'υ': 'y', 'φ': 'f', 'χ': 'ch', 'ψ': 'ps', 'ω': 'o',
    'ά': 'a', 'έ': 'e', 'ή': 'h', 'ί': 'i', 'ό': 'o', 'ύ': 'y', 'ώ': 'o', 'ΐ': 'i', 'ΰ': 'y',
    'Ά': 'A', 'Έ': 'E', 'Ή': 'H', 'Ί': 'I', 'Ό': 'O', 'Ύ': 'Y', 'Ώ': 'O',
  }
  return str.replace(/./g, ch => greekToLatin[ch] ?? ch).replace(/[^a-zA-Z0-9\-_./]/g, '_')
}

/** Replace Greek lookalike letters in SKUs with their Latin equivalents */
function sanitizeSku(sku: string): string {
  const greekLookalikes: Record<string, string> = {
    'Α': 'A', 'Β': 'B', 'Ε': 'E', 'Ζ': 'Z', 'Η': 'H', 'Ι': 'I', 'Κ': 'K',
    'Μ': 'M', 'Ν': 'N', 'Ο': 'O', 'Ρ': 'R', 'Τ': 'T', 'Υ': 'Y', 'Χ': 'X',
    'α': 'a', 'β': 'b', 'ε': 'e', 'ζ': 'z', 'η': 'h', 'ι': 'i', 'κ': 'k',
    'μ': 'm', 'ν': 'n', 'ο': 'o', 'ρ': 'r', 'τ': 't', 'υ': 'y', 'χ': 'x',
    'Γ': 'G', 'Δ': 'D', 'Θ': 'TH', 'Λ': 'L', 'Ξ': 'X', 'Π': 'P', 'Σ': 'S',
    'Φ': 'F', 'Ψ': 'PS', 'Ω': 'O',
    'γ': 'g', 'δ': 'd', 'θ': 'th', 'λ': 'l', 'ξ': 'x', 'π': 'p', 'σ': 's', 'ς': 's',
    'φ': 'f', 'ψ': 'ps', 'ω': 'o',
    'ά': 'a', 'έ': 'e', 'ή': 'h', 'ί': 'i', 'ό': 'o', 'ύ': 'y', 'ώ': 'o',
    'Ά': 'A', 'Έ': 'E', 'Ή': 'H', 'Ί': 'I', 'Ό': 'O', 'Ύ': 'Y', 'Ώ': 'O',
  }
  return sku.replace(/./g, ch => greekLookalikes[ch] ?? ch)
}

/** Parse Greek price string like "4,90€" → number */
function parsePrice(priceStr: string): number {
  const cleaned = priceStr.replace('€', '').replace(',', '.').trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

/**
 * Parse description text to extract:
 * - title (if identifiable)
 * - dimensions/weight line (if present)
 * - remaining description lines
 *
 * Rules:
 * - | and • are line breaks (collapsed if adjacent)
 * - Dimensions (x, cm, mm, gr, Lt) go first
 * - Title is the first text element that isn't a dimension
 * - Description is everything else
 */
function parseDescription(raw: string): { title: string; description: string } {
  if (!raw || !raw.trim()) return { title: '', description: '' }

  // Split on | and • (both are line separators), collapse adjacent separators
  const lines = raw
    .split(/[|•]+/)
    .map(l => l.trim())
    .filter(Boolean)

  if (lines.length === 0) return { title: '', description: '' }

  // Detect dimension/size lines: contain measurement patterns
  const dimensionPattern = /\b\d+\s*[xX×]\s*\d+|\b\d+\s*(cm|mm|gr|lt|ml|kg|m)\b/i

  const dimensionLines: string[] = []
  const contentLines: string[] = []

  for (const line of lines) {
    if (dimensionPattern.test(line)) {
      dimensionLines.push(line)
    } else {
      contentLines.push(line)
    }
  }

  // Title detection: first content line is likely the title if it's short
  // and doesn't look like a specification (no bullet-point-style specs)
  let title = ''
  const specPattern = /^(Σκελετός|Φακοί|Λουράκι|Αναπνευστήρας|Ρυθμιζόμενο|Σακουλάκι|Size|UV|Κατάλληλ|Διαφάνο|Μαύρο|Χρώμα)/i

  if (contentLines.length > 0) {
    const firstLine = contentLines[0]
    // A line is likely a title if shorter than 60 chars, not a spec, and not starting with specific words
    if (firstLine.length <= 60 && !specPattern.test(firstLine)) {
      title = firstLine
      contentLines.shift()
    }
  }

  // Build description: dimensions first, then remaining content lines
  const descParts = [...dimensionLines, ...contentLines]
  const description = descParts.join('\n')

  return { title, description }
}

// ── PSD Image Extraction ───────────────────────────────────────────────

// Cache for PSD data — limited size to avoid OOM
const psdCache = new Map<string, ReturnType<typeof readPsd>>()
const PSD_CACHE_MAX = 3  // keep at most N PSDs in memory

function loadPsd(psdPath: string) {
  if (psdCache.has(psdPath)) return psdCache.get(psdPath)!

  // Evict oldest entries if cache is full
  while (psdCache.size >= PSD_CACHE_MAX) {
    const firstKey = psdCache.keys().next().value!
    psdCache.delete(firstKey)
  }

  const buffer = fs.readFileSync(psdPath)
  const psd = readPsd(buffer, {
    skipCompositeImageData: true,
    skipThumbnail: true,
  })
  psdCache.set(psdPath, psd)
  return psd
}

/** Find a layer in the PSD by its original name */
function findLayer(layers: Layer[] | undefined, targetName: string): Layer | null {
  if (!layers) return null
  for (const layer of layers) {
    if (layer.name === targetName) return layer
    const found = findLayer(layer.children, targetName)
    if (found) return found
  }
  return null
}

/** Find a layer by index (flattened order matching how the extraction tool assigns IDs) */
function flattenLayers(layers: Layer[] | undefined): Layer[] {
  if (!layers) return []
  const result: Layer[] = []
  for (const layer of layers) {
    if (layer.children && layer.children.length > 0) {
      result.push(...flattenLayers(layer.children))
    } else {
      result.push(layer)
    }
  }
  return result
}

/**
 * Extract a single image from a PSD file.
 * For non-merged images: extract the layer directly.
 * For merged images: composite multiple layers together.
 */
async function extractImage(
  psdPath: string,
  imageInfo: ImageData,
  allPageImages: ImageData[] = [],
): Promise<Buffer> {
  const psd = loadPsd(psdPath)
  const flatLayers = flattenLayers(psd.children)

  if (imageInfo.merged_from && imageInfo.merged_from.length > 0) {
    // Merged image: composite layers onto a canvas
    return await compositemergedLayers(imageInfo, flatLayers, psdPath, allPageImages)
  } else {
    // Look up by name + position (extraction tool IDs don't match our flat indices)
    const layer = flatLayers.find(l =>
      l.name === imageInfo.name && l.left === imageInfo.left && l.top === imageInfo.top
    ) ?? flatLayers.find(l => l.name === imageInfo.name)
    if (!layer || !layer.canvas) {
      console.warn(`  ⚠ Layer "${imageInfo.name}" not found or has no canvas in ${path.basename(psdPath)}`)
      // Return a placeholder 1x1 transparent PNG
      return await sharp({ create: { width: 1, height: 1, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer()
    }

    // Get raw RGBA pixel data from the layer's canvas
    const width = layer.canvas.width
    const height = layer.canvas.height
    const ctx = layer.canvas.getContext('2d')!
    const imgData = ctx.getImageData(0, 0, width, height)

    return await sharp(Buffer.from(imgData.data.buffer), {
      raw: { width, height, channels: 4 }
    }).png().toBuffer()
  }
}

/**
 * Composite merged layers: create a canvas of the merged area size
 * and place each sub-layer at its correct position.
 *
 * Layer lookup: Match by name + position since extraction tool IDs don't
 * correspond to our flattenLayers() indices.
 *
 * Layer ordering: ag-psd children are bottom-to-top, so lower flat indices
 * sit behind higher ones. We sort by flat index ascending so sharp.composite()
 * draws background first and foreground last (on top).
 */
async function compositemergedLayers(
  imageInfo: ImageData,
  flatLayers: Layer[],
  psdPath: string,
  allPageImages: ImageData[],
): Promise<Buffer> {
  const { left: mergedLeft, top: mergedTop, width: mergedWidth, height: mergedHeight } = imageInfo

  // Find each sublayer in the flat list by name + position (handles duplicate names)
  const resolved = imageInfo.merged_from!.map((sublayer, originalIdx) => {
    const flatIndex = flatLayers.findIndex(l =>
      l.name === sublayer.name && l.left === sublayer.left && l.top === sublayer.top
    )
    // Fallback to name-only match if position doesn't match (e.g. rounding)
    const idx = flatIndex >= 0
      ? flatIndex
      : flatLayers.findIndex(l => l.name === sublayer.name)
    // For unresolved sublayers (nested merges), assign a high sort index so they
    // draw on top of resolved leaf layers. Preserve their relative merged_from order.
    const sortIndex = idx >= 0 ? idx : flatLayers.length + originalIdx
    return { sublayer, flatIndex: idx, sortIndex, layer: idx >= 0 ? flatLayers[idx] : null }
  })

  // Sort by sortIndex ascending: lower = background, higher = foreground
  resolved.sort((a, b) => a.sortIndex - b.sortIndex)

  const compositeInputs: sharp.OverlayOptions[] = []

  for (const { sublayer, flatIndex, layer } of resolved) {
    if (!layer || !layer.canvas) {
      // Check if this sublayer is itself a nested merged image
      if (sublayer.name.startsWith('Merged')) {
        const nestedImage = allPageImages.find(img =>
          img.name === sublayer.name && img.left === sublayer.left && img.top === sublayer.top
        )
        if (nestedImage && nestedImage.merged_from && nestedImage.merged_from.length > 0) {
          const nestedBuf = await compositemergedLayers(nestedImage, flatLayers, psdPath, allPageImages)
          compositeInputs.push({
            input: nestedBuf,
            left: Math.max(0, sublayer.left - mergedLeft),
            top: Math.max(0, sublayer.top - mergedTop),
          })
          continue
        }
      }
      console.warn(`  ⚠ Sublayer "${sublayer.name}" not found or has no canvas`)
      continue
    }

    const w = layer.canvas.width
    const h = layer.canvas.height
    const ctx = layer.canvas.getContext('2d')!
    const imgData = ctx.getImageData(0, 0, w, h)

    const layerPng = await sharp(Buffer.from(imgData.data.buffer), {
      raw: { width: w, height: h, channels: 4 }
    }).png().toBuffer()

    // Position relative to the merged image area
    const offsetLeft = sublayer.left - mergedLeft
    const offsetTop = sublayer.top - mergedTop

    compositeInputs.push({
      input: layerPng,
      left: Math.max(0, offsetLeft),
      top: Math.max(0, offsetTop),
    })
  }

  if (compositeInputs.length === 0) {
    // No layers found — return transparent placeholder
    return await sharp({
      create: { width: mergedWidth || 1, height: mergedHeight || 1, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    }).png().toBuffer()
  }

  return await sharp({
    create: {
      width: mergedWidth,
      height: mergedHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    }
  })
    .composite(compositeInputs)
    .png()
    .toBuffer()
}

// ── Category Management ────────────────────────────────────────────────

interface CategoryInfo {
  id: string
  slug: string
  name: string
  parent_id: string | null
}

const categoryCache = new Map<string, CategoryInfo>()

async function ensureCategory(
  supabase: SupabaseClient,
  name: string,
  parentId: string | null,
): Promise<CategoryInfo> {
  const cacheKey = `${parentId ?? 'root'}::${name}`
  if (categoryCache.has(cacheKey)) return categoryCache.get(cacheKey)!

  const slug = slugify(name)

  // Check if exists
  let q = supabase
    .from('categories')
    .select('id, slug, name_en, name_el, parent_id')
    .eq('slug', slug)

  if (parentId) {
    q = q.eq('parent_id', parentId)
  } else {
    q = q.is('parent_id', null)
  }

  const { data: existing } = await q.maybeSingle()

  if (existing) {
    const info: CategoryInfo = { id: existing.id, slug: existing.slug, name, parent_id: existing.parent_id }
    categoryCache.set(cacheKey, info)
    return info
  }

  if (DRY_RUN) {
    const fakeId = `dry-${slug}-${parentId ?? 'root'}`
    const info: CategoryInfo = { id: fakeId, slug, name, parent_id: parentId }
    categoryCache.set(cacheKey, info)
    return info
  }

  // If slug already exists under a different parent, make it unique
  let uniqueSlug = slug
  const { data: slugCheck } = await supabase
    .from('categories')
    .select('id, slug')
    .eq('slug', slug)
    .maybeSingle()

  if (slugCheck) {
    // Slug exists under another parent — append suffix
    let suffix = 2
    while (true) {
      const candidate = `${slug}-${suffix}`
      const { data: check } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', candidate)
        .maybeSingle()
      if (!check) { uniqueSlug = candidate; break }
      suffix++
    }
  }

  // Create
  const { data: created, error } = await supabase
    .from('categories')
    .insert({
      slug: uniqueSlug,
      name_en: name,
      name_el: name, // Same name for now (Greek product data)
      parent_id: parentId,
      sort_order: 0,
    })
    .select('id, slug, name_en, parent_id')
    .single()

  if (error) throw new Error(`Failed to create category "${name}": ${error.message}`)

  const info: CategoryInfo = { id: created.id, slug: created.slug, name, parent_id: created.parent_id }
  categoryCache.set(cacheKey, info)
  return info
}

async function ensureCategoryPath(
  supabase: SupabaseClient,
  categoryPath: string[],
): Promise<string> {
  let parentId: string | null = null
  for (const segment of categoryPath) {
    const cat = await ensureCategory(supabase, segment, parentId)
    parentId = cat.id
  }
  return parentId!
}

// ── Load hidden images from review.html ─────────────────────────────────
/**
 * The extraction tool embeds ALL images (including hidden intermediate merges)
 * in review.html, but review_corrections.json only has visible images.
 * Nested merged sublayers (e.g. "Merged (#40+#41)") are defined as hidden
 * images in review.html with their own merged_from arrays.
 * This function extracts those hidden images so nested merges can be resolved.
 */
function loadHiddenImagesFromHtml(jsonPath: string, pageIndex: number): ImageData[] {
  const htmlPath = path.join(path.dirname(jsonPath), 'review.html')
  if (!fs.existsSync(htmlPath)) return []

  const html = fs.readFileSync(htmlPath, 'utf-8')

  // Find the Nth page's images array (each page has "images":[...])
  let searchFrom = 0
  for (let p = 0; p <= pageIndex; p++) {
    const idx = html.indexOf('"images":[', searchFrom)
    if (idx < 0) return []
    if (p === pageIndex) {
      // Found the right page's images array - extract it
      const arrayStart = idx + '"images":'.length
      let depth = 0
      let arrayEnd = -1
      for (let i = arrayStart; i < html.length; i++) {
        if (html[i] === '[') depth++
        else if (html[i] === ']') {
          depth--
          if (depth === 0) { arrayEnd = i + 1; break }
        }
      }
      if (arrayEnd < 0) return []

      const imagesJson = html.substring(arrayStart, arrayEnd)
      try {
        const allImages: Array<{
          id: number; name: string; left: number; top: number
          width: number; height: number; _hidden?: boolean
          merged_from?: MergedLayer[]
        }> = JSON.parse(imagesJson)

        // Return hidden images that have merged_from (intermediate merges)
        return allImages
          .filter(img => img._hidden && img.merged_from && img.merged_from.length > 0)
          .map(img => ({
            id: img.id, name: img.name,
            left: img.left, top: img.top,
            width: img.width, height: img.height,
            merged_from: img.merged_from,
          }))
      } catch {
        console.warn(`  ⚠ Failed to parse images from ${htmlPath}`)
        return []
      }
    }
    searchFrom = idx + 1
  }
  return []
}

// ── Discovery: Find all review_corrections.json ────────────────────────

interface DiscoveredJson {
  jsonPath: string
  region: Region
  categoryPath: string[]  // e.g. ['ΜΑΣΚΕΣ ΓΥΑΛΑΚΙΑ', 'ΣΕΤ ΜΑΣΚΑ ΑΝΑΠΝΕΥΣΤΗΡΑΣ']
}

function discoverJsonFiles(): DiscoveredJson[] {
  const results: DiscoveredJson[] = []

  for (const region of REGIONS) {
    const regionDir = path.join(OUTPUT_ROOT, region)
    if (!fs.existsSync(regionDir)) continue

    function walk(dir: string, categoryParts: string[]) {
      const entries = fs.readdirSync(dir, { withFileTypes: true })

      // Check if this folder has a review_corrections.json
      const hasJson = entries.some(e => e.isFile() && e.name === 'review_corrections.json')
      if (hasJson) {
        results.push({
          jsonPath: path.join(dir, 'review_corrections.json'),
          region,
          categoryPath: categoryParts,
        })
      }

      // Recurse into subdirectories
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'untitled folder') {
          const name = cleanCategoryName(entry.name)
          if (name) {
            walk(path.join(dir, entry.name), [...categoryParts, name])
          }
        }
      }
    }

    walk(regionDir, [])
  }

  return results
}

// ── Product Parsing ────────────────────────────────────────────────────

function parseProducts(discovered: DiscoveredJson): ParsedProduct[] {
  const raw = fs.readFileSync(discovered.jsonPath, 'utf-8')
  const json: ReviewJson = JSON.parse(raw)

  const products: ParsedProduct[] = []
  const isBizou = discovered.categoryPath.some(p => p.toUpperCase().includes('ΜΠΙΖΟΥ'))

  // For ΜΠΙΖΟΥ: group products by base code (before the dash)
  const bizouGroups = new Map<string, { products: ProductData[]; images: Map<number, { imageData: ImageData; psdPath: string; allPageImages: ImageData[] }> }>()

  for (let pageIdx = 0; pageIdx < json.pages.length; pageIdx++) {
    const page = json.pages[pageIdx]
    const localPsdPath = rewritePsdPath(page.psd_path)

    // Load hidden intermediate merges from review.html (for nested merge resolution)
    const hiddenImages = loadHiddenImagesFromHtml(discovered.jsonPath, pageIdx)
    const allPageImages = [...page.images, ...hiddenImages]

    // Build image lookup for this page
    const imageMap = new Map<number, ImageData>()
    for (const img of page.images) {
      imageMap.set(img.id, img)
    }

    for (const prod of page.products) {
      const region = discovered.region.toLowerCase() as 'corfu' | 'greece'

      if (isBizou && prod.code.includes('-')) {
        // ΜΠΙΖΟΥ grouping: group by base code
        const baseSku = prod.code.split('-')[0]
        if (!bizouGroups.has(baseSku)) {
          bizouGroups.set(baseSku, { products: [], images: new Map() })
        }
        const group = bizouGroups.get(baseSku)!
        group.products.push(prod)
        // Add images for this product
        for (const imgId of prod.image_indices) {
          const imgData = imageMap.get(imgId)
          if (imgData) {
            group.images.set(imgId, { imageData: imgData, psdPath: localPsdPath, allPageImages })
          }
        }
        continue
      }

      // Normal product
      const parsed = parseSingleProduct(prod, imageMap, localPsdPath, region, discovered.categoryPath, allPageImages)
      products.push(parsed)
    }
  }

  // Process ΜΠΙΖΟΥ groups
  if (isBizou) {
    for (const [baseSku, group] of bizouGroups) {
      const firstProd = group.products[0]
      const region = discovered.region.toLowerCase() as 'corfu' | 'greece'
      const { title, description } = parseDescription(firstProd.description)

      const variants: ParsedVariant[] = []
      let sortIdx = 0

      // Sort products by suffix for consistent ordering
      const sortedProds = [...group.products].sort((a, b) => {
        const suffA = parseInt(a.code.split('-')[1] || '0')
        const suffB = parseInt(b.code.split('-')[1] || '0')
        return suffA - suffB
      })

      for (const prod of sortedProds) {
        const suffix = prod.code.includes('-') ? '-' + prod.code.split('-').slice(1).join('-') : ''
        const isPrimary = sortIdx === 0

        // Each product-in-group becomes a variant of the merged product
        // Get images from the first variant (which is the default view of this sub-product)
        const images: ParsedImage[] = []
        let imgSortOrder = 0

        for (const v of prod.variants) {
          for (const imgId of v.image_ids) {
            const imgInfo = group.images.get(imgId)
            if (imgInfo) {
              images.push({
                imageData: imgInfo.imageData,
                psdPath: imgInfo.psdPath,
                allPageImages: imgInfo.allPageImages,
                is_primary: imgSortOrder === 0,
                sort_order: imgSortOrder++,
              })
            }
          }
        }

        variants.push({
          sku_suffix: suffix,
          is_primary: isPrimary,
          sort_order: sortIdx++,
          images,
        })
      }

      products.push({
        sku: sanitizeSku(baseSku.toUpperCase().replace(/\s+/g, '-')),
        name_en: title || baseSku,
        name_el: title || baseSku,
        description_en: description,
        description_el: description,
        price: parsePrice(firstProd.price),
        discount_price: firstProd.has_offer ? parsePrice(firstProd.price) : null,
        company: firstProd.company || '',
        region,
        categoryPath: discovered.categoryPath,
        variants,
        isBizouMerge: true,
      })
    }
  }

  return products
}

function parseSingleProduct(
  prod: ProductData,
  imageMap: Map<number, ImageData>,
  psdPath: string,
  region: 'corfu' | 'greece',
  categoryPath: string[],
  allPageImages: ImageData[],
): ParsedProduct {
  const { title, description } = parseDescription(prod.description)
  const price = parsePrice(prod.price)
  const oldPrice = prod.old_price ? parsePrice(prod.old_price) : null

  // If has_offer: old_price is the original, current price is the discount
  let finalPrice = price
  let discountPrice: number | null = null
  if (prod.has_offer && oldPrice && oldPrice > price) {
    finalPrice = oldPrice
    discountPrice = price
  }

  const variants: ParsedVariant[] = []

  for (let vi = 0; vi < prod.variants.length; vi++) {
    const v = prod.variants[vi]
    const images: ParsedImage[] = []

    for (let ii = 0; ii < v.image_ids.length; ii++) {
      const imgId = v.image_ids[ii]
      const imgData = imageMap.get(imgId)
      if (imgData) {
        images.push({
          imageData: imgData,
          psdPath,
          allPageImages,
          is_primary: ii === 0,
          sort_order: ii,
        })
      }
    }

    variants.push({
      sku_suffix: vi === 0 ? '' : `-V${vi + 1}`,
      is_primary: vi === 0,
      sort_order: vi,
      images,
    })
  }

  return {
    sku: sanitizeSku(prod.code.toUpperCase().replace(/\s+/g, '-')),
    name_en: title || prod.code,
    name_el: title || prod.code,
    description_en: description,
    description_el: description,
    price: finalPrice,
    discount_price: discountPrice,
    company: prod.company || '',
    region,
    categoryPath,
    variants,
  }
}

// ── Image Upload ───────────────────────────────────────────────────────

async function uploadImage(
  supabase: SupabaseClient,
  imageBuffer: Buffer,
  storagePath: string,
): Promise<string> {
  if (DRY_RUN) {
    return storagePath
  }

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, imageBuffer, {
      contentType: 'image/png',
      upsert: true,
    })

  if (error) throw new Error(`Upload failed for ${storagePath}: ${error.message}`)
  return data.path
}

// ── Database Import ────────────────────────────────────────────────────

async function importProduct(
  supabase: SupabaseClient,
  product: ParsedProduct,
  categoryId: string,
  stats: ImportStats,
): Promise<void> {
  // Check for existing product by SKU
  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('sku', product.sku)
    .maybeSingle()

  if (existing) {
    console.log(`  ⏭ Product ${product.sku} already exists, skipping`)
    stats.skipped++
    return
  }

  if (DRY_RUN) {
    console.log(`  ✅ [DRY] Would create product ${product.sku} → ${product.name_el}`)
    console.log(`         Price: €${product.price}${product.discount_price ? ` (sale: €${product.discount_price})` : ''}`)
    console.log(`         Region: ${product.region}, Category: ${product.categoryPath.join(' > ')}`)
    console.log(`         Variants: ${product.variants.length}, Images: ${product.variants.reduce((s, v) => s + v.images.length, 0)}`)
    if (product.company) console.log(`         Company: ${product.company}`)
    stats.created++
    return
  }

  // Create product
  const { data: savedProduct, error: productError } = await supabase
    .from('products')
    .insert({
      sku: product.sku,
      name_en: product.name_en,
      name_el: product.name_el,
      description_en: product.description_en || null,
      description_el: product.description_el || null,
      price: product.price,
      discount_price: product.discount_price,
      moq: 1,
      category_id: categoryId,
      tags: [],
      region: product.region,
      company: product.company,
      sellable_variants: true,
      is_featured: false,
      is_new_arrival: false,
      is_active: true,
      sort_order: 0,
    })
    .select('id')
    .single()

  if (productError) {
    console.error(`  ❌ Failed to create product ${product.sku}: ${productError.message}`)
    stats.errors++
    return
  }

  const productId = savedProduct.id

  // Create variants and images
  for (const variant of product.variants) {
    const { data: savedVariant, error: variantError } = await supabase
      .from('product_variants')
      .insert({
        product_id: productId,
        sku_suffix: variant.sku_suffix || null,
        color_name_en: variant.sku_suffix ? `Variant ${variant.sort_order + 1}` : 'Default',
        color_name_el: variant.sku_suffix ? `Παραλλαγή ${variant.sort_order + 1}` : 'Προεπιλογή',
        hex_color: null,
        variant_type: 'image',
        is_primary: variant.is_primary,
        sort_order: variant.sort_order,
      })
      .select('id')
      .single()

    if (variantError) {
      console.error(`  ❌ Failed to create variant for ${product.sku}: ${variantError.message}`)
      stats.errors++
      continue
    }

    const variantId = savedVariant.id

    // Extract and upload images
    for (const img of variant.images) {
      try {
        const imageBuffer = await extractImage(img.psdPath, img.imageData, img.allPageImages)
        const storagePath = `products/${sanitizeForStorage(product.sku)}/${variantId}/${img.imageData.id}.png`
        await uploadImage(supabase, imageBuffer, storagePath)

        await supabase.from('variant_images').insert({
          variant_id: variantId,
          storage_path: storagePath,
          alt_en: product.name_en,
          alt_el: product.name_el,
          sort_order: img.sort_order,
          is_primary: img.is_primary,
        })

        stats.imagesUploaded++
      } catch (err: any) {
        console.error(`  ❌ Failed to extract/upload image ${img.imageData.name} for ${product.sku}: ${err.message}`)
        stats.errors++
      }
    }
  }

  stats.created++
}

// ── Main ───────────────────────────────────────────────────────────────

interface ImportStats {
  jsonFiles: number
  totalProducts: number
  created: number
  skipped: number
  errors: number
  imagesUploaded: number
  categories: number
}

async function main() {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  Product Import Tool ${DRY_RUN ? '(DRY RUN — no database changes)' : '(LIVE MODE)'}${WITH_IMAGES ? ' + IMAGE EXTRACTION' : ''}`)
  console.log(`${'═'.repeat(60)}\n`)

  if (!DRY_RUN) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
      process.exit(1)
    }
  }

  const supabase = DRY_RUN
    ? null as unknown as SupabaseClient
    : createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

  // Only create a real client for non-dry-run, but we need it for category checks in dry-run too
  const supabaseForCategories = (SUPABASE_URL && SUPABASE_KEY)
    ? createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null

  const stats: ImportStats = {
    jsonFiles: 0,
    totalProducts: 0,
    created: 0,
    skipped: 0,
    errors: 0,
    imagesUploaded: 0,
    categories: 0,
  }

  // 1. Discover all JSON files
  console.log('📁 Discovering review_corrections.json files...')
  const discovered = discoverJsonFiles()
  stats.jsonFiles = discovered.length
  console.log(`   Found ${discovered.length} JSON files\n`)

  // 2. Parse all products
  console.log('📋 Parsing products...')
  const allProducts: { product: ParsedProduct; discovered: DiscoveredJson }[] = []

  for (const disc of discovered) {
    try {
      const products = parseProducts(disc)
      for (const p of products) {
        allProducts.push({ product: p, discovered: disc })
      }
    } catch (err: any) {
      console.error(`  ❌ Failed to parse ${disc.jsonPath}: ${err.message}`)
      stats.errors++
    }
  }

  stats.totalProducts = allProducts.length
  console.log(`   Parsed ${allProducts.length} products\n`)

  // 3. Detect cross-region duplicate SKUs (same SKU in both CORFU and GREECE)
  const skuRegionMap = new Map<string, { region: string; categoryPath: string[] }[]>()
  for (const { product } of allProducts) {
    if (!skuRegionMap.has(product.sku)) {
      skuRegionMap.set(product.sku, [])
    }
    skuRegionMap.get(product.sku)!.push({ region: product.region, categoryPath: product.categoryPath })
  }

  // Build cross-region duplicates report
  const crossRegionDuplicates: { sku: string; regions: { region: string; categoryPath: string[] }[] }[] = []
  const crossRegionSkus = new Set<string>()
  for (const [sku, entries] of skuRegionMap) {
    const uniqueRegions = new Set(entries.map(e => e.region))
    if (uniqueRegions.size > 1) {
      crossRegionDuplicates.push({ sku, regions: entries })
      crossRegionSkus.add(sku)
    }
  }

  // Merge cross-region duplicates: set region to 'all' so they're visible to everyone
  if (crossRegionSkus.size > 0) {
    for (const entry of allProducts) {
      if (crossRegionSkus.has(entry.product.sku)) {
        entry.product.region = 'all'
      }
    }
    console.log(`   🔀 Merged ${crossRegionSkus.size} cross-region SKUs → region: 'all'`)
  }

  // Deduplicate: keep one per SKU (cross-region dupes already merged to 'all')
  const seen = new Set<string>()
  const deduped: typeof allProducts = []
  for (const entry of allProducts) {
    if (seen.has(entry.product.sku)) continue
    seen.add(entry.product.sku)
    deduped.push(entry)
  }

  console.log(`   After dedup: ${deduped.length} unique products\n`)

  // 4. Create categories and import products
  console.log('🏗️  Importing products...\n')

  for (const { product } of deduped) {
    try {
      // Ensure category path exists
      let categoryId: string | null = null
      if (product.categoryPath.length > 0) {
        if (DRY_RUN && !supabaseForCategories) {
          categoryId = `dry-cat-${product.categoryPath.join('-')}`
          console.log(`  📂 [DRY] Category: ${product.categoryPath.join(' > ')}`)
        } else {
          categoryId = await ensureCategoryPath(supabaseForCategories ?? supabase, product.categoryPath)
        }
      }

      if (DRY_RUN) {
        // Dry run: just log
        console.log(`  ✅ [DRY] Product ${product.sku}: "${product.name_el}"`)
        console.log(`         Price: €${product.price}${product.discount_price ? ` (sale €${product.discount_price})` : ''}`)
        console.log(`         Region: ${product.region} | Variants: ${product.variants.length} | Images: ${product.variants.reduce((s, v) => s + v.images.length, 0)}`)
        if (product.company) console.log(`         Company: ${product.company}`)
        if (product.isBizouMerge) console.log(`         🔗 ΜΠΙΖΟΥ merged product`)

        // Extract images if requested
        if (WITH_IMAGES) {
          const imgDir = path.join(import.meta.dirname, 'dry-run-output', 'images', product.sku)
          fs.mkdirSync(imgDir, { recursive: true })
          for (const variant of product.variants) {
            for (const img of variant.images) {
              try {
                const imgFile = `v${variant.sort_order}_${img.sort_order}.png`
                const imgPath = path.join(imgDir, imgFile)
                if (!fs.existsSync(imgPath)) {
                  const buf = await extractImage(img.psdPath, img.imageData, img.allPageImages)
                  fs.writeFileSync(imgPath, buf)
                }
                stats.imagesUploaded++
              } catch (err: any) {
                console.warn(`    ⚠ Image extraction failed: ${err.message}`)
                stats.errors++
              }
            }
          }
        }

        console.log()
        stats.created++
      } else {
        await importProduct(supabase, product, categoryId!, stats)
      }
    } catch (err: any) {
      console.error(`  ❌ Failed to import ${product.sku}: ${err.message}`)
      stats.errors++
    }
  }

  // 5. Summary
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  Import Complete ${DRY_RUN ? '(DRY RUN)' : ''}`)
  console.log(`${'═'.repeat(60)}`)
  console.log(`  JSON files processed:  ${stats.jsonFiles}`)
  console.log(`  Total products parsed: ${stats.totalProducts}`)
  console.log(`  Unique products:       ${deduped.length}`)
  console.log(`  Created:               ${stats.created}`)
  console.log(`  Skipped (existing):    ${stats.skipped}`)
  console.log(`  Images uploaded:       ${stats.imagesUploaded}`)
  console.log(`  Errors:                ${stats.errors}`)
  console.log(`${'═'.repeat(60)}\n`)

  // 6. Write dry-run output files
  if (DRY_RUN) {
    const outputDir = path.join(import.meta.dirname, 'dry-run-output')
    fs.mkdirSync(outputDir, { recursive: true })

    // Build product entries for JSON output
    const productEntries = deduped.map(({ product }) => ({
      sku: product.sku,
      name_el: product.name_el,
      name_en: product.name_en,
      description_el: product.description_el,
      description_en: product.description_en,
      price: product.price,
      discount_price: product.discount_price,
      company: product.company,
      region: product.region,
      categoryPath: product.categoryPath,
      isBizouMerge: product.isBizouMerge ?? false,
      variantCount: product.variants.length,
      imageCount: product.variants.reduce((s, v) => s + v.images.length, 0),
      variants: product.variants.map(v => ({
        sku_suffix: v.sku_suffix,
        is_primary: v.is_primary,
        sort_order: v.sort_order,
        imageCount: v.images.length,
        images: WITH_IMAGES ? v.images.map(img => ({
          file: `images/${product.sku}/v${v.sort_order}_${img.sort_order}.png`,
          is_primary: img.is_primary,
          sort_order: img.sort_order,
          width: img.imageData.width,
          height: img.imageData.height,
        })) : undefined,
      })),
    }))

    // Write main results
    const resultsJson = {
      generated_at: new Date().toISOString(),
      hasImages: WITH_IMAGES,
      stats: {
        jsonFiles: stats.jsonFiles,
        totalProducts: stats.totalProducts,
        uniqueProducts: deduped.length,
        crossRegionDuplicates: crossRegionDuplicates.length,
        imagesExtracted: WITH_IMAGES ? stats.imagesUploaded : 0,
        errors: stats.errors,
      },
      crossRegionDuplicates,
      products: productEntries,
    }

    const resultsPath = path.join(outputDir, 'results.json')
    fs.writeFileSync(resultsPath, JSON.stringify(resultsJson, null, 2), 'utf-8')
    console.log(`📄 Dry-run results written to: ${resultsPath}`)

    // Write cross-region duplicates separately for easy review
    if (crossRegionDuplicates.length > 0) {
      const dupPath = path.join(outputDir, 'cross-region-duplicates.json')
      fs.writeFileSync(dupPath, JSON.stringify(crossRegionDuplicates, null, 2), 'utf-8')
      console.log(`📄 Cross-region duplicates written to: ${dupPath}`)
    }

    console.log(`\n🌐 To view results in the browser:`)
    console.log(`   cd scripts/dry-run-output && npx serve .`)
    console.log(`   Then open http://localhost:3000`)
  }

  // Clear PSD cache to free memory
  psdCache.clear()
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
