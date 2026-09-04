"use client"

import { useState } from 'react'
import type { Order } from '@/hooks/use-order-watch'



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

export function OrdersTab({
  orders,
  today,
  err,
  loaded,
  newCount,
  armed,
  onArm,
  onStatus,
  date,
  setDate,
}: {
  orders: Order[]
  today: { orders: number; sales: number } | null
  err: string
  loaded: boolean
  newCount: number
  armed: boolean
  onArm: () => void
  onStatus: (id: number, status: string) => void
  date: string
  setDate: (d: string) => void
}) {
  const [open, setOpen] = useState<Order | null>(null)

  function setStatus(o: Order, status: string) {
    onStatus(o.id, status)
    if (open?.id === o.id) setOpen({ ...open, status })
  }

  const time = (s: string) =>
    new Date(s).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-3">
      {armed ? (
        <div className="rounded-xl border border-green-300 bg-green-50 p-3">
          <p className="text-sm font-medium text-green-800">
            Alerts are on. A new order is announced aloud, and if nobody responds for
            30 seconds the siren starts.
          </p>
        </div>
      ) : (
        <button
          onClick={onArm}
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
