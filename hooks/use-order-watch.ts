"use client"

import { useCallback, useEffect, useRef, useState } from 'react'

export interface OrderItem {
  id: number
  name: string
  variant: string | null
  quantity: number
  unit_price: number
  addons: { name: string; price: number }[]
  cooking_request: string | null
}

export interface Order {
  id: number
  code: string
  status: string
  customer_name: string
  phone: string
  address: string
  payment_method: string
  coupon_code: string | null
  subtotal: number
  discount: number
  tax: number
  delivery_fee: number
  total: number
  free_item: string | null
  created_at: string
  items: OrderItem[]
}

/**
 * Voice first, siren later.
 *
 * A spoken "New order at Kabab Kitchen" every few seconds is enough when
 * someone is near the screen. Only if nobody has touched it for 30 seconds
 * does the siren start, so the kitchen is not blasted for every order.
 */
function useAlarm() {
  const ctxRef = useRef<AudioContext | null>(null)
  const sirenRef = useRef<AudioBufferSourceNode | null>(null)
  const voiceRef = useRef<number | null>(null)
  const sinceRef = useRef<number>(0)
  const [armed, setArmed] = useState(false)

  const arm = useCallback(() => {
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!ctxRef.current) ctxRef.current = new Ctx()
      ctxRef.current!.resume()
      setArmed(true)
    } catch {
      setArmed(false)
    }
  }, [])

  const speak = useCallback(() => {
    try {
      const s = window.speechSynthesis
      if (!s) return
      s.cancel()
      const u = new SpeechSynthesisUtterance('New order at Kabab Kitchen.')
      u.rate = 1.05
      u.volume = 1
      s.speak(u)
    } catch {
      /* the siren still covers us */
    }
  }, [])

  const buildSiren = (ctx: AudioContext) => {
    const rate = ctx.sampleRate
    const buf = ctx.createBuffer(1, Math.floor(rate * 3.2), rate)
    const d = buf.getChannelData(0)
    let phase = 0
    for (let i = 0; i < d.length; i++) {
      const t = i / rate
      if (t >= 1.6) {
        d[i] = 0
        continue
      }
      const cycle = t % 0.8
      const f = 620 + 680 * Math.sin((cycle / 0.8) * Math.PI)
      phase += (2 * Math.PI * f) / rate
      const env = Math.max(0, Math.min(1, (cycle < 0.4 ? cycle : 0.8 - cycle) / 0.04) * 0.9)
      d[i] = (0.55 * Math.sign(Math.sin(phase)) + 0.45 * Math.sin(phase)) * env
    }
    return buf
  }

  const startSiren = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx || sirenRef.current) return
    const src = ctx.createBufferSource()
    src.buffer = buildSiren(ctx)
    src.loop = true
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -18
    comp.ratio.value = 12
    const gain = ctx.createGain()
    gain.gain.value = 2.4
    src.connect(comp).connect(gain).connect(ctx.destination)
    src.start()
    sirenRef.current = src
  }, [])

  const start = useCallback(() => {
    if (voiceRef.current) return
    sinceRef.current = Date.now()
    speak()
    voiceRef.current = window.setInterval(() => {
      speak()
      // nobody has dealt with it for half a minute, so get louder
      if (Date.now() - sinceRef.current > 30000) startSiren()
    }, 4000)
  }, [speak, startSiren])

  const stop = useCallback(() => {
    if (voiceRef.current) {
      window.clearInterval(voiceRef.current)
      voiceRef.current = null
    }
    try {
      sirenRef.current?.stop()
    } catch {
      /* already stopped */
    }
    sirenRef.current = null
    try {
      window.speechSynthesis?.cancel()
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (armed) return
    const onAny = () => arm()
    document.addEventListener('click', onAny, { once: true })
    return () => document.removeEventListener('click', onAny)
  }, [armed, arm])

  useEffect(() => () => stop(), [stop])
  return { armed, arm, start, stop }
}

/**
 * Watches for orders no matter which admin tab is showing.
 * This lives at the dashboard level, so switching to Dishes no longer
 * silences the alarm or stops the polling.
 */
export function useOrderWatch(adminKey: string, enabled: boolean, date: string) {
  const [orders, setOrders] = useState<Order[]>([])
  const [today, setToday] = useState<{ orders: number; sales: number } | null>(null)
  const [err, setErr] = useState('')
  const [loaded, setLoaded] = useState(false)
  const seen = useRef<Set<string>>(new Set())
  const alarm = useAlarm()

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  const load = useCallback(async () => {
    if (!enabled) return
    try {
      const res = await fetch('/api/orders' + (date ? '?date=' + date : '?scope=live'), {
        headers: { 'x-admin-key': adminKey },
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setErr(d.error || 'Could not load orders.')
        return
      }
      const d = await res.json()
      const incoming: Order[] = d.orders || []

      if (loaded) {
        for (const o of incoming) {
          if (o.status !== 'new' || seen.current.has(o.code)) continue
          seen.current.add(o.code)
          try {
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              new Notification('New order ' + o.code, {
                body: o.customer_name + ' - Rs.' + o.total,
                tag: o.code,
              })
            }
          } catch {
            /* notifications are a bonus */
          }
        }
      } else {
        incoming.forEach(o => seen.current.add(o.code))
      }

      setOrders(incoming)
      setToday(d.today || null)
      setErr('')
      setLoaded(true)
    } catch {
      setErr('Could not reach the server.')
    }
  }, [adminKey, date, enabled, loaded])

  useEffect(() => {
    if (!enabled) return
    load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [load, enabled])

  // keep the panel's heartbeat fresh so checkout knows the kitchen is watching
  useEffect(() => {
    if (!enabled) return
    const beat = () =>
      fetch('/api/panel/heartbeat', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey },
      }).catch(() => {})
    beat()
    const t = setInterval(beat, 20000)
    return () => clearInterval(t)
  }, [adminKey, enabled])

  const newCount = orders.filter(o => o.status === 'new').length

  useEffect(() => {
    if (!enabled || !alarm.armed || date) return
    if (newCount > 0) alarm.start()
    else alarm.stop()
  }, [newCount, alarm, enabled, date])

  const setStatus = useCallback(
    async (id: number, status: string) => {
      setOrders(prev => prev.map(x => (x.id === id ? { ...x, status } : x)))
      try {
        await fetch('/api/orders/' + id, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', 'x-admin-key': adminKey },
          body: JSON.stringify({ status }),
        })
      } finally {
        load()
      }
    },
    [adminKey, load]
  )

  return { orders, today, err, loaded, newCount, alarm, setStatus }
}
