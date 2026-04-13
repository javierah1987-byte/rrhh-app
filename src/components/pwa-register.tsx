'use client'
import { useEffect } from 'react'

export function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        console.log('SW registered:', reg.scope)
      }).catch(err => {
        console.warn('SW registration failed:', err)
      })
    }
  }, [])
  return null
}