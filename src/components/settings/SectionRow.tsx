'use client'

interface SectionRowProps {
  icon: React.ReactNode
  label: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

export function SectionRow({
  icon, label, expanded, onToggle, children,
}: SectionRowProps) {
  return (
    <div>
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-colors text-left">
        <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <span className="flex-1 text-sm font-semibold text-foreground">{label}</span>
        <svg className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {expanded && children}
    </div>
  )
}

