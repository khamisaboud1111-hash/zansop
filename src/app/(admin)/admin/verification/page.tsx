'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, X, FileText, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PageLoader, EmptyState } from '@/components/ui'
import { formatDate } from '@/utils'
import type { SellerVerificationDocument, VerificationStatus } from '@/types'
import toast from 'react-hot-toast'

interface DocRow extends SellerVerificationDocument {
  seller?: { store_name: string; id: string }
}

export default function AdminVerificationQueuePage() {
  const supabase = useMemo(() => createClient(), [])
  const [docs, setDocs] = useState<DocRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | VerificationStatus>('pending')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [processing, setProcessing] = useState(false)
  const [docUrls, setDocUrls] = useState<Record<string, string>>({})
  const [openingId, setOpeningId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('seller_verification_documents')
      .select('*, seller:sellers(id, store_name)')
      .order('created_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data, error } = await q
    if (error) {
      console.error('Failed to load verification docs:', error.message)
      toast.error('Imeshindikana kupakia hati za uthibitisho')
    }
    setDocs((data as DocRow[]) ?? [])
    setLoading(false)
  }, [supabase, filter])

  useEffect(() => { load() }, [load])

  // seller-verification is a PRIVATE bucket (see migration 003) — getPublicUrl()
  // returns a URL that 400s because there's no anonymous read policy on it.
  // Generate a short-lived signed URL on demand instead, same pattern used
  // for rider documents.
  async function openDoc(doc: DocRow) {
    setOpeningId(doc.id)
    try {
      if (docUrls[doc.file_url]) {
        window.open(docUrls[doc.file_url], '_blank')
        return
      }
      const { data, error } = await supabase.storage
        .from('seller-verification')
        .createSignedUrl(doc.file_url, 300)
      if (error || !data) {
        toast.error('Imeshindikana kufungua hati')
        return
      }
      setDocUrls((prev) => ({ ...prev, [doc.file_url]: data.signedUrl }))
      window.open(data.signedUrl, '_blank')
    } finally {
      setOpeningId(null)
    }
  }

  async function approve(doc: DocRow) {
    setProcessing(true)
    await supabase.from('seller_verification_documents').update({ status: 'approved', reviewer_note: null }).eq('id', doc.id)
    if (doc.doc_type === 'national_id' && doc.seller) {
      await supabase.from('sellers').update({ national_id_verified: true }).eq('id', doc.seller.id)
    }
    if (doc.doc_type === 'business_license' && doc.seller) {
      await supabase.from('sellers').update({ business_license_verified: true }).eq('id', doc.seller.id)
    }
    toast.success('Hati imekubaliwa')
    setProcessing(false)
    load()
  }

  async function reject() {
    if (!rejectingId) return
    setProcessing(true)
    await supabase.from('seller_verification_documents')
      .update({ status: 'rejected', reviewer_note: rejectNote || 'Haikukidhi vigezo' })
      .eq('id', rejectingId)
    toast.success('Hati imekataliwa')
    setRejectingId(null)
    setRejectNote('')
    setProcessing(false)
    load()
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-black text-xl text-ink-900">Ukaguzi wa Uthibitisho</h1>
        <div className="flex gap-2">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full ${filter === f ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-600'}`}>
              {f === 'pending' ? 'Inasubiri' : f === 'approved' ? 'Imekubaliwa' : f === 'rejected' ? 'Imekataliwa' : 'Zote'}
            </button>
          ))}
        </div>
      </div>

      {docs.length === 0 ? (
        <EmptyState icon={<FileText className="w-10 h-10" />} title="Hakuna hati" description="Hakuna hati za uthibitisho katika kundi hili" />
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
            <div key={doc.id} className="card p-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="font-semibold text-sm text-ink-900">{doc.seller?.store_name ?? 'Muuzaji'}</p>
                <p className="text-xs text-ink-500">{doc.doc_type.replace('_', ' ')} · {formatDate(doc.created_at)}</p>
              </div>
              <button
                onClick={() => openDoc(doc)}
                disabled={openingId === doc.id}
                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline disabled:opacity-50"
              >
                {openingId === doc.id ? 'Inafungua...' : 'Ona hati'} <ExternalLink className="w-3 h-3" />
              </button>
              {doc.status === 'pending' && (
                <div className="flex gap-2">
                  <button disabled={processing} onClick={() => approve(doc)}
                    className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200">
                    <Check className="w-4 h-4" />
                  </button>
                  <button disabled={processing} onClick={() => setRejectingId(doc.id)}
                    className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {rejectingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setRejectingId(null)}>
          <div className="card p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-ink-900 mb-2">Sababu ya kukataa</h3>
            <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={3}
              className="input resize-none mb-3" placeholder="Mfano: Picha haijaonekana wazi" />
            <div className="flex gap-2">
              <button onClick={() => setRejectingId(null)} className="btn-secondary flex-1 justify-center">Ghairi</button>
              <button onClick={reject} disabled={processing} className="btn-primary flex-1 justify-center bg-red-500 hover:bg-red-600">Kataa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

