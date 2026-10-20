'use client'

import React from 'react'
import { t, type TranslationKey, type Language } from '@/i18n/translations'
import { MapPin, Star, Heart, Leaf, Waves, Sun, Camera, Building2 } from 'lucide-react'

interface Place {
  name: string
  descKey: TranslationKey
  icon: any
}

const PLACES: Place[] = [
  {
    name: 'Mji Mkongwe (Stone Town)',
    descKey: 'place1Desc',
    icon: Building2,
  },
  {
    name: 'Nyumba ya Maajabu',
    descKey: 'place2Desc',
    icon: Camera,
  },
  {
    name: 'Bustani ya Forodhani',
    descKey: 'place3Desc',
    icon: Sun,
  },
  {
    name: 'Ngome Kongwe (Old Fort)',
    descKey: 'place4Desc',
    icon: Building2,
  },
  {
    name: 'Msitu wa Jozani',
    descKey: 'place5Desc',
    icon: Leaf,
  },
]

function getPlaceColor(index: number): string {
  const colors = [
    'from-amber-500 to-orange-500',
    'from-emerald-500 to-teal-500',
    'from-sky-500 to-blue-500',
    'from-violet-500 to-purple-500',
    'from-rose-500 to-rose-500',
  ]
  return colors[index % 5]
}

interface ZanzibarDiscoveryProps {
  lang: Language
}

export default function ZanzibarDiscovery({ lang }: ZanzibarDiscoveryProps) {
  return (
    <section className="section dark:bg-ink-950">
      <div className="page-container">
        <div className="text-center max-w-xl mx-auto mb-8">
          <p className="text-brand-600 dark:text-brand-300 text-xs font-bold uppercase tracking-widest mb-2">
            {t('zanzibarPride', lang)}
          </p>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-ink-900 dark:text-white">
            {t('zanzibarTitle', lang)}
          </h2>
          <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">
            {t('zanzibarSubtitle', lang)}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {PLACES.map((place, i) => (
            <div
              key={place.name}
              className={`relative rounded-2xl overflow-hidden group ${i === 0 ? 'col-span-2 row-span-2 aspect-square sm:aspect-auto' : 'aspect-square'}`}
            >
              <div className={`absolute inset-0 ${getPlaceColor(i)}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 p-3 relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    {React.createElement(place.icon, { className: 'w-5 h-5 text-white' })}
                  </div>
                  <p className="text-white font-bold text-sm leading-tight">{place.name}</p>
                </div>
                <p className="text-white/80 text-[11px] leading-snug hidden sm:block mt-0.5">{t(place.descKey, lang)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

