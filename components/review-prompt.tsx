"use client"

import { useState } from 'react'
import { Star, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Shown right after an order is sent, so the moment is fresh. */
export function ReviewPrompt({ name, onClose }: { name?: string; onClose: () => void }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!rating) return
    setBusy(true)
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rating, comment, name }),
      })
      setSent(true)
    } catch {
      setSent(true) // never trap the customer on a failed network call
    } finally {
      setBusy(false)
    }
  }

  const labels = ['', 'Poor', 'Not great', 'Fine', 'Good', 'Excellent']

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full rounded-t-2xl bg-background p-5 sm:max-w-sm sm:rounded-2xl">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-muted"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        {sent ? (
          <div className="py-6 text-center">
            <p className="text-lg font-bold">Thank you</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your feedback helps the kitchen get better.
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-xl bg-primary p-3 font-semibold text-primary-foreground"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold">How was your order?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Optional, and it takes a few seconds.
            </p>

            <div className="mt-4 flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  aria-label={n + ' star'}
                  className="p-1"
                >
                  <Star
                    className={cn(
                      'h-8 w-8 transition-colors',
                      (hover || rating) >= n
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/40'
                    )}
                  />
                </button>
              ))}
            </div>
            <p className="mt-1 h-4 text-center text-xs text-muted-foreground">
              {labels[hover || rating]}
            </p>

            <textarea
              value={comment}
              maxLength={500}
              rows={3}
              onChange={e => setComment(e.target.value)}
              placeholder="Anything you would like the kitchen to know?"
              className="mt-3 w-full resize-none rounded-xl border bg-background p-3 text-sm"
            />

            <button
              onClick={submit}
              disabled={!rating || busy}
              className="mt-3 w-full rounded-xl bg-primary p-3 font-semibold text-primary-foreground disabled:opacity-50"
            >
              {busy ? 'Sending...' : 'Submit feedback'}
            </button>
            <button onClick={onClose} className="mt-2 w-full p-2 text-sm text-muted-foreground">
              Skip
            </button>
          </>
        )}
      </div>
    </div>
  )
}
