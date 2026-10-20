'use client'

import { useEffect, useMemo, useState } from 'react'
import { ShieldCheck, Loader2, Clock, CheckCircle2, XCircle, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useSeller } from '@/hooks/useSeller'
import { PageLoader } from '@/components/ui'
import type { SellerVerificationDocument, VerificationDocType } from '@/types'
import toast from 'react-hot-toast'

const DOC_TYPES: { id: VerificationDocType; label: string; hint: string }[] = [
  { id: 'national_id', label: 'Kitambulisho cha Taifa (NIDA)', hint: 'Picha wazi ya pande mbili' },
  { id: 'business_license', label: 'Leseni ya Biashara', hint: 'Hiari, lakini inaongeza uhakika' },
  { id: 'tax_id', label: 'TIN (Nambari ya Mlipakodi)', hint: 'Hiari' },
]

export default function SellerVerificationPage() {
  const supabase = useMemo(() => createClient(), [])
  const { seller, loading: sellerLoading, refetch } = useSeller()
  const [docs, setDocs] = useState<SellerVerificationDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingType, setUploadingType] = useState<VerificationDocType | null>(null)

  async function loadDocs() {
    if (!seller) return
    const { data } = await supabase
      .from('seller_verification_documents')
      .select('*')
      .eq('seller_id', seller.id)
      .order('created_at', { ascending: false })
    setDocs(data ?? [])
    setLoading(false)
  }

  useEffect(() => { if (seller) loadDocs() }, [seller])

  async function handleUpload(docType: VerificationDocType, file: File) {
    if (!seller) return
    if (file.size > 10 * 1024 * 1024) { toast.error('Faili lazima liwe chini ya 10MB'); return }

    setUploadingType(docType)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${seller.user_id}/${docType}-${Date.now()}.${ext}`

    const { data, error } = await supabase.storage
      .from('seller-verification')
      .upload(path, file, { contentType: file.type })

    if (error) {
      toast.error('Upload imeshindwa: ' + error.message)
      setUploadingType(null)
      return
    }

    const { error: insertError } = await supabase.from('seller_verification_documents').insert({
      seller_id: seller.id,
      doc_type: docType,
      file_url: data.path,
      status: 'pending',
    })

    if (insertError) {
      toast.error(insertError.message)
    } else {
      toast.success('Hati imepakiwa, inasubiri ukaguzi')
      loadDocs()
    }
    setUploadingType(null)
  }

  if (sellerLoading || loading) return <PageLoader />
  if (!seller) return null

  const isVerified = seller.national_id_verified || docs.some(d => d.doc_type === 'national_id' && d.status === 'approved')

  return (
    <div className="space-y-6 max-w-xl">
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isVerified ? 'bg-emerald-100' : 'bg-amber-100'}`}>
            <ShieldCheck className={`w-5 h-5 ${isVerified ? 'text-emerald-600' : 'text-amber-600'}`} />
          </div>
          <div>
            <h1 className="font-display font-black text-lg text-ink-900">
              {isVerified ? 'Duka lako limethibitishwa ✓' : 'Thibitisha duka lako'}
            </h1>
            <p className="text-xs text-ink-500">
              {isVerified
                ? 'Wateja wataona alama ya "Muuzaji Aliyethibitishwa" kwenye duka lako'
                : 'Pakia hati zako ili kupata alama ya uthibitisho na kuongeza imani ya wateja'}
            </p>
          </div>
        </div>
      </div>

      {DOC_TYPES.map((dt) => {
        const existing = docs.find(d => d.doc_type === dt.id)
        return (
          <div key={dt.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="font-semibold text-ink-800 text-sm">{dt.label}</h2>
                <p className="text-xs text-ink-500 mt-0.5">{dt.hint}</p>
              </div>
              {existing && <StatusBadge status={existing.status} />}
            </div>

            {!existing || existing.status === 'rejected' ? (
              <label className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-ink-200 hover:border-brand-300 hover:bg-brand-50/50 cursor-pointer transition-colors">
                {uploadingType === dt.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                ) : (
                  <Upload className="w-4 h-4 text-ink-400" />
                )}
                <span className="text-sm text-ink-600">
                  {uploadingType === dt.id ? 'Inapakia...' : existing ? 'Pakia tena' : 'Pakia faili'}
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  disabled={uploadingType !== null}
                  onChange={(e) => e.target.files?.[0] && handleUpload(dt.id, e.target.files[0])}
                />
              </label>
            ) : (
              <p className="text-xs text-ink-400">
                {existing.status === 'pending' ? 'Hati yako iko chini ya ukaguzi.' : 'Hati imethibitishwa.'}
              </p>
            )}
            {existing?.status === 'rejected' && existing.reviewer_note && (
              <p className="text-xs text-red-500 mt-2">Sababu: {existing.reviewer_note}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') return (
    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> Imethibitishwa
    </span>
  )
  if (status === 'rejected') return (
    <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
      <XCircle className="w-3 h-3" /> Imekataliwa
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
      <Clock className="w-3 h-3" /> Inasubiri
    </span>
  )
}

