import { redirect } from 'next/navigation'

/** Purana URL naye dashboard par bhej deta hai. */
export default function AdminSettingsRedirect() {
  redirect('/admin')
}
