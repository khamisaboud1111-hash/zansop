import { Star } from 'lucide-react'
import { formatDate } from '@/utils'
import Image from 'next/image'

interface ReviewRow {
  id: string
  rating: number
  comment: string | null
  created_at: string
  buyer?: { full_name: string; avatar_url: string | null } | null
  product?: { name: string; slug: string } | null
}

export default function ReviewsSection({ reviews }: { reviews: ReviewRow[] }) {
  if (reviews.length === 0) return null

  return (
    <section className="section bg-ink-50/50 dark:bg-ink-900/40">
      <div className="page-container">
        <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-5">Wateja Wanasema Nini</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {reviews.map((r) => (
            <div key={r.id} className="card p-4 dark:bg-ink-900 dark:border-ink-800">
              <div className="flex items-center gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-ink-200 dark:text-ink-700'}`} />
                ))}
              </div>
              {r.comment && (
                <p className="text-sm text-ink-700 dark:text-ink-200 mb-3 line-clamp-3">&ldquo;{r.comment}&rdquo;</p>
              )}
              <div className="flex items-center gap-2">
                {r.buyer?.avatar_url ? (
                  <Image src={r.buyer.avatar_url} alt="" width={32} height={32} unoptimized className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-xs font-bold text-brand-700 dark:text-brand-200">
                    {r.buyer?.full_name?.charAt(0) ?? '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink-800 dark:text-ink-100 truncate">{r.buyer?.full_name ?? 'Mteja'}</p>
                  <p className="text-xs text-ink-400 truncate">
                    {r.product?.name ? `Alinunua: ${r.product.name} · ` : ''}
                    {formatDate(r.created_at, 'sw')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

