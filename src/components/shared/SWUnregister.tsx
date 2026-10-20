'use client'

import { useEffect } from 'react'

export default function SWUnregister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister()
          console.log('Service Worker unregistered:', registration.scope)
        })
      })
    }
  }, [])

  return null
}

