'use client'

import { useMemo, useRef, useState } from 'react'
import { Video, X, Loader2, Play } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/utils'
import toast from 'react-hot-toast'

interface VideoUploaderProps {
  folder: string
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  label?: string
  maxSizeMB?: number
}

export default function VideoUploader({
  folder,
  value,
  onChange,
  onRemove,
  label,
  maxSizeMB = 50,
}: VideoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = useMemo(() => createClient(), [])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  async function uploadFile(file: File) {
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file (MP4, WebM, or MOV)')
      return
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Video must be under ${maxSizeMB}MB`)
      return
    }

    setUploading(true)
    const ext = file.name.split('.').pop() ?? 'mp4'
    const path = `${folder}/${Date.now()}.${ext}`

    const { data, error } = await supabase.storage
      .from('product-videos')
      .upload(path, file, { upsert: false, contentType: file.type })

    if (error) {
      toast.error('Upload failed: ' + error.message)
    } else {
      const { data: urlData } = supabase.storage.from('product-videos').getPublicUrl(data.path)
      onChange(urlData.publicUrl)
    }
    setUploading(false)
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return
    uploadFile(files[0])
  }

  return (
    <div className="space-y-1.5">
      {label && <label className="label">{label}</label>}
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border-2 border-dashed transition-colors cursor-pointer aspect-video',
          dragOver ? 'border-brand-400 bg-brand-50' : 'border-ink-200 bg-ink-50 hover:border-brand-300 hover:bg-brand-50/50'
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
      >
        {value ? (
          <>
            <video src={value} className="absolute inset-0 w-full h-full object-cover" muted />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Play className="w-10 h-10 text-white" fill="white" />
            </div>
            {onRemove && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove() }}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm z-10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        ) : uploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
            <span className="text-xs text-ink-500">Uploading video...</span>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <Video className="w-6 h-6 text-ink-400" />
            <div className="text-center">
              <p className="text-xs font-medium text-ink-600">Click or drag to upload video</p>
              <p className="text-xs text-ink-400 mt-0.5">MP4, WebM up to {maxSizeMB}MB</p>
            </div>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}

