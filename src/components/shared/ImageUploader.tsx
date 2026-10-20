'use client'

import { useMemo, useRef, useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/utils'
import toast from 'react-hot-toast'
import Image from 'next/image'

interface ImageUploaderProps {
  bucket: 'product-images' | 'seller-logos' | 'seller-banners' | 'avatars'
  folder: string
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  label?: string
  aspectRatio?: 'square' | 'banner' | 'logo'
  maxSizeMB?: number
}

export default function ImageUploader({
  bucket,
  folder,
  value,
  onChange,
  onRemove,
  label,
  aspectRatio = 'square',
  maxSizeMB = 5,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = useMemo(() => createClient(), [])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  async function uploadFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Image must be under ${maxSizeMB}MB`)
      return
    }

    setUploading(true)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${folder}/${Date.now()}.${ext}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: false, contentType: file.type })

    if (error) {
      toast.error('Upload failed: ' + error.message)
    } else {
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
      onChange(urlData.publicUrl)
    }
    setUploading(false)
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return
    uploadFile(files[0])
  }

  const aspectClass = {
    square: 'aspect-square',
    banner: 'aspect-[3/1]',
    logo:   'aspect-square w-24',
  }[aspectRatio]

  return (
    <div className="space-y-1.5">
      {label && <label className="label">{label}</label>}
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border-2 border-dashed transition-colors cursor-pointer',
          aspectClass,
          dragOver ? 'border-brand-400 bg-brand-50' : 'border-ink-200 bg-ink-50 hover:border-brand-300 hover:bg-brand-50/50'
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
      >
        {value ? (
          <>
            <Image src={value} alt="Uploaded" width={400} height={400} unoptimized className="absolute inset-0 w-full h-full object-cover" />
            {onRemove && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove() }}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm z-10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium">Change image</span>
            </div>
          </>
        ) : uploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
            <span className="text-xs text-ink-500">Uploading...</span>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <Upload className="w-6 h-6 text-ink-400" />
            <div className="text-center">
              <p className="text-xs font-medium text-ink-600">Click or drag to upload</p>
              <p className="text-xs text-ink-400 mt-0.5">PNG, JPG up to {maxSizeMB}MB</p>
            </div>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}

