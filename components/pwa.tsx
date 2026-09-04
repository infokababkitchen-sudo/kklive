"use client"

import { useEffect, useState } from 'react'
import { Download, X, Bell } from 'lucide-react'

/**
 * Registers the service worker, offers "Add to home screen", and asks for
 * notification permission once the customer has actually ordered.
 */
export function PwaSetup() {
  const [prompt, setPrompt] = useState<any>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [showPush, setShowPush] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])

  // Chrome, Edge and Android fire this; iOS does not, so it shows its own tip.
  useEffect(() => {
    const onPrompt = (e: any) => {
      e.preventDefault()
      setPrompt(e)
      try {
        if (!localStorage.getItem('kk-install-dismissed')) setShowInstall(true)
      } catch {
        setShowInstall(true)
      }
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  // only ask about notifications after a first order, never on arrival
  useEffect(() => {
    const check = () => {
      try {
        if (!localStorage.getItem('kk-active-order')) return
        if (localStorage.getItem('kk-push-asked')) return
        if (typeof Notification === 'undefined' || Notification.permission !== 'default') return
        setShowPush(true)
      } catch {
        /* ignore */
      }
    }
    check()
    window.addEventListener('kk-order-placed', check)
    return () => window.removeEventListener('kk-order-placed', check)
  }, [])

  async function install() {
    if (!prompt) return
    prompt.prompt()
    await prompt.userChoice.catch(() => {})
    setPrompt(null)
    setShowInstall(false)
  }

  async function enablePush() {
    setShowPush(false)
    try {
      localStorage.setItem('kk-push-asked', '1')
    } catch {
      /* ignore */
    }
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') return
      const reg = await navigator.serviceWorker.ready
      const res = await fetch('/api/push/key')
      const { key } = await res.json()
      if (!key) return
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      })
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(sub),
      })
    } catch {
      /* notifications are optional */
    }
  }

  return (
    <>
      {showInstall && (
        <div className="fixed bottom-[calc(9rem+env(safe-area-inset-bottom))] left-3 right-3 z-[74] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-xl">
          <Download className="h-5 w-5 shrink-0 text-primary" />
          <p className="min-w-0 flex-1 text-sm">
            <span className="block font-medium">Install Kabab Kitchen</span>
            <span className="text-xs text-muted-foreground">Order faster, right from your home screen</span>
          </p>
          <button
            onClick={install}
            className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            Install
          </button>
          <button
            onClick={() => {
              setShowInstall(false)
              try {
                localStorage.setItem('kk-install-dismissed', '1')
              } catch {
                /* ignore */
              }
            }}
            aria-label="Dismiss"
            className="shrink-0 p-1"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {showPush && (
        <div className="fixed bottom-[calc(9rem+env(safe-area-inset-bottom))] left-3 right-3 z-[74] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-xl">
          <Bell className="h-5 w-5 shrink-0 text-primary" />
          <p className="min-w-0 flex-1 text-sm">
            <span className="block font-medium">Get our offers first</span>
            <span className="text-xs text-muted-foreground">Only the good stuff. No spam.</span>
          </p>
          <button
            onClick={enablePush}
            className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            Allow
          </button>
          <button
            onClick={() => {
              setShowPush(false)
              try {
                localStorage.setItem('kk-push-asked', '1')
              } catch {
                /* ignore */
              }
            }}
            aria-label="Dismiss"
            className="shrink-0 p-1"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      )}
    </>
  )
}

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}
