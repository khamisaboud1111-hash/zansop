'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import { Upload, X, Loader2, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/utils'
import toast from 'react-hot-toast'
import Image from 'next/image'

interface RiderDocumentUploaderProps {
  userId: string
  docType: 'selfie' | 'license'
  value?: string // storage path, not a public URL (bucket is private)
  onChange: (path: string) => void
  label: string
  maxSizeMB?: number
}

/**
 * Uploads to the private 'rider-documents' bucket created in Phase 8.
 * Unlike ImageUploader (used for public product/seller images), this never
 * calls getPublicUrl — the bucket is private, so we store the storage path
 * and generate short-lived signed URLs only when actually displaying the file
 * (e.g. in the admin verification queue, built in a later phase).
 */
export default function RiderDocumentUploader({
  userId,
  docType,
  value,
  onChange,
  label,
  maxSizeMB = 8,
}: RiderDocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = useMemo(() => createClient(), [])
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function uploadFile(file: File) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type)) {
      toast.error('Tuma picha (JPG/PNG) au PDF tu')
      return
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Faili lazima liwe chini ya MB ${maxSizeMB}`)
      return
    }

    setUploading(true)
    const ext = file.name.split('.').pop() ?? 'jpg'
    // Path MUST start with the user's own id — the rider-documents RLS policy
    // checks (storage.foldername(name))[1] = auth.uid() to grant access.
    const path = `${userId}/${docType}-${Date.now()}.${ext}`

    const { data, error } = await supabase.storage
      .from('rider-documents')
      .upload(path, file, { upsert: false, contentType: file.type })

    if (error) {
      toast.error('Imeshindikana kupakia: ' + error.message)
      setUploading(false)
      return
    }

    onChange(data.path)
    if (file.type.startsWith('image/')) {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(file))
    }
    setUploading(false)
    toast.success('Imepakiwa')
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return
    uploadFile(files[0])
  }

  return (
    <div className="space-y-1.5">
      <label className="label">{label}</label>
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border-2 border-dashed transition-colors cursor-pointer aspect-[4/3]',
          value ? 'border-emerald-300 bg-emerald-50' : 'border-ink-200 bg-ink-50 hover:border-brand-300 hover:bg-brand-50/50'
        )}
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            {previewUrl ? (
              <Image src={previewUrl} alt="" width={400} height={300} unoptimized className="absolute inset-0 w-full h-full object-cover opacity-90" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            )}
            <span className="relative z-10 text-xs font-semibold text-emerald-700 bg-white/90 px-2 py-1 rounded-full">
              Imepakiwa kwa usalama
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }}
              className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm z-10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : uploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
            <span className="text-xs text-ink-500">Inapakia...</span>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <Upload className="w-6 h-6 text-ink-400" />
            <p className="text-xs font-medium text-ink-600 text-center">Bonyeza kupakia picha au PDF</p>
            <p className="text-xs text-ink-400">Hadi MB {maxSizeMB} • Faragha imehifadhiwa</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}

