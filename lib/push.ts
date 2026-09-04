import webpush from 'web-push'

/**
 * VAPID keys identify this site to the push services.
 * Generate once with:  npx web-push generate-vapid-keys
 */
export function pushReady() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
}

export function configured() {
  if (!pushReady()) return null
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:owner@kababkitchen.in',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  return webpush
}
