"use client"

import { useEffect, useState } from 'react'
import { MenuData } from '@/types/menu'
import { baseMenu, applyOverrides, MenuOverrides } from '@/lib/menu-overrides'

/**
 * Returns menu.json with the admin's saved prices/photos laid on top.
 * First render uses menu.json so nothing flashes empty or breaks the build.
 */
export function useMenu(): MenuData {
  const [data, setData] = useState<MenuData>(baseMenu)

  useEffect(() => {
    let cancelled = false
    fetch('/api/menu', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then((overrides: MenuOverrides | null) => {
        if (!cancelled && overrides?.dishes) {
          setData(applyOverrides(baseMenu, overrides))
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  return data
}
