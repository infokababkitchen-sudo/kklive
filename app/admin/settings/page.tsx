"use client"

import { useState } from 'react'

export default function AdminSettingsPage() {
  const [key, setKey] = useState('')
  const [multiplier, setMultiplier] = useState('1')
  const [message, setMessage] = useState('')
  async function save() {
    const response = await fetch('/api/admin/settings?key=' + encodeURIComponent(key), { method: 'PUT', headers: { 'content-type': 'application/json', 'x-admin-key': key }, body: JSON.stringify({ rates: { multiplier: Number(multiplier) || 1 }, offers: [], availability: {} }) })
    setMessage(response.ok ? 'Settings saved.' : 'Invalid admin key.')
  }
  return <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 p-6"><div><p className="text-sm font-semibold text-primary">Kabab Kitchen</p><h1 className="text-3xl font-bold">Store settings</h1><p className="mt-2 text-sm text-muted-foreground">Update rates, offers, and availability safely from this private screen.</p></div><label className="flex flex-col gap-2 text-sm font-medium">Admin key<input type="password" value={key} onChange={e => setKey(e.target.value)} className="rounded-xl border bg-background p-3" /></label><label className="flex flex-col gap-2 text-sm font-medium">Price multiplier<input type="number" min="0.1" max="5" step="0.05" value={multiplier} onChange={e => setMultiplier(e.target.value)} className="rounded-xl border bg-background p-3" /><span className="text-xs text-muted-foreground">Use 1.2 for a temporary 20% increase.</span></label><button onClick={save} className="rounded-xl bg-primary p-3 font-semibold text-primary-foreground">Save changes</button>{message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}</main>
}
