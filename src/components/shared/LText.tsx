'use client'

import { useLangStore } from '@/store'
import { t, type TranslationKey } from '@/i18n/translations'

// Renders a translated key as any element. Lets server components emit
// language-reactive text without converting the whole page to a client
// component: <LText k="newProducts" as="h2" className="..." />
export default function LText({ k, as: Tag = 'span', ...rest }: { k: TranslationKey; as?: any } & any) {
  const lang = useLangStore((s) => s.lang)
  return <Tag {...rest}>{t(k, lang)}</Tag>
}

