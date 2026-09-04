"use client"

import { useCallback, useEffect, useRef, useState } from 'react'

interface Item {
  id: number
  name: string
  variant: string | null
  quantity: number
  unit_price: number
  addons: { name: string; price: number }[]
  cooking_request: string | null
}

interface Order {
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
  items: Item[]
}

const FLOW: Record<string, { next?: string; label: string; tone: string }> = {
  new: { next: 'accepted', label: 'New', tone: 'bg-red-100 text-red-700' },
  accepted: { next: 'preparing', label: 'Accepted', tone: 'bg-amber-100 text-amber-800' },
  preparing: { next: 'out', label: 'Preparing', tone: 'bg-blue-100 text-blue-700' },
  out: { next: 'delivered', label: 'Out for delivery', tone: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'Delivered', tone: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', tone: 'bg-muted text-muted-foreground' },
}
const NEXT_LABEL: Record<string, string> = {
  accepted: 'Accept',
  preparing: 'Start preparing',
  out: 'Send out',
  delivered: 'Mark delivered',
}

/**
 * Loud repeating alarm: a siren built in code plus a spoken announcement.
 *
 * The siren is one long looping AudioBuffer rather than a timer, because
 * browsers throttle timers in background tabs but keep audio playing.
 */
function useAlarm() {
  const ctxRef = useRef<AudioContext | null>(null)
  const nodeRef = useRef<AudioBufferSourceNode | null>(null)
  const speakRef = useRef<number | null>(null)
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

  /** One 3.2s cycle: rising-falling siren twice, then a gap for the voice. */
  const buildCycle = (ctx: AudioContext) => {
    const rate = ctx.sampleRate
    const seconds = 3.2
    const buf = ctx.createBuffer(1, Math.floor(rate * seconds), rate)
    const d = buf.getChannelData(0)
    let phase = 0

    for (let i = 0; i < d.length; i++) {
      const t = i / rate
      let sample = 0

      // two siren sweeps in the first 1.6s, silence after that
      if (t < 1.6) {
        const cycle = t % 0.8
        const f = 620 + 680 * Math.sin((cycle / 0.8) * Math.PI)
        phase += (2 * Math.PI * f) / rate
        // square-ish tone carries much further than a pure sine
        const square = Math.sign(Math.sin(phase))
        const sine = Math.sin(phase)
        sample = 0.55 * square + 0.45 * sine

        // short fades so it does not click
        const env =
          Math.min(1, (cycle < 0.4 ? cycle : 0.8 - cycle) / 0.04) * 0.9
        sample *= Math.max(0, env)
      }
      d[i] = sample
    }
    return buf
  }

  const speak = useCallback(() => {
    try {
      const s = window.speechSynthesis
      if (!s) return
      s.cancel()
      const u = new SpeechSynthesisUtterance('New order. New order at Kabab Kitchen.')
      u.rate = 1.05
      u.pitch = 1.1
      u.volume = 1
      s.speak(u)
    } catch {
      /* voice is a bonus; the siren still plays */
    }
  }, [])

  const start = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx || nodeRef.current) return

    const src = ctx.createBufferSource()
    src.buffer = buildCycle(ctx)
    src.loop = true

    // compressor then a boosted gain: loud without the clipping buzz
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -18
    comp.ratio.value = 12
    const gain = ctx.createGain()
    gain.gain.value = 2.4

    src.connect(comp).connect(gain).connect(ctx.destination)
    src.start()
    nodeRef.current = src

    speak()
    speakRef.current = window.setInterval(speak, 3200)
  }, [speak])

  const stop = useCallback(() => {
    try {
      nodeRef.current?.stop()
    } catch {
      /* already stopped */
    }
    nodeRef.current = null
    if (speakRef.current) {
      window.clearInterval(speakRef.current)
      speakRef.current = null
    }
    try {
      window.speechSynthesis?.cancel()
    } catch {
      /* ignore */
    }
  }, [])

  const test = useCallback(() => {
    start()
    window.setTimeout(stop, 3400)
  }, [start, stop])

  // Any click counts as the gesture browsers require, so the alarm works even
  // if nobody notices the banner.
  useEffect(() => {
    if (armed) return
    const onAny = () => arm()
    document.addEventListener('click', onAny, { once: true })
    return () => document.removeEventListener('click', onAny)
  }, [armed, arm])

  useEffect(() => () => stop(), [stop])
  return { armed, arm, start, stop, test }
}

export function OrdersTab({ adminKey }: { adminKey: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [today, setToday] = useState<{ orders: number; sales: number } | null>(null)
  const [open, setOpen] = useState<Order | null>(null)
  const [date, setDate] = useState('')
  const [err, setErr] = useState('')
  const [loaded, setLoaded] = useState(false)
  const alarm = useAlarm()
  const seen = useRef<Set<string>>(new Set())

  // ask once; a notification also fires when the tab is in the background
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  const load = useCallback(async () => {
    try {
      const qs = date ? '?date=' + date : '?scope=live'
      const res = await fetch('/api/orders' + qs, { headers: { 'x-admin-key': adminKey } })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setErr(d.error || 'Could not load orders.')
        return
      }
      const d = await res.json()
      const incoming: Order[] = d.orders || []

      // notify once per order, and only for ones that arrived after load
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
            /* notifications are a bonus, never a requirement */
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
  }, [adminKey, date])

  // poll: serverless cannot push, so the panel checks every 10 seconds
  useEffect(() => {
    load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [load])

  // ring while anything is still unaccepted
  const newCount = orders.filter(o => o.status === 'new').length
  useEffect(() => {
    if (!alarm.armed || date) return
    if (newCount > 0) alarm.start()
    else alarm.stop()
  }, [newCount, alarm, date])

  async function setStatus(o: Order, status: string) {
    setOrders(prev => prev.map(x => (x.id === o.id ? { ...x, status } : x)))
    if (open?.id === o.id) setOpen({ ...open, status })
    try {
      await fetch('/api/orders/' + o.id, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ status }),
      })
    } finally {
      load()
    }
  }

  const time = (s: string) =>
    new Date(s).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-3">
      {alarm.armed ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-green-300 bg-green-50 p-3">
          <p className="text-sm font-medium text-green-800">
            Alarm is on. Siren plus a spoken alert, repeating until you accept or reject.
          </p>
          <button
            onClick={() => {
              alarm.stop()
              alarm.test()
            }}
            className="shrink-0 rounded-lg border border-green-400 px-3 py-1.5 text-xs text-green-800"
          >
            Test
          </button>
        </div>
      ) : (
        <button
          onClick={alarm.arm}
          className="w-full rounded-xl border border-amber-300 bg-amber-50 p-3 text-left"
        >
          <p className="text-sm font-semibold text-amber-900">Turn on the order alarm</p>
          <p className="text-xs text-amber-800">
            Browsers only allow sound after a tap. Tap here, or anywhere on this page,
            and it will ring on every new order until you accept.
          </p>
        </button>
      )}

      {today && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border p-3">
            <p className="text-2xl font-bold">{today.orders}</p>
            <p className="text-xs text-muted-foreground">Orders today</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-2xl font-bold">Rs.{today.sales}</p>
            <p className="text-xs text-muted-foreground">Sales today</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className={'text-2xl font-bold ' + (newCount ? 'text-red-600' : '')}>
              {newCount}
            </p>
            <p className="text-xs text-muted-foreground">Waiting</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="rounded-xl border bg-background p-2 text-sm"
        />
        {date ? (
          <button onClick={() => setDate('')} className="rounded-xl border px-3 py-2 text-xs">
            Back to live
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">
            Live queue &middot; refreshes every 10s
          </span>
        )}
      </div>

      {err && <p className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">{err}</p>}

      <div className="space-y-2">
        {orders.map(o => {
          const f = FLOW[o.status] || FLOW.new
          return (
            <div
              key={o.id}
              className={
                'rounded-xl border p-3 ' +
                (o.status === 'new' ? 'border-red-300 bg-red-50/40' : '')
              }
            >
              <button onClick={() => setOpen(o)} className="w-full text-left">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {o.code}
                      <span className="ml-2 font-normal text-muted-foreground">
                        {time(o.created_at)}
                      </span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {o.customer_name} &middot; {o.items.length} item
                      {o.items.length > 1 ? 's' : ''} &middot;{' '}
                      {o.payment_method.toUpperCase()}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold">Rs.{o.total}</p>
                    <span className={'rounded-full px-2 py-0.5 text-[10px] font-semibold ' + f.tone}>
                      {f.label}
                    </span>
                  </div>
                </div>
              </button>

              {f.next && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setStatus(o, f.next!)}
                    className="flex-1 rounded-lg bg-primary p-2 text-xs font-semibold text-primary-foreground"
                  >
                    {NEXT_LABEL[f.next]}
                  </button>
                  {o.status === 'new' && (
                    <button
                      onClick={() => setStatus(o, 'cancelled')}
                      className="rounded-lg border px-3 text-xs text-red-600"
                    >
                      Reject
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {loaded && !orders.length && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {date ? 'No orders on this date.' : 'No live orders right now.'}
          </p>
        )}
      </div>

      {open && (
        <OrderDetail
          order={open}
          onClose={() => setOpen(null)}
          onStatus={s => setStatus(open, s)}
        />
      )}
    </div>
  )
}

function OrderDetail({
  order: o,
  onClose,
  onStatus,
}: {
  order: Order
  onClose: () => void
  onStatus: (s: string) => void
}) {
  const f = FLOW[o.status] || FLOW.new

  function printReceipt() {
    const lines = o.items
      .map(i => {
        let s = `${i.quantity} x ${i.name}${i.variant ? ' (' + i.variant + ')' : ''}` +
          `  Rs.${i.unit_price * i.quantity}`
        if (i.addons?.length) s += `\n     + ${i.addons.map(a => a.name).join(', ')}`
        if (i.cooking_request) s += `\n     * ${i.cooking_request}`
        return s
      })
      .join('\n')

    const html =
      '<pre style="font:12px/1.5 monospace;width:280px">' +
      ['KABAB KITCHEN', o.code, new Date(o.created_at).toLocaleString('en-IN'), '',
       o.customer_name, o.phone, o.address, '',
       '------------------------------', lines, '------------------------------',
       'Subtotal      Rs.' + o.subtotal,
       o.discount ? 'Discount     -Rs.' + o.discount : '',
       'Tax           Rs.' + o.tax,
       'Delivery      ' + (o.delivery_fee ? 'Rs.' + o.delivery_fee : 'FREE'),
       'TOTAL         Rs.' + o.total, '',
       'Payment: ' + o.payment_method.toUpperCase(), '', 'Thank you!']
        .filter(Boolean)
        .join('\n')
        .replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string)) +
      '</pre>'

    const w = window.open('', '_blank', 'width=340,height=640')
    if (!w) return
    w.document.write(html)
    w.document.close()
    w.print()
  }

  return (
    <div className="fixed inset-0 z-[95]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 mx-auto flex max-h-[90dvh] max-w-lg flex-col rounded-t-2xl bg-background">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3">
          <div>
            <p className="text-base font-bold">{o.code}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(o.created_at).toLocaleString('en-IN')}
            </p>
          </div>
          <span className={'rounded-full px-2 py-1 text-[10px] font-semibold ' + f.tone}>
            {f.label}
          </span>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
          <div className="rounded-xl border p-3">
            <p className="text-sm font-semibold">{o.customer_name}</p>
            <a href={'tel:' + o.phone} className="text-sm text-primary">
              {o.phone}
            </a>
            <p className="mt-1 text-xs text-muted-foreground">{o.address}</p>
          </div>

          <div className="divide-y rounded-xl border">
            {o.items.map(i => (
              <div key={i.id} className="p-3">
                <div className="flex justify-between gap-3">
                  <p className="text-sm font-medium">
                    {i.quantity} &times; {i.name}
                    {i.variant && (
                      <span className="ml-1 text-xs text-muted-foreground">({i.variant})</span>
                    )}
                  </p>
                  <p className="shrink-0 text-sm">Rs.{i.unit_price * i.quantity}</p>
                </div>
                {i.addons?.length > 0 && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    + {i.addons.map(a => a.name).join(', ')}
                  </p>
                )}
                {i.cooking_request && (
                  <p className="mt-0.5 text-xs font-medium text-amber-700">
                    Request: {i.cooking_request}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-xl border p-3 text-sm">
            <Row k="Subtotal" v={'Rs.' + o.subtotal} />
            {o.discount > 0 && (
              <Row k={'Discount' + (o.coupon_code ? ' (' + o.coupon_code + ')' : '')}
                   v={'-Rs.' + o.discount} />
            )}
            {o.free_item && <Row k="Free item" v={o.free_item} />}
            <Row k="Tax" v={'Rs.' + o.tax} />
            <Row k="Delivery" v={o.delivery_fee ? 'Rs.' + o.delivery_fee : 'FREE'} />
            <div className="mt-1 flex justify-between border-t pt-1 font-bold">
              <span>Total</span>
              <span>Rs.{o.total}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Payment: {o.payment_method.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2 border-t p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <button onClick={printReceipt} className="rounded-xl border px-4 py-3 text-sm">
            Receipt
          </button>
          {f.next ? (
            <button
              onClick={() => onStatus(f.next!)}
              className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
            >
              {NEXT_LABEL[f.next]}
            </button>
          ) : (
            <button onClick={onClose} className="flex-1 rounded-xl border px-4 py-3 text-sm">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{k}</span>
      <span className="text-foreground">{v}</span>
    </div>
  )
}
