'use client'

import { useEffect, useMemo, useState } from 'react'
import { Wallet as WalletIcon, TrendingUp, ArrowUpRight, ArrowDownRight, Clock, Banknote, ChevronRight } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { PageLoader, EmptyState } from '@/components/ui'
import { formatTZS, formatDate } from '@/utils'
import toast from 'react-hot-toast'
import { useLangStore } from '@/store'
import { t, type Language } from '@/i18n/translations'

interface Transaction {
  id: string
  type: 'earning' | 'withdrawal' | 'bonus'
  amount: number
  description: string
  created_at: string
  delivery_id?: string
}

interface WithdrawalRequest {
  id: string
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  method: string
  account_number: string
  created_at: string
}

export default function RiderWalletPage() {
  const supabase = useMemo(() => createClient(), [])
  const { profile, loading: userLoading } = useUser()
  const lang = useLangStore((s) => s.lang)
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [payoutMethod, setPayoutMethod] = useState('')
  const [payoutAccountNumber, setPayoutAccountNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [showWithdrawForm, setShowWithdrawForm] = useState(false)

  useEffect(() => {
    if (!profile) return
    async function load() {
      setLoading(true)
      const [profileRes, transRes, withdrawalRes] = await Promise.all([
        supabase.from('rider_profiles').select('wallet_balance, payout_method, payout_account_number').eq('id', profile!.id).single(),
        supabase.from('rider_transactions').select('*').eq('rider_id', profile!.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('rider_withdrawals').select('*').eq('rider_id', profile!.id).order('created_at', { ascending: false }).limit(20),
      ])
      if (profileRes.data) {
        setBalance(profileRes.data.wallet_balance || 0)
        setPayoutMethod(profileRes.data.payout_method || '')
        setPayoutAccountNumber(profileRes.data.payout_account_number || '')
      }
      setTransactions((transRes.data ?? []) as Transaction[])
      setWithdrawals((withdrawalRes.data ?? []) as WithdrawalRequest[])
      setLoading(false)
    }
    load()
  }, [profile, supabase])

  const stats = useMemo(() => {
    const earned = transactions.filter(txn => txn.type === 'earning').reduce((s, txn) => s + txn.amount, 0)
    const withdrawn = transactions.filter(txn => txn.type === 'withdrawal').reduce((s, txn) => s + Math.abs(txn.amount), 0)
    const pending = withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + w.amount, 0)
    return { earned, withdrawn, pending }
  }, [transactions, withdrawals])

  async function handleWithdraw() {
    const amount = parseInt(withdrawAmount)
    if (!amount || amount <= 0 || amount > balance) {
      toast.error('Kiasi si sahihi au hakuna salio la kutosha')
      return
    }
    setWithdrawing(true)
    try {
      // The server takes the money out of the balance and records the
      // request. Doing it from here left the balance untouched, so the
      // same money could be asked for again and again.
      const res = await fetch('/api/rider/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          account_number: payoutAccountNumber || '',
          method: payoutMethod || 'mpesa',
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Imeshindikana kutuma ombi')
        return
      }
      toast.success('Ombi la kutoa pesa limetumwa')
      setWithdrawAmount('')
      setShowWithdrawForm(false)
      const [{ data: txns }, { data }] = await Promise.all([
        supabase.from('rider_transactions').select('*').eq('rider_id', profile!.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('rider_withdrawals').select('*').eq('rider_id', profile!.id).order('created_at', { ascending: false }).limit(20),
      ])
      setTransactions((txns ?? []) as Transaction[])
      setWithdrawals((data ?? []) as WithdrawalRequest[])
    } catch {
      toast.error('Imeshindikana kutuma ombi')
    } finally {
      setWithdrawing(false)
    }
  }

  if (userLoading || loading) return <PageLoader />

  return (
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-neutral-800">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="font-display font-black text-2xl text-white">{t('riderWallet', lang)}</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-teal-700 rounded-2xl p-6 text-white">
          <p className="text-sm text-white/70 mb-1">{t('walletBalance', lang)}</p>
          <p className="font-display font-black text-4xl mb-4">{formatTZS(balance)}</p>
          <button onClick={() => setShowWithdrawForm(!showWithdrawForm)} className="bg-white/20 hover:bg-white/30 rounded-xl py-2.5 px-4 text-sm font-semibold flex items-center gap-2 transition-colors">
            <ArrowUpRight className="w-4 h-4" /> {t('withdraw', lang)}
          </button>
        </div>

        {showWithdrawForm && (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4">
            <h3 className="font-semibold text-white mb-3">{t('withdraw', lang)}</h3>
            <div className="flex gap-2">
              <input
                type="number"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                placeholder="Kiasi (TZS)"
                className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-500 flex-1"
                min={1000}
              />
              <button onClick={handleWithdraw} disabled={withdrawing || !withdrawAmount} className="bg-white text-black font-semibold px-6 py-3 rounded-full text-sm hover:bg-neutral-200 transition-colors disabled:opacity-60">
                {withdrawing ? 'Inatuma...' : 'Tuma'}
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-2">Kiasi kidogo ni TZS 1,000</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-neutral-500">{t('totalEarnings', lang)}</span>
            </div>
            <p className="font-display font-bold text-lg text-white">{formatTZS(stats.earned)}</p>
          </div>
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="w-4 h-4 text-brand-400" />
              <span className="text-xs text-neutral-500">{t('withdrawn', lang)}</span>
            </div>
            <p className="font-display font-bold text-lg text-white">{formatTZS(stats.withdrawn)}</p>
          </div>
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-neutral-500">{t('pending', lang)}</span>
            </div>
            <p className="font-display font-bold text-lg text-white">{formatTZS(stats.pending)}</p>
          </div>
        </div>

        {withdrawals.length > 0 && (
          <div>
            <h2 className="font-semibold text-white mb-3">{t('withdrawalRequests', lang)}</h2>
            <div className="space-y-2">
              {withdrawals.map(w => (
                <div key={w.id} className="bg-neutral-900 rounded-xl border border-neutral-800 p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{formatTZS(w.amount)}</p>
                    <p className="text-xs text-neutral-500">{formatDate(w.created_at)}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${
                    w.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400'
                    : w.status === 'rejected' ? 'bg-red-500/20 text-red-400'
                    : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {w.status === 'approved' ? 'Imekubaliwa' : w.status === 'rejected' ? 'Imekataliwa' : 'Inasubiri'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="font-semibold text-white mb-3">{t('transactionHistory', lang)}</h2>
          {transactions.length === 0 ? (
            <EmptyState icon={<Banknote className="w-10 h-10" />} title="Hakuna miamala" description="Mapato yako yataonekana hapa" />
          ) : (
            <div className="space-y-1">
              {transactions.map(tr => (
                <div key={tr.id} className="flex items-center gap-3 py-3 border-b border-neutral-800 last:border-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    tr.type === 'earning' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {tr.type === 'earning' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{tr.description}</p>
                    <p className="text-xs text-neutral-500">{formatDate(tr.created_at)}</p>
                  </div>
                  <span className={`font-display font-bold text-sm ${tr.type === 'earning' ? 'text-emerald-400' : 'text-neutral-400'}`}>
                    {tr.type === 'earning' ? '+' : '-'}{formatTZS(Math.abs(tr.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

