'use client'

import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'

interface ProfileRowProps {
  icon: React.ReactNode
  label: string
  value: string
  editing: boolean
  editValue: string
  onEditValue: (v: string) => void
  onStartEdit: () => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  isSelect?: boolean
  selectOptions?: { value: string; label: string }[]
}

export function ProfileRow({
  icon, label, value, editing, editValue, onEditValue, onStartEdit, onSave, onCancel, saving, isSelect, selectOptions,
}: ProfileRowProps) {
  const lang = useLangStore((s) => s.lang)

  if (editing) {
    return (
      <div className="px-4 py-3 bg-brand-50/50 dark:bg-brand-950/20">
        <p className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-2">{label}</p>
        {isSelect && selectOptions ? (
          <select value={editValue} onChange={(e) => onEditValue(e.target.value)} className="input dark:bg-ink-800 dark:border-ink-700 dark:text-white text-sm">
            <option value="">{t('selectOption', lang)}</option>
            {selectOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : (
          <input value={editValue} onChange={(e) => onEditValue(e.target.value)} className="input dark:bg-ink-800 dark:border-ink-700 dark:text-white text-sm" autoFocus />
        )}
        <div className="flex gap-2 mt-2">
          <button onClick={onSave} disabled={saving} className="text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/30 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors">
            {saving ? t('savingLabel', lang) : t('save', lang)}
          </button>
          <button onClick={onCancel} className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-lg hover:bg-ink-100 transition-colors">{t('cancel', lang)}</button>
        </div>
      </div>
    )
  }

  return (
    <button onClick={onStartEdit} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-colors text-left group">
      <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/30 transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
      <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
      </svg>
    </button>
  )
}

