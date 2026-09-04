"use client"

import { useEffect, useState } from 'react'

/**
 * Announcements show as a bar on the menu. Push goes to phones that opted in.
 * They are deliberately separate: posting a note should not wake everyone up.
 */
export function PromoteTab({ adminKey }: { adminKey: string }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [current, setCurrent] = useState<any>(null)
  const [subs, setSubs] = useState<{ subscribers: number; ready: boolean } | null>(null)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/announcements')
      .then(r => r.json())
      .then(d => setCurrent(d.announcement))
      .catch(() => {})
    fetch('/api/push/send', { headers: { 'x-admin-key': adminKey } })
      .then(r => r.json())
      .then(setSubs)
      .catch(() => {})
  }, [adminKey])

  async function post(alsoPush: boolean) {
    if (!title.trim()) return
    setBusy(true)
    setMsg('')
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ title, body }),
      })
      const d = await res.json()
      if (!res.ok) {
        setMsg(d.error || 'Could not post.')
        return
      }
      setCurrent(d.announcement)

      if (alsoPush) {
        const p = await fetch('/api/push/send', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-admin-key': adminKey },
          body: JSON.stringify({ title, body }),
        })
        const pd = await p.json()
        setMsg(
          p.ok
            ? 'Posted, and sent to ' + pd.sent + ' of ' + pd.total + ' phones.'
            : pd.error || 'Posted, but the notification failed.'
        )
      } else {
        setMsg('Posted. It shows at the top of the menu.')
      }
      setTitle('')
      setBody('')
    } catch {
      setMsg('Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  async function takeDown() {
    setBusy(true)
    try {
      await fetch('/api/announcements', { method: 'DELETE', headers: { 'x-admin-key': adminKey } })
      setCurrent(null)
      setMsg('Taken down.')
    } finally {
      setBusy(false)
    }
  }

  const IDEAS = [
    ['Fresh off the grill', 'Seekh kababs going out hot right now. Order before the rush.'],
    ['Weekend special', 'Mutton kababs are on today. They do not last long.'],
    ['Free delivery today', 'No minimum, no code. Just order.'],
    ['Late night craving?', 'Kitchen is open till 11. We know why you are here.'],
  ]

  return (
    <div className="space-y-4">
      {current && (
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-3">
          <p className="text-xs font-semibold text-muted-foreground">Showing on the menu now</p>
          <p className="mt-1 text-sm font-semibold">{current.title}</p>
          {current.body && <p className="text-xs text-muted-foreground">{current.body}</p>}
          <button onClick={takeDown} disabled={busy} className="mt-2 text-xs text-red-600">
            Take it down
          </button>
        </div>
      )}

      <div className="space-y-2 rounded-xl border p-3">
        <p className="text-sm font-semibold">Post something</p>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={60}
          placeholder="Headline"
          className="w-full rounded-lg border bg-background p-2.5 text-sm"
        />
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          maxLength={140}
          rows={2}
          placeholder="One more line (optional)"
          className="w-full resize-none rounded-lg border bg-background p-2.5 text-sm"
        />

        <div className="flex flex-wrap gap-1.5">
          {IDEAS.map(([t, b]) => (
            <button
              key={t}
              onClick={() => {
                setTitle(t)
                setBody(b)
              }}
              className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground"
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => post(false)}
            disabled={busy || !title.trim()}
            className="flex-1 rounded-lg border p-2.5 text-sm font-medium disabled:opacity-50"
          >
            Post to menu
          </button>
          <button
            onClick={() => post(true)}
            disabled={busy || !title.trim() || !subs?.subscribers}
            className="flex-1 rounded-lg bg-primary p-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            Post and notify
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          {subs?.ready === false
            ? 'Notifications are off: VAPID keys are not set. See SETUP-PUSH.md.'
            : (subs?.subscribers ?? 0) + ' phones can be notified.'}
        </p>
        {msg && <p className="text-xs font-medium">{msg}</p>}
      </div>

      <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
        Keep it to one or two a week. People who feel spammed turn notifications off and
        you do not get them back.
      </p>
    </div>
  )
}
