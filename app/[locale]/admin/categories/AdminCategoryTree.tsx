'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { CategoryWithChildren } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AdminCategoryTreeProps {
  tree: CategoryWithChildren[]
}

interface CategoryDialogState {
  open: boolean
  mode: 'create' | 'edit'
  parentId?: string
  category?: CategoryWithChildren
}

export function AdminCategoryTree({ tree }: AdminCategoryTreeProps) {
  const router = useRouter()
  const [dialog, setDialog] = useState<CategoryDialogState>({
    open: false,
    mode: 'create',
  })
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    id?: string
    name?: string
  }>({ open: false })
  const [saving, setSaving] = useState(false)
  const [formValues, setFormValues] = useState({
    slug: '',
    name_en: '',
    name_el: '',
    sort_order: '0',
  })

  function openCreate(parentId?: string) {
    setFormValues({ slug: '', name_en: '', name_el: '', sort_order: '0' })
    setDialog({ open: true, mode: 'create', parentId })
  }

  function openEdit(cat: CategoryWithChildren) {
    setFormValues({
      slug: cat.slug,
      name_en: cat.name_en,
      name_el: cat.name_el,
      sort_order: String(cat.sort_order),
    })
    setDialog({ open: true, mode: 'edit', category: cat })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()
      const payload = {
        slug: formValues.slug.toLowerCase().replace(/\s+/g, '-'),
        name_en: formValues.name_en,
        name_el: formValues.name_el,
        sort_order: parseInt(formValues.sort_order) || 0,
        parent_id: dialog.parentId ?? null,
      }

      if (dialog.mode === 'edit' && dialog.category) {
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', dialog.category.id)
        if (error) throw error
        toast.success('Category updated')
      } else {
        const { error } = await supabase.from('categories').insert(payload)
        if (error) throw error
        toast.success('Category created')
      }

      setDialog({ open: false, mode: 'create' })
      router.refresh()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteDialog.id) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', deleteDialog.id)
      if (error) throw error
      toast.success('Category deleted')
      setDeleteDialog({ open: false })
      router.refresh()
    } catch {
      toast.error('Failed to delete category')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => openCreate()} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Root Category
        </Button>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-2 space-y-1">
        {tree.length === 0 && (
          <p className="text-sm text-stone-500 text-center py-8">
            No categories yet. Add one to get started.
          </p>
        )}
        {tree.map((cat) => (
          <CategoryTreeNode
            key={cat.id}
            cat={cat}
            depth={0}
            onEdit={openEdit}
            onAddChild={(parentId) => openCreate(parentId)}
            onDelete={(id, name) => setDeleteDialog({ open: true, id, name })}
          />
        ))}
      </div>

      {/* Category form dialog */}
      <Dialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialog.mode === 'edit' ? 'Edit Category' : 'Add Category'}
              {dialog.parentId && ' (subcategory)'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Slug (URL-safe)</Label>
              <Input
                placeholder="e.g. ceramic-mugs"
                value={formValues.slug}
                onChange={(e) =>
                  setFormValues((v) => ({ ...v, slug: e.target.value }))
                }
                className="mt-1 font-mono text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name (English)</Label>
                <Input
                  placeholder="e.g. Ceramic Mugs"
                  value={formValues.name_en}
                  onChange={(e) =>
                    setFormValues((v) => ({ ...v, name_en: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Name (Greek)</Label>
                <Input
                  placeholder="π.χ. Κεραμικές Κούπες"
                  value={formValues.name_el}
                  onChange={(e) =>
                    setFormValues((v) => ({ ...v, name_el: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                min="0"
                value={formValues.sort_order}
                onChange={(e) =>
                  setFormValues((v) => ({ ...v, sort_order: e.target.value }))
                }
                className="mt-1 w-24"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialog((p) => ({ ...p, open: false }))}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((p) => ({ ...p, open }))}
        title="Delete Category"
        description={`Delete "${deleteDialog.name}"? Products in this category will be uncategorized.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={saving}
        destructive
      />
    </div>
  )
}

function CategoryTreeNode({
  cat,
  depth,
  onEdit,
  onAddChild,
  onDelete,
}: {
  cat: CategoryWithChildren
  depth: number
  onEdit: (cat: CategoryWithChildren) => void
  onAddChild: (parentId: string) => void
  onDelete: (id: string, name: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = (cat.children?.length ?? 0) > 0

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-stone-50 group',
          depth > 0 && 'ml-6'
        )}
      >
        <button
          onClick={() => setExpanded((e) => !e)}
          className={cn(
            'flex-shrink-0 text-stone-400',
            !hasChildren && 'invisible'
          )}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-stone-800">{cat.name_en}</span>
          <span className="text-xs text-stone-400 ml-2 font-mono">{cat.slug}</span>
          <span className="text-xs text-stone-400 ml-2">/ {cat.name_el}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-stone-400 hover:text-stone-700"
            onClick={() => onAddChild(cat.id)}
            title="Add subcategory"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-stone-400 hover:text-stone-700"
            onClick={() => onEdit(cat)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-stone-400 hover:text-red-500"
            onClick={() => onDelete(cat.id, cat.name_en)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {hasChildren && expanded && (
        <div>
          {cat.children!.map((child) => (
            <CategoryTreeNode
              key={child.id}
              cat={child}
              depth={depth + 1}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
