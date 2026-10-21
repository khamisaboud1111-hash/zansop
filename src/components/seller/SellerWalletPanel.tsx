'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Wallet, ArrowDownLeft, ArrowUpRight, Percent, Banknote, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatTZS } from '@/utils'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'
import { useSeller } from '@/hooks/useSeller'

interface WalletRow {
  id: string
  type: 'sale' | 'commission' | 'withdrawal' | 'adjustment'
  amount: number
  description: string | null
  created_at: string
}

interface WithdrawalRow {
  id: string
  amount: number
  status: string
  method: string
  account_number: string
  created_at: string
}

const TYPE_META: Record<string, { labelKey: string; icon: typeof Wallet; tone: string }> = {
  sale: { labelKey: 'saleIncome', icon: ArrowDownLeft, tone: 'text-emerald-600 dark:text-emerald-400' },
  commission: { labelKey: 'platformCommission', icon: Percent, tone: 'text-amber-600 dark:text-amber-400' },
  withdrawal: { labelKey: 'withdrawal', icon: ArrowUpRight, tone: 'text-ink-500 dark:text-ink-300' },
  adjustment: { labelKey: 'adjustment', icon: Banknote, tone: 'text-brand-600 dark:text-brand-300' },
}

export default function SellerWalletPage() {
  const lang = useLangStore((s) => s.lang)
  const supabase = useMemo(() => createClient(), [])
  const { seller } = useSeller()
  const [rows, setRows] = useState<WalletRow[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([])
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    if (!seller) return
    setLoading(true)
    const [txRes, wdRes, sellerRes] = await Promise.all([
      supabase
        .from('seller_wallet_transactions')
        .select('*')
        .eq('seller_id', seller.id)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('seller_withdrawals')
        .select('*')
        .eq('seller_id', seller.id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('sellers').select('wallet_balance').eq('id', seller.id).single(),
    ])
    setRows((txRes.data ?? []) as WalletRow[])
    setWithdrawals((wdRes.data ?? []) as WithdrawalRow[])
    setBalance(sellerRes.data?.wallet_balance ?? 0)
    setLoading(false)
  }, [seller, supabase])

  useEffect(() => { load() }, [load])

  const totals = useMemo(() => {
    const earned = rows.filter((r) => r.type === 'sale').reduce((s, r) => s + r.amount, 0)
    const commission = rows.filter((r) => r.type === 'commission').reduce((s, r) => s + Math.abs(r.amount), 0)
    const withdrawn = rows.filter((r) => r.type === 'withdrawal').reduce((s, r) => s + Math.abs(r.amount), 0)
    return { earned, commission, withdrawn }
  }, [rows])

  async function requestWithdrawal(e: React.FormEvent) {
    e.preventDefault()
    const value = Math.floor(Number(amount))
    if (!value || value <= 0) {
      toast.error(t('enterValidAmount', lang))
      return
    }
    if (value > balance) {
      toast.error(t('amountAboveBalance', lang))
      return
    }
    if (accountNumber.trim().length < 6) {
      toast.error(t('enterPhoneNumber', lang))
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/seller/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: value, account_number: accountNumber.trim(), method: 'mpesa' }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || t('withdrawalFailed', lang))
        return
      }
      toast.success(t('withdrawalRequested', lang))
      setAmount('')
      await load()
    } catch {
      toast.error(t('networkErrorOccurred', lang))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t('loading', lang)}</p>
  }

  return (
    <div className="space-y-6">
      {/* Balance */}
      <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl p-5 text-white">
        <p className="text-xs uppercase tracking-wide opacity-80">{t('availableBalance', lang)}</p>
        <p className="font-display font-black text-3xl mt-1">{formatTZS(balance)}</p>
        <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
          <div>
            <p className="opacity-80">{t('totalEarned', lang)}</p>
            <p className="font-bold text-sm">{formatTZS(totals.earned)}</p>
          </div>
          <div>
            <p className="opacity-80">{t('totalCommission', lang)}</p>
            <p className="font-bold text-sm">{formatTZS(totals.commission)}</p>
          </div>
          <div>
            <p className="opacity-80">{t('withdrawn', lang)}</p>
            <p className="font-bold text-sm">{formatTZS(totals.withdrawn)}</p>
          </div>
        </div>
      </div>

      {/* Withdraw */}
      <form onSubmit={requestWithdrawal} className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <Wallet className="w-4 h-4 text-brand-500" />
          {t('requestWithdrawal', lang)}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">{t('amount', lang)}</label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input"
              placeholder="0"
            />
          </div>
          <div>
            <label className="label">{t('mpesaNumber', lang)}</label>
            <input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="input"
              placeholder="07XXXXXXXX"
              inputMode="tel"
            />
          </div>
        </div>
        <button type="submit" disabled={submitting || balance <= 0} className="btn-primary w-full justify-center">
          {submitting ? t('submittingLabel', lang) : t('requestWithdrawal', lang)}
        </button>
        <p className="text-xs text-muted-foreground">{t('withdrawalHint', lang)}</p>
      </form>

      {/* History */}
      <div>
        <h2 className="font-semibold text-sm text-foreground mb-3">{t('walletHistory', lang)}</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noWalletActivity', lang)}</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => {
              const meta = TYPE_META[row.type] ?? TYPE_META.adjustment
              const Icon = meta.icon
              return (
                <li key={row.id} className="bg-card border border-border rounded-xl p-3 flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full bg-ink-100 dark:bg-ink-800 flex items-center justify-center flex-shrink-0 ${meta.tone}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{t(meta.labelKey, lang)}</p>
                    {row.description && (
                      <p className="text-xs text-muted-foreground">{row.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(row.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className={`text-sm font-bold ${row.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-500 dark:text-ink-300'}`}>
                    {row.amount >= 0 ? '+' : ''}{formatTZS(row.amount)}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Withdrawals */}
      {withdrawals.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-ink-400" />
            {t('withdrawalRequests', lang)}
          </h2>
          <ul className="space-y-2">
            {withdrawals.map((w) => (
              <li key={w.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{formatTZS(w.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {w.method.toUpperCase()} {w.account_number} · {new Date(w.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300 uppercase">
                  {w.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
