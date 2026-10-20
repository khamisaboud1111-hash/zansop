'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Video, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/utils'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'
import toast from 'react-hot-toast'

interface ProductVideoUploadProps {
  productId: string
  onVideoUploaded?: (video: any) => void
}

export default function ProductVideoUpload({ productId, onVideoUploaded }: ProductVideoUploadProps) {
  const { lang } = useLangStore()
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [duration, setDuration] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbInputRef = useRef<HTMLInputElement>(null)

  const handleVideoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid video format. Use MP4, WebM, or MOV')
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video too large. Maximum 50MB')
      return
    }

    setVideoFile(file)
    setPreviewUrl(URL.createObjectURL(file))

    // Get duration
    if (videoRef.current) {
      videoRef.current.src = URL.createObjectURL(file)
    }
  }, [])

  const handleThumbnailSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid image format. Use JPEG, PNG, or WebP')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Thumbnail too large. Maximum 5MB')
      return
    }

    setThumbnailFile(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }, [])

  const handleDurationChange = () => {
    if (videoRef.current) {
      setDuration(Math.round(videoRef.current.duration))
    }
  }

  const removeVideo = () => {
    setVideoFile(null)
    setPreviewUrl(null)
    setDuration(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (videoRef.current) videoRef.current.src = ''
  }

  const removeThumbnail = () => {
    setThumbnailFile(null)
    setThumbnailPreview(null)
    if (thumbInputRef.current) thumbInputRef.current.value = ''
  }

  const handleUpload = async () => {
    if (!videoFile) {
      toast.error('Please select a video')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('video', videoFile)
      if (thumbnailFile) formData.append('thumbnail', thumbnailFile)
      if (caption) formData.append('caption', caption)
      if (hashtags) formData.append('hashtags', hashtags)
      formData.append('duration', duration.toString())

      const response = await fetch(`/api/products/${productId}/videos`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      toast.success(t('videoUploaded', lang))
      onVideoUploaded?.(data.video)

      // Reset form
      setVideoFile(null)
      setThumbnailFile(null)
      setCaption('')
      setHashtags('')
      setDuration(0)
      setPreviewUrl(null)
      setThumbnailPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (thumbInputRef.current) thumbInputRef.current.value = ''
    } catch (error) {
      console.error('Video upload error:', error)
      toast.error(error instanceof Error ? error.message : t('uploadFailed', lang))
    } finally {
      setUploading(false)
    }
  }

  if (!videoFile) {
    return (
      <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center bg-muted/30 hover:border-brand-300 dark:hover:border-brand-600 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={handleVideoSelect}
          className="hidden"
        />
        <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="font-medium text-foreground mb-1">{t('uploadProductVideo', lang)}</p>
        <p className="text-sm text-muted-foreground mb-4">
          {t('videoUploadHint', lang)}
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Upload className="w-4 h-4" /> {t('selectVideo', lang)}
        </button>
        <p className="text-xs text-muted-foreground mt-3 max-w-xs mx-auto">
          {t('videoRequirements', lang)}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">{t('videoPreview', lang)}</h3>
        <button
          onClick={removeVideo}
          className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
        <video
          ref={videoRef}
          src={previewUrl!}
          controls
          onLoadedMetadata={handleDurationChange}
          className="w-full h-full"
        />
        {thumbnailPreview && (
          <img
            src={thumbnailPreview}
            alt="Thumbnail"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('thumbnail', lang)} <span className="text-muted-foreground">({t('optional', lang)})</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              ref={thumbInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleThumbnailSelect}
              className="hidden"
            />
            {thumbnailPreview ? (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                <button
                  onClick={removeThumbnail}
                  className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => thumbInputRef.current?.click()}
                className="btn-secondary w-20 h-20 rounded-lg flex items-center justify-center flex-shrink-0"
              >
                <Upload className="w-5 h-5" />
              </button>
            )}
            <span className="text-sm text-muted-foreground">{t('thumbnailHint', lang)}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">{t('caption', lang)}</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={t('captionPlaceholder', lang)}
            rows={3}
            className="input w-full resize-y"
            maxLength={2200}
          />
          <p className="text-xs text-muted-foreground text-right">{caption.length}/2200</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">{t('hashtags', lang)}</label>
          <input
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder={t('hashtagsPlaceholder', lang)}
            className="input"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t('hashtagsHint', lang)}
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Video className="w-4 h-4" />
          <span>{t('duration', lang)}: {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}</span>
          <span className="text-brand-500">•</span>
          <span>{t('maxDuration', lang).replace('{seconds}', '60')}</span>
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="btn-primary w-full py-3"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {t('uploading', lang)}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              {t('uploadVideo', lang)}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

