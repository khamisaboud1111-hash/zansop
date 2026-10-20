'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, MessageSquare, Truck, Shield, Package } from 'lucide-react'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'
import { cn } from '@/utils'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { SectionRow } from './SectionRow'
import toast from 'react-hot-toast'

interface NotificationPreference {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  category: 'orders' | 'messages' | 'promotions' | 'delivery' | 'security'
}

const preferences: NotificationPreference[] = [
  {
    id: 'order_updates',
    label: 'Order Updates',
    description: 'Get notified about order status changes, confirmations, and delivery updates',
    icon: <Package className="w-5 h-5" />,
    category: 'orders'
  },
  {
    id: 'message_notifications',
    label: 'Messages',
    description: 'Receive notifications when you get new messages from buyers or sellers',
    icon: <MessageSquare className="w-5 h-5" />,
    category: 'messages'
  },
  {
    id: 'promotional_emails',
    label: 'Promotions & Deals',
    description: 'Get notified about special offers, discounts, and seasonal sales',
    icon: <Mail className="w-5 h-5" />,
    category: 'promotions'
  },
  {
    id: 'delivery_updates',
    label: 'Delivery Tracking',
    description: 'Real-time updates on your delivery status and rider location',
    icon: <Truck className="w-5 h-5" />,
    category: 'delivery'
  },
  {
    id: 'security_alerts',
    label: 'Security Alerts',
    description: 'Important security notifications about your account',
    icon: <Shield className="w-5 h-5" />,
    category: 'security'
  }
]

export function NotificationPreferences() {
  const { profile } = useUser()
  const lang = useLangStore((s) => s.lang)
  const [settings, setSettings] = useState<Record<string, { push: boolean; email: boolean; sms: boolean }>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    loadSettings()
  }, [profile])

  const loadSettings = async () => {
    if (!profile) return
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', profile.id)
      
      if (data) {
        const loaded: Record<string, { push: boolean; email: boolean; sms: boolean }> = {}
        data.forEach(pref => {
          loaded[pref.type] = { push: pref.push, email: pref.email, sms: pref.sms }
        })
        setSettings(loaded)
      } else {
        const defaults: Record<string, { push: boolean; email: boolean; sms: boolean }> = {}
        preferences.forEach(p => {
          defaults[p.id] = { push: true, email: true, sms: false }
        })
        setSettings(defaults)
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (prefId: string, type: 'push' | 'email' | 'sms', value: boolean) => {
    if (!profile) return
    
    const newSettings = {
      ...settings,
      [prefId]: { ...settings[prefId], [type]: value }
    }
    setSettings(newSettings)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: profile.id,
          type: prefId,
          push: newSettings[prefId].push,
          email: newSettings[prefId].email,
          sms: newSettings[prefId].sms,
          updated_at: new Date().toISOString()
        })
      
      if (error) {
        setSettings(settings)
        toast.error('Failed to update preference')
      }
    } catch (error) {
      setSettings(settings)
      toast.error('Failed to update preference')
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-sm border border-ink-100 dark:border-ink-800 overflow-hidden">
        <div className="px-4 py-4 border-b border-ink-100 dark:border-ink-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
              <Bell className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t('notifications', lang)}</h3>
              <p className="text-sm text-muted-foreground">{t('manageNotifications', lang)}</p>
            </div>
          </div>
        </div>
        <div className="px-4 py-4 space-y-4">
          {preferences.map(() => (
            <div key="skeleton" className="flex items-center justify-between p-3 bg-muted/50 rounded-xl animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted" />
                <div className="flex-1">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded mt-1" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-12 h-6 bg-muted rounded-full" />
                <div className="w-12 h-6 bg-muted rounded-full" />
                <div className="w-12 h-6 bg-muted rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-sm border border-ink-100 dark:border-ink-800 overflow-hidden">
      <div className="px-4 py-4 border-b border-ink-100 dark:border-ink-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
            <Bell className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{t('notifications', lang)}</h3>
            <p className="text-sm text-muted-foreground">{t('manageNotifications', lang)}</p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-ink-100 dark:divide-ink-800">
        {preferences.map((pref) => {
          const prefSettings = settings[pref.id] ?? { push: true, email: true, sms: false }
          return (
            <div key={pref.id} className="px-4 py-4 hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-colors">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                    {pref.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{t(pref.label, lang)}</p>
                    <p className="text-sm text-muted-foreground truncate">{t(pref.description, lang)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Bell className="w-3.5 h-3.5" />
                    <input
                      type="checkbox"
                      checked={prefSettings.push}
                      onChange={(e) => handleToggle(pref.id, 'push', e.target.checked)}
                      className="w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" />
                    <input
                      type="checkbox"
                      checked={prefSettings.email}
                      onChange={(e) => handleToggle(pref.id, 'email', e.target.checked)}
                      className="w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                    />
                  </label>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

