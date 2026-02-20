'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ImageUploader, type UploadedImage } from './ImageUploader'
import { VariantEditor, type VariantData } from './VariantEditor'
import { SizeEditor, type SizeData } from './SizeEditor'
import { createClient } from '@/lib/supabase/client'
import type { Category, ProductWithImages } from '@/lib/types'

const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required').regex(/^[A-Z0-9\-_]+$/i, 'Use letters, numbers, hyphens only'),
  name_en: z.string().min(1, 'English name required'),
  name_el: z.string().min(1, 'Greek name required'),
  description_en: z.string().optional(),
  description_el: z.string().optional(),
  price: z.string().min(1, 'Price required'),
  moq: z.string().min(1, 'MOQ required'),
  category_id: z.string().optional(),
  tags: z.string().optional(),
  is_featured: z.boolean(),
  is_new_arrival: z.boolean(),
  is_active: z.boolean(),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
  product?: ProductWithImages
  categories: Category[]
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const locale = useLocale()
  const router = useRouter()
  const base = locale === 'el' ? '/el' : ''

  const [images, setImages] = useState<UploadedImage[]>(
    product?.product_images?.map((img) => ({
      id: img.id,
      storage_path: img.storage_path,
      alt_en: img.alt_en ?? undefined,
      alt_el: img.alt_el ?? undefined,
      sort_order: img.sort_order,
      is_primary: img.is_primary,
    })) ?? []
  )

  const [variants, setVariants] = useState<VariantData[]>(
    product?.product_variants?.map((v) => ({
      id: v.id,
      sku_suffix: v.sku_suffix ?? '',
      color_name_en: v.color_name_en,
      color_name_el: v.color_name_el,
      hex_color: v.hex_color ?? '#e7e5e4',
      variant_type: v.variant_type,
      sort_order: v.sort_order,
      images: (v.variant_images ?? []).map((vi) => ({
        id: vi.id,
        storage_path: vi.storage_path,
        sort_order: vi.sort_order,
        is_primary: vi.is_primary,
      })),
    })) ?? []
  )

  const [sizes, setSizes] = useState<SizeData[]>(
    product?.product_sizes?.map((s) => ({
      id: s.id,
      label_en: s.label_en,
      label_el: s.label_el,
      sku_suffix: s.sku_suffix ?? '',
      sort_order: s.sort_order,
    })) ?? []
  )

  const [saving, setSaving] = useState(false)

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: product?.sku ?? '',
      name_en: product?.name_en ?? '',
      name_el: product?.name_el ?? '',
      description_en: product?.description_en ?? '',
      description_el: product?.description_el ?? '',
      price: product?.price?.toString() ?? '',
      moq: product?.moq?.toString() ?? '1',
      category_id: product?.category_id ?? '',
      tags: product?.tags?.join(', ') ?? '',
      is_featured: product?.is_featured ?? false,
      is_new_arrival: product?.is_new_arrival ?? false,
      is_active: product?.is_active ?? true,
    },
  })

  const productId = product?.id ?? crypto.randomUUID()

  async function onSubmit(values: ProductFormValues) {
    setSaving(true)
    try {
      const supabase = createClient()

      const productData = {
        id: product?.id ?? productId,
        sku: values.sku.toUpperCase(),
        name_en: values.name_en,
        name_el: values.name_el,
        description_en: values.description_en || null,
        description_el: values.description_el || null,
        price: parseFloat(values.price),
        moq: parseInt(values.moq),
        category_id: values.category_id || null,
        tags: values.tags
          ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
        is_featured: values.is_featured,
        is_new_arrival: values.is_new_arrival,
        is_active: values.is_active,
      }

      // Upsert product
      const { data: savedProduct, error: productError } = await supabase
        .from('products')
        .upsert(productData)
        .select()
        .single()

      if (productError) throw productError

      const savedId = savedProduct.id

      // Save images
      if (images.length > 0) {
        // Delete existing images and re-insert
        if (product?.id) {
          await supabase
            .from('product_images')
            .delete()
            .eq('product_id', savedId)
            .not('id', 'in', `(${images.filter((i) => i.id).map((i) => `'${i.id}'`).join(',')})`)
        }

        for (let i = 0; i < images.length; i++) {
          const img = images[i]
          if (img.id) {
            await supabase
              .from('product_images')
              .update({ sort_order: i, is_primary: img.is_primary })
              .eq('id', img.id)
          } else {
            await supabase.from('product_images').insert({
              product_id: savedId,
              storage_path: img.storage_path,
              alt_en: img.alt_en ?? null,
              alt_el: img.alt_el ?? null,
              sort_order: i,
              is_primary: img.is_primary,
            })
          }
        }
      }

      // Save variants
      // Delete variants not in the current list
      if (product?.id) {
        const keepIds = variants.filter((v) => v.id).map((v) => v.id!)
        if (keepIds.length > 0) {
          await supabase
            .from('product_variants')
            .delete()
            .eq('product_id', savedId)
            .not('id', 'in', `(${keepIds.map((id) => `'${id}'`).join(',')})`)
        } else {
          await supabase
            .from('product_variants')
            .delete()
            .eq('product_id', savedId)
        }
      }

      for (let i = 0; i < variants.length; i++) {
        const v = variants[i]
        const variantData = {
          product_id: savedId,
          sku_suffix: v.sku_suffix || null,
          color_name_en: v.color_name_en,
          color_name_el: v.color_name_el,
          hex_color: v.hex_color || null,
          variant_type: v.variant_type,
          sort_order: i,
        }

        if (v.id) {
          await supabase
            .from('product_variants')
            .update(variantData)
            .eq('id', v.id)
        } else {
          const { data: savedVariant } = await supabase
            .from('product_variants')
            .insert({ ...variantData, id: crypto.randomUUID() })
            .select('id')
            .single()

          // Update local variant with new ID so image uploader works
          variants[i] = { ...v, id: savedVariant?.id }
        }
      }

      // Save sizes
      // Delete sizes not in the current list
      if (product?.id) {
        const keepSizeIds = sizes.filter((s) => s.id).map((s) => s.id!)
        if (keepSizeIds.length > 0) {
          await supabase
            .from('product_sizes')
            .delete()
            .eq('product_id', savedId)
            .not('id', 'in', `(${keepSizeIds.map((id) => `'${id}'`).join(',')})`)
        } else {
          await supabase
            .from('product_sizes')
            .delete()
            .eq('product_id', savedId)
        }
      }

      for (let i = 0; i < sizes.length; i++) {
        const s = sizes[i]
        const sizeData = {
          product_id: savedId,
          label_en: s.label_en,
          label_el: s.label_el,
          sku_suffix: s.sku_suffix || null,
          sort_order: i,
        }

        if (s.id) {
          await supabase
            .from('product_sizes')
            .update(sizeData)
            .eq('id', s.id)
        } else {
          await supabase
            .from('product_sizes')
            .insert({ ...sizeData, id: crypto.randomUUID() })
        }
      }

      toast.success('Product saved successfully')
      router.push(`${base}/admin/products`)
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic">
          <TabsList>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="variants">Color Variants</TabsTrigger>
            <TabsTrigger value="sizes">Size Variants</TabsTrigger>
          </TabsList>

          {/* Basic Info */}
          <TabsContent value="basic" className="space-y-5 pt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU / Product Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. MUG-001"
                        className="font-mono"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (€) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="moq"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min. Order Qty *</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" placeholder="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="name_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (English) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name_el"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (Greek) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Όνομα προϊόντος" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="description_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (English)</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="Optional description..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description_el"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Greek)</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="Προαιρετική περιγραφή..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={field.value || '__none__'}
                      onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">No category</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name_en}
                            {cat.parent_id ? ` (sub)` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (comma separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="ceramic, hand-painted, souvenir" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Flags */}
            <div className="flex flex-wrap gap-6">
              {(['is_featured', 'is_new_arrival', 'is_active'] as const).map(
                (key) => (
                  <FormField
                    key={key}
                    control={form.control}
                    name={key}
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-stone-900"
                            checked={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer font-normal m-0">
                          {key === 'is_featured'
                            ? 'Featured product'
                            : key === 'is_new_arrival'
                            ? 'New arrival'
                            : 'Active (visible to buyers)'}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                )
              )}
            </div>
          </TabsContent>

          {/* Images */}
          <TabsContent value="images" className="pt-5">
            <ImageUploader
              images={images}
              onChange={setImages}
              productId={product?.id ?? productId}
            />
          </TabsContent>

          {/* Variants */}
          <TabsContent value="variants" className="pt-5">
            <VariantEditor
              variants={variants}
              onChange={setVariants}
              productId={product?.id ?? productId}
            />
          </TabsContent>

          {/* Sizes */}
          <TabsContent value="sizes" className="pt-5">
            <SizeEditor
              sizes={sizes}
              onChange={setSizes}
            />
          </TabsContent>
        </Tabs>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2 border-t border-stone-200">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Product'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`${base}/admin/products`)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
