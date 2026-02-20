'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { X, Star, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadProductImage, uploadVariantImage, deleteStorageFile } from '@/lib/storage/uploadImage'
import { cn } from '@/lib/utils'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

function imgUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`
}

export interface UploadedImage {
  id?: string
  storage_path: string
  alt_en?: string
  alt_el?: string
  sort_order: number
  is_primary: boolean
}

interface ImageUploaderProps {
  images: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
  productId: string
  variantId?: string
}

export function ImageUploader({
  images,
  onChange,
  productId,
  variantId,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true)
      setUploadError(null)

      try {
        const uploaded: UploadedImage[] = []
        for (const file of acceptedFiles) {
          const result = variantId
            ? await uploadVariantImage(file, variantId)
            : await uploadProductImage(file, productId)

          uploaded.push({
            storage_path: result.path,
            sort_order: images.length + uploaded.length,
            is_primary: images.length === 0 && uploaded.length === 0,
          })
        }
        onChange([...images, ...uploaded])
      } catch (err) {
        setUploadError('Upload failed. Please try again.')
      } finally {
        setUploading(false)
      }
    },
    [images, onChange, productId, variantId]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 5 * 1024 * 1024,
    multiple: true,
  })

  function setPrimary(index: number) {
    onChange(
      images.map((img, i) => ({ ...img, is_primary: i === index }))
    )
  }

  async function removeImage(index: number) {
    const img = images[index]
    try {
      await deleteStorageFile(img.storage_path)
    } catch {
      // Best effort — continue removing from UI even if storage delete fails
    }
    const updated = images.filter((_, i) => i !== index)
    // Ensure there's still a primary if we removed the primary
    if (img.is_primary && updated.length > 0) {
      updated[0].is_primary = true
    }
    onChange(updated)
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-stone-500 bg-stone-50'
            : 'border-stone-200 hover:border-stone-400'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 text-stone-300 mx-auto mb-2" />
        <p className="text-sm text-stone-600">
          {uploading
            ? 'Uploading...'
            : isDragActive
            ? 'Drop images here'
            : 'Drag & drop images here'}
        </p>
        <p className="text-xs text-stone-400 mt-1">or click to browse</p>
        <p className="text-xs text-stone-400 mt-0.5">JPEG, PNG, WebP — max 5MB each</p>
      </div>

      {uploadError && (
        <p className="mt-2 text-xs text-red-600">{uploadError}</p>
      )}

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {images.map((img, i) => (
            <div
              key={img.storage_path}
              className={cn(
                'relative group rounded-lg overflow-hidden border-2',
                img.is_primary ? 'border-stone-900' : 'border-stone-200'
              )}
            >
              <div className="aspect-square relative">
                <Image
                  src={imgUrl(img.storage_path)}
                  alt={img.alt_en ?? 'Product image'}
                  fill
                  sizes="100px"
                  className="object-cover"
                />
              </div>

              {/* Actions overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPrimary(i)}
                  className="h-7 w-7 rounded-full bg-white/90 flex items-center justify-center"
                  title="Set as primary"
                >
                  <Star
                    className={cn(
                      'h-3.5 w-3.5',
                      img.is_primary ? 'fill-yellow-400 text-yellow-400' : 'text-stone-600'
                    )}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="h-7 w-7 rounded-full bg-white/90 flex items-center justify-center"
                  title="Remove image"
                >
                  <X className="h-3.5 w-3.5 text-stone-600" />
                </button>
              </div>

              {img.is_primary && (
                <div className="absolute top-1 left-1 bg-stone-900 text-white text-[9px] px-1 rounded">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
