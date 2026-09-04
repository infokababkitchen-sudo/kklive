"use client"

import { useEffect, useState } from 'react'
import { Megaphone, X } from 'lucide-react'

/** Shows the owner's latest note at the top of the menu. Dismissible. */
export function AnnouncementBar() {
  const [item, setItem] = useState<{ id: number; title: string; body: string } | null>(null)
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    fetch('/api/announcements', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (!d?.announcement) return
        let dismissed = null
        try {
          dismissed = localStorage.getItem('kk-ann-dismissed')
        } catch {
          /* ignore */
        }
        if (String(d.announcement.id) === dismissed) return
        setItem(d.announcement)
        setHidden(false)
      })
      .catch(() => {})
  }, [])

  if (hidden || !item) return null

  return (
    <div className="flex items-start gap-2 border-b border-primary/20 bg-primary/5 px-4 py-2.5">
      <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{item.title}</p>
        {item.body && <p className="text-xs text-muted-foreground">{item.body}</p>}
      </div>
      <button
        onClick={() => {
          setHidden(true)
          try {
            localStorage.setItem('kk-ann-dismissed', String(item.id))
          } catch {
            /* ignore */
          }
        }}
        aria-label="Dismiss"
        className="shrink-0 p-0.5"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  )
}
