'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Bell, BellOff, Loader2 } from 'lucide-react'

// VAPID public key - generar con: npx web-push generate-vapid-keys
// y configurar también VAPID_PRIVATE_KEY en Supabase Edge Functions env vars
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

export default function PushSubscribe() {
  const [status, setStatus] = useState<'unknown'|'denied'|'granted'|'loading'>('unknown')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('denied')
      return
    }
    setStatus(Notification.permission as any)
    // Check if already subscribed
    navigator.serviceWorker.ready.then(reg => {
      reg.pushManager.getSubscription().then(sub => setSubscribed(!!sub))
    })
  }, [])

  async function suscribir() {
    if (!VAPID_PUBLIC_KEY) {
      alert('Para activar las notificaciones push, configura la variable NEXT_PUBLIC_VAPID_PUBLIC_KEY')
      return
    }
    setStatus('loading')
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setStatus('denied'); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })

      const { data: { user } } = await supabase.auth.getUser()
      const { data: emp } = await supabase.from('empleados').select('id').eq('user_id', user!.id).single()
      await supabase.from('push_subscriptions').upsert({
        empleado_id: (emp as any).id,
        subscription: sub.toJSON(),
        user_agent: navigator.userAgent.substring(0, 200)
      })

      setStatus('granted')
      setSubscribed(true)
    } catch (e: any) {
      console.error('Push subscribe error:', e)
      setStatus('denied')
    }
  }

  async function desuscribir() {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await sub.unsubscribe()
      const { data: { user } } = await supabase.auth.getUser()
      const { data: emp } = await supabase.from('empleados').select('id').eq('user_id', user!.id).single()
      await supabase.from('push_subscriptions').delete()
        .eq('empleado_id', (emp as any).id)
        .eq('endpoint', sub.endpoint)
    }
    setSubscribed(false)
    setStatus('unknown')
  }

  function urlBase64ToUint8Array(base64: string) {
    const padding = '='.repeat((4 - base64.length % 4) % 4)
    const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
    const raw = atob(b64)
    return Uint8Array.from(Array.from(raw).map(c => c.charCodeAt(0)))
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null

  return (
    <div className="flex items-center gap-2">
      {subscribed ? (
        <button onClick={desuscribir} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-500 transition-colors">
          <BellOff className="w-3.5 h-3.5" />
          Desactivar notificaciones
        </button>
      ) : (
        <button onClick={suscribir} disabled={status==='loading'||status==='denied'}
          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-40">
          {status==='loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
          {status==='denied' ? 'Notificaciones bloqueadas' : 'Activar notificaciones'}
        </button>
      )}
    </div>
  )
}
