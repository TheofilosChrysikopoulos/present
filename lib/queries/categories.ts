import { createClient } from '@/lib/supabase/server'
import type { Category, CategoryWithChildren } from '@/lib/types'

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name_en', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getCategoryTree(): Promise<CategoryWithChildren[]> {
  const categories = await getCategories()

  const map = new Map<string, CategoryWithChildren>()
  const roots: CategoryWithChildren[] = []

  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] })
  }

  for (const cat of categories) {
    const node = map.get(cat.id)!
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id)!.children!.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) return null
  return data
}

export async function getCategoryAncestors(categoryId: string): Promise<Category[]> {
  const categories = await getCategories()
  const map = new Map<string, Category>()
  for (const cat of categories) map.set(cat.id, cat)

  const ancestors: Category[] = []
  let current = map.get(categoryId)
  while (current?.parent_id) {
    const parent = map.get(current.parent_id)
    if (!parent) break
    ancestors.unshift(parent)
    current = parent
  }
  return ancestors
}

// Returns the category and all its descendant IDs (for filtering)
export function getCategoryDescendantIds(
  tree: CategoryWithChildren[],
  targetId: string
): string[] {
  const ids: string[] = []

  function walk(nodes: CategoryWithChildren[]) {
    for (const node of nodes) {
      if (node.id === targetId) {
        collectIds(node, ids)
        return
      }
      if (node.children?.length) walk(node.children)
    }
  }

  function collectIds(node: CategoryWithChildren, acc: string[]) {
    acc.push(node.id)
    for (const child of node.children ?? []) collectIds(child, acc)
  }

  walk(tree)
  return ids
}
