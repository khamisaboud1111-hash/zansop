/**
 * A thin multi-color stripe band echoing the woven pattern of a Zanzibari kikoi.
 * Used sparingly as a section divider — the one recurring "signature" motif of the site.
 */
export default function KikoiStripe({ className = '' }: { className?: string }) {
  const stripes = [
    'bg-brand-500', 'bg-sand-400', 'bg-spice-500', 'bg-brand-700',
    'bg-sand-500', 'bg-spice-600', 'bg-brand-400',
  ]
  return (
    <div className={`flex h-1.5 w-full overflow-hidden ${className}`} aria-hidden="true">
      {stripes.map((c, i) => (
        <span key={i} className={`${c} flex-1`} />
      ))}
    </div>
  )
}

