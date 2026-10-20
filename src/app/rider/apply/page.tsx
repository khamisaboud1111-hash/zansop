'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { PageLoader } from '@/components/ui'
import RiderDocumentUploader from '@/components/rider/RiderDocumentUploader'
import { useLangStore } from '@/store'
import { t, type Language } from '@/i18n/translations'
import { DismissibleAlert } from '@/components/shared/DismissibleAlert'

interface FormState {
  full_name: string
  phone_number: string
  national_id: string
  driving_license: string
  motorcycle_registration: string
  emergency_contact: string
  payout_method: 'mpesa' | 'tigo_pesa' | 'airtel_money' | 'halopesa'
  payout_account_number: string
  selfie_url: string
  license_scan_url: string
}

const STEPS = [
  { key: 'personal', label: 'Personal Info' },
  { key: 'documents', label: 'Documents' },
  { key: 'payout', label: 'Payout' },
  { key: 'review', label: 'Review' },
] as const

export default function RiderApplyPage() {
  const router = useRouter()
  const { profile, loading } = useUser()
  const lang = useLangStore((s) => s.lang)
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({
    full_name: '',
    phone_number: '',
    national_id: '',
    driving_license: '',
    motorcycle_registration: '',
    emergency_contact: '',
    payout_method: 'mpesa',
    payout_account_number: '',
    selfie_url: '',
    license_scan_url: '',
  })

  if (loading) return <PageLoader />

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-neutral-900 rounded-2xl p-8 text-center max-w-sm border border-neutral-800">
          <p className="text-neutral-300 mb-4">Tafadhali ingia kwanza kabla ya kujiunga kama dereva.</p>
          <button onClick={() => router.push('/login?redirect=/rider/apply')} className="bg-white text-black font-semibold px-6 py-3 rounded-full text-sm hover:bg-neutral-200 transition-colors">Ingia</button>
        </div>
      </div>
    )
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function updatePhone(
    key: 'phone_number' | 'emergency_contact' | 'payout_account_number',
    value: string
  ) {
    update(key, value.replace(/[\s-]/g, '') as FormState[typeof key])
  }

  const phonePattern = /^(\+?255|0)[67]\d{8}$/

  function cleanPhone(v: string) {
    return v.trim().replace(/[\s-]/g, '')
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (form.full_name.trim().length < 3) return 'Jina kamili linahitajika'
      if (!phonePattern.test(cleanPhone(form.phone_number))) return 'Namba ya simu si sahihi'
      if (!phonePattern.test(cleanPhone(form.emergency_contact))) return 'Namba ya dharura si sahihi'
    }

    if (step === 1) {
      if (form.national_id.trim().length < 5) return 'Namba ya kitambulisho inahitajika'
      if (form.driving_license.trim().length < 3) return 'Namba ya leseni inahitajika'
      if (form.motorcycle_registration.trim().length < 3) return 'Namba ya usajili wa pikipiki inahitajika'
      if (!form.selfie_url) return 'Picha ya selfie inahitajika'
      if (!form.license_scan_url) return 'Picha ya leseni inahitajika'
    }

    if (step === 2) {
      if (!phonePattern.test(cleanPhone(form.payout_account_number))) {
        return 'Namba ya akaunti ya malipo si sahihi'
      }
    }

    return null
  }

  function next() {
    const err = validateStep()
    if (err) {
      setValidationError(err)
      return
    }
    setValidationError(null)
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0))
  }

  async function submit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/rider/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Imeshindikana kutuma maombi')
        if (json.details?.length) console.error(json.details)
        setSubmitting(false)
        return
      }
      setSubmitted(true)
    } catch {
      toast.error('Hitilafu ya mtandao')
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-neutral-900 rounded-2xl p-8 text-center max-w-sm border border-neutral-800">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="font-display font-bold text-2xl text-white mb-2">Maombi Yamepokelewa!</h1>
          <p className="text-neutral-400 text-sm mb-6">
            Asante kwa kujiunga na Zanshop kama dereva. Msimamizi atahakiki vyeti vyako ndani ya saa 24-48.
            Utapokea taarifa pindi utakapothibitishwa.
          </p>
          <button onClick={() => router.push('/')} className="bg-white text-black font-semibold px-6 py-3 rounded-full text-sm hover:bg-neutral-200 transition-colors">Rudi Nyumbani</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-neutral-800">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="font-display font-black text-xl text-white text-center">{t('joinAsRider', lang)}</h1>
          <p className="text-sm text-neutral-500 text-center mt-1">Pata kipato kwa kusafirisha bidhaa Zanzibar</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  i < step ? 'bg-emerald-500 text-white'
                  : i === step ? 'bg-brand-500 text-white'
                  : 'bg-neutral-800 text-neutral-500'
                }`}>
                  {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 ${i < step ? 'bg-emerald-400' : 'bg-neutral-800'}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mt-2">
            {STEPS[step].label}
          </p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Validation Error Alert */}
        {validationError && (
          <DismissibleAlert
            message={validationError}
            onDismiss={() => setValidationError(null)}
            type="error"
            autoDismissMs={8000}
          />
        )}

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 space-y-3">
          {step === 0 && (
            <>
              <FormInput label="Jina Kamili" value={form.full_name} onChange={(v) => update('full_name', v)} placeholder="Juma Hassan Ali" />
              <FormInput label="Namba ya Simu" value={form.phone_number} onChange={(v) => updatePhone('phone_number', v)} placeholder="0712 345 678" />
              <FormInput label="Namba ya Dharura" value={form.emergency_contact} onChange={(v) => updatePhone('emergency_contact', v)} placeholder="Namba ya jamaa/rafiki" hint="Tutawasiliana naye tu wakati wa dharura" />
            </>
          )}
          {step === 1 && (
            <>
              <FormInput label="Namba ya Kitambulisho" value={form.national_id} onChange={(v) => update('national_id', v)} />
              <FormInput label="Namba ya Leseni" value={form.driving_license} onChange={(v) => update('driving_license', v)} />
              <FormInput label="Namba ya Usajili wa Pikipiki" value={form.motorcycle_registration} onChange={(v) => update('motorcycle_registration', v)} placeholder="T123 ABC" />
              <div className="grid grid-cols-2 gap-3 pt-1">
                <RiderDocumentUploader userId={profile.id} docType="selfie" value={form.selfie_url} onChange={(path) => update('selfie_url', path)} label="Selfie" />
                <RiderDocumentUploader userId={profile.id} docType="license" value={form.license_scan_url} onChange={(path) => update('license_scan_url', path)} label="License" />
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <div>
                <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 block">Njia ya Malipo</label>
                <select value={form.payout_method} onChange={(e) => update('payout_method', e.target.value as FormState['payout_method'])} className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 w-full">
                  <option value="mpesa">M-Pesa</option>
                  <option value="tigo_pesa">Tigo Pesa</option>
                  <option value="airtel_money">Airtel Money</option>
                  <option value="halopesa">Halopesa</option>
                </select>
              </div>
              <FormInput label="Namba ya Akaunti" value={form.payout_account_number} onChange={(v) => updatePhone('payout_account_number', v)} placeholder="0712 345 678" hint="Mapato yako yatatumwa hapa" />
            </>
          )}
          {step === 3 && (
            <div className="space-y-3 text-sm">
              <ReviewRow label="Jina" value={form.full_name} />
              <ReviewRow label="Simu" value={form.phone_number} />
              <ReviewRow label="Kitambulisho" value={form.national_id} />
              <ReviewRow label="Leseni" value={form.driving_license} />
              <ReviewRow label="Pikipiki" value={form.motorcycle_registration} />
              <ReviewRow label="Malipo" value={`${form.payout_method.replace('_', ' ')} — ${form.payout_account_number}`} />
              <p className="text-xs text-neutral-500 pt-2">
                Kwa kutuma, unakubali vyeti vyako vitahakikiwa na msimamizi kabla ya kuanza kupokea safari.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          {step > 0 && (
            <button onClick={back} disabled={submitting} className="bg-neutral-800 text-neutral-300 font-semibold flex-1 py-3 rounded-full text-sm inline-flex items-center justify-center gap-2 hover:bg-neutral-700 transition-colors disabled:opacity-60">
              <ChevronLeft className="w-4 h-4" /> Rudi
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={next} className="bg-white text-black font-semibold flex-1 py-3 rounded-full text-sm inline-flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors">
              Endelea <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={submit} disabled={submitting} className="bg-white text-black font-semibold flex-1 py-3 rounded-full text-sm inline-flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors disabled:opacity-60">
              {submitting ? 'Inatuma...' : 'Tuma Maombi'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function FormInput({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 block">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-500 w-full" />
      {hint && <p className="text-[10px] text-neutral-600 mt-1">{hint}</p>}
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-neutral-800 pb-2">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium text-white text-right">{value || '—'}</span>
    </div>
  )
}

